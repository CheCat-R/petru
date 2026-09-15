<?php

namespace App\Services\Pagos;

use App\Models\Pedido;

/**
 * Pasarela de desarrollo. Se usa sola cuando no hay MERCADOPAGO_ACCESS_TOKEN.
 *
 * En vez de mandar al cliente a MercadoPago, lo manda a la página de
 * seguimiento del propio sitio con `?simular=1`, donde puede elegir "aprobar" o
 * "rechazar". Eso pega a `POST /api/pedidos/{token}/simular-pago`, que solo
 * existe con esta pasarela activa. Permite probar el checkout completo sin
 * credenciales ni conexión.
 */
class PasarelaSimulada implements PasarelaPago
{
    public function nombre(): string
    {
        return 'Simulada';
    }

    public function crearPreferencia(Pedido $pedido): array
    {
        $frontend = rtrim(config('petru.frontend_url'), '/');

        return [
            'preferenciaId' => 'SIM-'.$pedido->numero,
            'urlPago' => "{$frontend}/pedido/{$pedido->token}?simular=1",
        ];
    }

    public function sincronizar(Pedido $pedido): bool
    {
        // No hay nada afuera que consultar: el estado se decide desde /simular-pago.
        return false;
    }

    public function resolver(Pedido $pedido, string $resultado): void
    {
        if ($resultado === 'aprobado') {
            $pedido->confirmarPago('SIM-PAGO-'.now()->format('YmdHis'), 'Simulado (desarrollo)');
        } else {
            $pedido->rechazarPago('Rechazo simulado (desarrollo)');
        }
    }
}
