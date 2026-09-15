<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PedidoItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'productId' => $this->producto_id,
            'name' => $this->nombre,
            'sku' => $this->sku,
            'unitPrice' => (float) $this->precio_unitario,
            'qty' => $this->cantidad,
            'subtotal' => (float) $this->subtotal,
            'imageUrl' => $this->imagen_url,
        ];
    }
}
