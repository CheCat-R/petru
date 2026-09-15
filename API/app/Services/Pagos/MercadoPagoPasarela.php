<?php

namespace App\Services\Pagos;

use App\Integraciones\MercadoPagoConfig;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig as MercadoPagoSdk;

/**
 * MercadoPago Checkout Pro: el cliente se va a MercadoPago, paga, y vuelve.
 *
 * Nos enteramos del resultado por dos caminos, a propósito:
 *  - el webhook (`WebhookMercadoPagoController`), que MercadoPago llama cuando
 *    el pago cambia de estado;
 *  - `sincronizar()`, que consulta el pago por `external_reference` cuando el
 *    cliente vuelve a la página de seguimiento. Si el webhook se demora o el
 *    hosting lo pierde, el pedido igual se confirma.
 */
class MercadoPagoPasarela implements PasarelaPago
{
    public function __construct(
        private readonly array $config,
        private readonly MercadoPagoConfig $estado,
    ) {
        MercadoPagoSdk::setAccessToken($config['access_token']);
    }

    public function nombre(): string
    {
        return $this->config['modo'] === 'test' ? 'MercadoPago (prueba)' : 'MercadoPago';
    }

    public function modo(): string
    {
        return $this->config['modo'];
    }

    public function crearPreferencia(Pedido $pedido): array
    {
        $frontend = rtrim(config('petru.frontend_url'), '/');
        $seguimiento = "{$frontend}/pedido/{$pedido->token}";

        $items = $pedido->items->map(fn ($item) => [
            'id' => $item->sku,
            'title' => $item->nombre,
            'quantity' => $item->cantidad,
            'unit_price' => (float) $item->precio_unitario,
            'currency_id' => 'ARS',
            'category_id' => 'art',
        ])->all();

        if ((float) $pedido->costo_envio > 0) {
            $items[] = [
                'id' => 'envio',
                'title' => 'Envío con embalaje blindado',
                'quantity' => 1,
                'unit_price' => (float) $pedido->costo_envio,
                'currency_id' => 'ARS',
            ];
        }

        [$nombre, $apellido] = array_pad(explode(' ', trim($pedido->nombre_cliente), 2), 2, '');

        try {
            $preferencia = (new PreferenceClient())->create([
            'items' => $items,
            'payer' => [
                'name' => $nombre,
                'surname' => $apellido,
                'email' => $pedido->email_cliente,
                'phone' => $pedido->telefono_cliente ? ['number' => preg_replace('/\D/', '', $pedido->telefono_cliente)] : null,
            ],
            'external_reference' => $pedido->numero,
            'back_urls' => [
                'success' => $seguimiento,
                'pending' => $seguimiento,
                'failure' => "{$seguimiento}?resultado=fallo",
            ],
            'auto_return' => 'approved',
            'notification_url' => url('/api/webhooks/mercadopago'),
            'statement_descriptor' => $this->config['descriptor'],
            'expires' => true,
            'expiration_date_to' => $pedido->reservado_hasta?->toIso8601String(),
            'metadata' => ['pedido_numero' => $pedido->numero, 'pedido_token' => $pedido->token],
            ]);
        } catch (\Throwable $e) {
            // Queda en el panel (Integraciones) además del log: es lo primero que
            // hay que mirar si "el botón de pagar no anda".
            $this->estado->registrarError('No se pudo crear la preferencia de pago: '.$this->describirExcepcion($e));
            throw $e;
        }

        return [
            'preferenciaId' => $preferencia->id,
            'urlPago' => $preferencia->init_point,
        ];
    }

    public function sincronizar(Pedido $pedido): bool
    {
        $pago = $this->ultimoPagoDe($pedido);

        if (! $pago) {
            return false;
        }

        return $this->aplicarPago($pedido, $pago);
    }

