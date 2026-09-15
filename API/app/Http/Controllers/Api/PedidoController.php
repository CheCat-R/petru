<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CrearPedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use App\Services\Pagos\PasarelaPago;
use App\Services\Pagos\PasarelaSimulada;
use App\Services\Pedidos\CrearPedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/** Checkout y seguimiento públicos. El cliente se identifica solo por el token del pedido. */
class PedidoController extends Controller
{
    public function store(CrearPedidoRequest $request, CrearPedido $crear): JsonResponse
    {
        ['pedido' => $pedido, 'urlPago' => $urlPago] = $crear->ejecutar($request->validated());

        return response()->json([
            'data' => new PedidoResource($pedido),
            'paymentUrl' => $urlPago,
        ], 201);
    }

    /**
     * Seguimiento. Si el pedido sigue pendiente, consulta a la pasarela (con
     * un límite por token, para que el polling del sitio no se convierta en
     * una lluvia de llamadas a MercadoPago).
     */
    public function show(string $token, PasarelaPago $pasarela): PedidoResource
    {
        $pedido = Pedido::where('token', $token)->with('items')->firstOrFail();

        if ($pedido->estado_pago === Pedido::PAGO_PENDIENTE && $pedido->mp_preference_id) {
            $clave = "sync-pago:{$pedido->id}";
            if (! RateLimiter::tooManyAttempts($clave, 6)) {
                RateLimiter::hit($clave, 60);
                if ($pasarela->sincronizar($pedido)) {
                    $pedido->refresh()->load('items');
                }
            }
        }

        return new PedidoResource($pedido);
    }

    /** Solo existe con la pasarela simulada (sin credenciales de MercadoPago). */
    public function simularPago(Request $request, string $token, PasarelaPago $pasarela): PedidoResource
    {
        abort_unless($pasarela instanceof PasarelaSimulada, 404);

        $datos = $request->validate(['resultado' => ['required', 'in:aprobado,rechazado']]);

        $pedido = Pedido::where('token', $token)->with('items.producto')->firstOrFail();
        $pasarela->resolver($pedido, $datos['resultado']);

        return new PedidoResource($pedido->refresh()->load('items'));
    }
}
