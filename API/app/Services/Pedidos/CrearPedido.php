<?php

namespace App\Services\Pedidos;

use App\Events\PedidoCreado;
use App\Exceptions\CarritoInvalido;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Producto;
use App\Services\Envios\CotizadorEnvio;
use App\Services\Pagos\PasarelaPago;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * El checkout, del lado del servidor.
 *
 * Recibe ids y cantidades, nada más: precios, subtotal, envío y total se
 * calculan acá leyendo la base. Reserva el stock dentro de la misma
 * transacción (con lock por fila, para que dos personas no compren la última
 * pieza a la vez) y recién después crea la preferencia de pago.
 */
class CrearPedido
{
    public function __construct(
        private readonly CotizadorEnvio $cotizador,
        private readonly PasarelaPago $pasarela,
    ) {
    }

    /**
     * @param  array  $datos  validados por CrearPedidoRequest
     * @return array{pedido: Pedido, urlPago: string}
     */
    public function ejecutar(array $datos): array
    {
        $pedido = DB::transaction(function () use ($datos) {
            $lineas = $this->reservarStock($datos['items']);

            $subtotal = $lineas->sum(fn ($l) => round((float) $l['producto']->precio * $l['cantidad'], 2));

            // Se vuelve a cotizar acá: lo que el cliente vio en el checkout es orientativo.
            $envio = $this->cotizador->opcion($datos['codigo_postal'], $lineas, $datos['metodo_envio']);

            $pedido = Pedido::create([
                'nombre_cliente' => $datos['nombre'],
                'email_cliente' => $datos['email'],
                'telefono_cliente' => $datos['telefono'] ?? null,
                'dni_cliente' => $datos['dni'] ?? null,

                'calle' => $datos['calle'],
                'numero_calle' => $datos['numero'],
                'piso' => $datos['piso'] ?? null,
                'departamento' => $datos['departamento'] ?? null,
                'localidad' => $datos['localidad'],
                'provincia' => $datos['provincia'],
                'codigo_postal' => CotizadorEnvio::normalizarCp($datos['codigo_postal']),
                'referencia_direccion' => $datos['referencia'] ?? null,

                'estado_pago' => Pedido::PAGO_PENDIENTE,
                'estado_envio' => Pedido::ENVIO_SIN_DESPACHAR,

                'subtotal' => $subtotal,
                'costo_envio' => $envio['costo'],
                'descuento' => 0,
                'total' => round($subtotal + $envio['costo'], 2),

                'transportista' => $envio['transportista'],
                'cotizacion_envio' => $envio,
                'metodo_pago' => $this->pasarela->nombre(),
                'reservado_hasta' => now()->addMinutes((int) config('petru.reserva_minutos')),
                'notas' => $datos['notas'] ?? null,
            ]);

            $pedido->items()->saveMany(
                $lineas->map(fn ($l) => PedidoItem::desdeProducto($l['producto'], $l['cantidad']))
            );

            // refresh(): los defaults de la base (estado_pago, estado_envio) al modelo
            return $pedido->refresh()->load('items');
        });

        // Fuera de la transacción: si la pasarela falla, el pedido queda Pendiente
        // y la reserva vence sola. No se deja una transacción abierta esperando a un tercero.
        $preferencia = $this->pasarela->crearPreferencia($pedido);
        $pedido->forceFill(['mp_preference_id' => $preferencia['preferenciaId']])->save();

        PedidoCreado::dispatch($pedido);

        return ['pedido' => $pedido, 'urlPago' => $preferencia['urlPago']];
    }

    /**
     * Bloquea los productos, verifica que se puedan comprar y descuenta el stock.
     *
     * @return Collection<int, array{producto: Producto, cantidad: int}>
     */
    private function reservarStock(array $items): Collection
    {
        $cantidades = collect($items)
            ->groupBy('producto_id')
            ->map(fn ($grupo) => (int) $grupo->sum('cantidad'));

        $productos = Producto::whereIn('id', $cantidades->keys())
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $problemas = [];
        foreach ($cantidades as $id => $cantidad) {
            $producto = $productos->get($id);

            if (! $producto || $producto->estado === Producto::ESTADO_BORRADOR) {
                $problemas[] = ['productoId' => $id, 'motivo' => 'Esta pieza ya no está disponible.'];
            } elseif ($producto->stock < $cantidad) {
                $problemas[] = [
                    'productoId' => $id,
                    'motivo' => $producto->stock === 0
                        ? "«{$producto->nombre}» se agotó."
                        : "De «{$producto->nombre}» quedan {$producto->stock} y pediste {$cantidad}.",
                    'stock' => $producto->stock,
                ];
            }
        }

        if ($problemas) {
            throw new CarritoInvalido('Algunas piezas del carrito cambiaron. Revisalo antes de continuar.', $problemas);
        }

        return $cantidades->map(function ($cantidad, $id) use ($productos) {
            $producto = $productos->get($id);
            $producto->ajustarStock(-$cantidad); // si llega a 0, el hook lo pasa a Agotado

            return ['producto' => $producto, 'cantidad' => $cantidad];
        })->values();
    }
}
