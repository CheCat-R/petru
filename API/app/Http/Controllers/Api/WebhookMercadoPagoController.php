<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Integraciones\MercadoPagoConfig;
use App\Models\Pedido;
use App\Services\Pagos\MercadoPagoPasarela;
use App\Services\Pagos\PasarelaPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Payment\PaymentClient;

/**
 * Notificaciones de MercadoPago.
 *
 * MercadoPago avisa "el pago X cambió" — no dice a qué; hay que ir a buscarlo.
 * Nunca se confía en el cuerpo de la notificación para decidir el estado: se
 * consulta el pago por id con el access token y se aplica lo que diga la API.
 * Siempre se responde 200 rápido; si algo falla, se loguea y MercadoPago reintenta.
 */
class WebhookMercadoPagoController extends Controller
{
    public function __invoke(Request $request, PasarelaPago $pasarela, MercadoPagoConfig $config): JsonResponse
    {
        if (! $pasarela instanceof MercadoPagoPasarela) {
            return response()->json(['message' => 'MercadoPago no está configurado.'], 200);
        }

        if (! $this->firmaValida($request, $config->webhookSecret())) {
            Log::warning('MercadoPago webhook: firma inválida', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Firma inválida.'], 401);
        }

        $tipo = $request->input('type') ?? $request->input('topic') ?? $request->input('action');
        $idPago = $request->input('data.id') ?? $request->input('id');

        // Llegó y la firma es válida: el panel lo muestra como "último webhook".
        $config->registrarWebhook();

        if (! str_starts_with((string) $tipo, 'payment') || ! $idPago) {
            return response()->json(['message' => 'Ignorado.']);
        }

        try {
            $pago = (new PaymentClient())->get((int) $idPago);
            $pedido = Pedido::where('numero', $pago->external_reference ?? '')->with('items.producto')->first();

            if (! $pedido) {
                Log::warning('MercadoPago webhook: pago sin pedido', ['pago' => $idPago, 'ref' => $pago->external_reference ?? null]);

                return response()->json(['message' => 'Pedido no encontrado.']);
            }

            $cambio = $pasarela->aplicarPago($pedido, $pago);

            return response()->json(['message' => $cambio ? 'Aplicado.' : 'Sin cambios.']);
        } catch (\Throwable $e) {
            Log::error('MercadoPago webhook: error', ['pago' => $idPago, 'error' => $e->getMessage()]);
            $config->registrarError('Error procesando el webhook del pago '.$idPago.': '.$e->getMessage());

            // 200 igual: el reintento de MercadoPago no arregla un bug nuestro, y
            // `sincronizar()` cubre el caso cuando el cliente vuelve al sitio.
            return response()->json(['message' => 'Error registrado.']);
        }
    }

    /**
     * Valida `x-signature` (HMAC-SHA256 con la clave secreta del webhook).
     * Sin clave configurada se acepta pero se deja constancia: en producción
     * hay que cargarla.
     */
    private function firmaValida(Request $request, string $secreto): bool
    {
        if (blank($secreto)) {
            Log::notice('MercadoPago webhook: sin clave secreta cargada, no se valida la firma');

            return true;
        }

        $firma = (string) $request->header('x-signature');
        $requestId = (string) $request->header('x-request-id');
        $idDato = (string) ($request->query('data.id') ?? $request->input('data.id') ?? '');

        preg_match('/ts=([^,]+)/', $firma, $ts);
        preg_match('/v1=([a-f0-9]+)/', $firma, $v1);

        if (empty($ts[1]) || empty($v1[1])) {
            return false;
        }

        $manifiesto = "id:{$idDato};request-id:{$requestId};ts:{$ts[1]};";
        $esperado = hash_hmac('sha256', $manifiesto, $secreto);

        return hash_equals($esperado, $v1[1]);
    }
}
