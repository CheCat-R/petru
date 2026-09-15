<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forma del pedido tal como el panel la consume (`pedidos/data/orders.mock.js`).
 *
 * `address` es el string que el panel lee hoy; `shippingAddress` es la versión
 * estructurada para pantallas nuevas y para Andreani. Se exponen las dos.
 */
class PedidoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $esPanel = $request->user() !== null;

        return [
            'id' => $this->numero,
            'token' => $this->when(! $esPanel, $this->token),

            'customerName' => $this->nombre_cliente,
            'customerEmail' => $this->email_cliente,
            'customerPhone' => $this->telefono_cliente,
            'customerDni' => $this->when($esPanel, $this->dni_cliente),

            'address' => $this->direccionFormateada(),
            'shippingAddress' => [
                'street' => $this->calle,
                'number' => $this->numero_calle,
                'floor' => $this->piso,
                'apartment' => $this->departamento,
                'city' => $this->localidad,
                'state' => $this->provincia,
                'zip' => $this->codigo_postal,
                'reference' => $this->referencia_direccion,
            ],

            'subtotal' => (float) $this->subtotal,
            'shippingCost' => (float) $this->costo_envio,
            'discount' => (float) $this->descuento,
            'total' => (float) $this->total,
            'couponCode' => $this->cupon_codigo,

            'paymentStatus' => $this->estado_pago,
            'fulfillmentStatus' => $this->estado_envio,
            'paymentMethod' => $this->metodo_pago,
            'paymentRef' => $this->referencia_pago,

            'shippingCarrier' => $this->transportista,
            'trackingCode' => $this->tracking,
            'shippingQuote' => $this->when($esPanel, $this->cotizacion_envio),

            'createdAt' => $this->created_at?->toIso8601String(),
            'paidAt' => $this->pagado_en?->toIso8601String(),
            'rejectedAt' => $this->rechazado_en?->toIso8601String(),
            'dispatchedAt' => $this->despachado_en?->toIso8601String(),
            'deliveredAt' => $this->entregado_en?->toIso8601String(),
            'returnedAt' => $this->devuelto_en?->toIso8601String(),
            'refundedAt' => $this->reembolsado_en?->toIso8601String(),
            'rejectionReason' => $this->motivo_rechazo,
            'reservedUntil' => $this->when($esPanel, $this->reservado_hasta?->toIso8601String()),

            'notes' => $this->when($esPanel, $this->notas),

            'items' => PedidoItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