    /** Aplica un pago ya obtenido (desde el webhook o desde una búsqueda). */
    public function aplicarPago(Pedido $pedido, object $pago): bool
    {
        $estado = $pago->status ?? null;
        $idPago = (string) $pago->id;

        // Idempotencia: el mismo pago aplicado dos veces no hace nada.
        if ($pedido->mp_payment_id === $idPago && $pedido->estado_pago !== Pedido::PAGO_PENDIENTE) {
            return false;
        }

        return DB::transaction(function () use ($pedido, $pago, $estado, $idPago) {
            $pedido = Pedido::whereKey($pedido->id)->lockForUpdate()->with('items.producto')->first();

            if ($estado === 'approved' && $pedido->estado_pago === Pedido::PAGO_PENDIENTE) {
                $pedido->confirmarPago($idPago, $this->describirMetodo($pago));

                return true;
            }

            if (in_array($estado, ['rejected', 'cancelled'], true) && $pedido->estado_pago === Pedido::PAGO_PENDIENTE) {
                $pedido->forceFill(['mp_payment_id' => $idPago])->save();
                $pedido->rechazarPago($this->describirRechazo($pago));

                return true;
            }

            if ($estado === 'refunded' && $pedido->estado_pago === Pedido::PAGO_PAGADO) {
                // Reembolso hecho desde el panel de MercadoPago: se refleja acá.
                $pedido->forceFill([
                    'estado_pago' => Pedido::PAGO_REEMBOLSADO,
                    'reembolsado_en' => now(),
                ])->save();

                return true;
            }

            return false;
        });
    }

    private function ultimoPagoDe(Pedido $pedido): ?object
    {
        try {
            $resultado = (new PaymentClient())->search([
                'external_reference' => $pedido->numero,
                'sort' => 'date_created',
                'criteria' => 'desc',
            ]);

            $pagos = $resultado->results ?? [];

            // Un aprobado manda sobre cualquier intento rechazado anterior
            foreach ($pagos as $pago) {
                if (($pago->status ?? null) === 'approved') {
                    return $pago;
                }
            }

            return $pagos[0] ?? null;
        } catch (\Throwable $e) {
            Log::warning('MercadoPago: no se pudo consultar el pago', ['pedido' => $pedido->numero, 'error' => $e->getMessage()]);
            $this->estado->registrarError('No se pudo consultar un pago: '.$this->describirExcepcion($e));

            return null;
        }
    }

    /** El SDK envuelve la respuesta de la API; el mensaje útil suele estar adentro. */
    private function describirExcepcion(\Throwable $e): string
    {
        if ($e instanceof \MercadoPago\Exceptions\MPApiException) {
            $contenido = $e->getApiResponse()?->getContent();
            $mensaje = $contenido['message'] ?? ($contenido['cause'][0]['description'] ?? null);

            return "HTTP {$e->getStatusCode()}".($mensaje ? " · {$mensaje}" : '');
        }

        return $e->getMessage();
    }

    private function describirMetodo(object $pago): string
    {
        $tipo = $pago->payment_type_id ?? null;
        $metodo = $pago->payment_method_id ?? null;
        $ultimos = $pago->card->last_four_digits ?? null;

        $etiqueta = match ($tipo) {
            'credit_card', 'debit_card' => ucfirst((string) $metodo).($ultimos ? " •••• {$ultimos}" : ''),
            'account_money' => 'Dinero en cuenta',
            'ticket' => 'Efectivo ('.ucfirst((string) $metodo).')',
            'bank_transfer' => 'Transferencia',
            default => ucfirst((string) ($metodo ?: $tipo ?: 'pago')),
        };

        return "MercadoPago ({$etiqueta})";
    }

    private function describirRechazo(object $pago): string
    {
        $detalle = (string) ($pago->status_detail ?? '');

        return match (true) {
            str_contains($detalle, 'insufficient_amount') => 'Fondos insuficientes',
            str_contains($detalle, 'bad_filled') => 'Datos de la tarjeta incorrectos',
            str_contains($detalle, 'call_for_authorize') => 'La tarjeta pidió autorización del banco',
            str_contains($detalle, 'high_risk') => 'Rechazado por prevención de fraude',
            default => 'Rechazado por MercadoPago'.($detalle ? " ({$detalle})" : ''),
        };
    }
}
