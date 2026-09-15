<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forma pública del producto. Las claves son las que el panel ya consume
 * (`productos/data/catalog.mock.js`): camelCase en inglés.
 *
 * `cost` solo sale para usuarios autenticados (panel). Nunca al sitio.
 */
class ProductoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imagenPrincipal = $this->imagenPrincipal();

        return [
            'id' => $this->id,
            'name' => $this->nombre,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'categoryId' => $this->categoria_id,
            'category' => new CategoriaResource($this->whenLoaded('categoria')),

            'price' => (float) $this->precio,
            'compareAtPrice' => $this->precio_comparacion !== null ? (float) $this->precio_comparacion : null,
            'cost' => $this->when($request->user() !== null, fn () => $this->costo !== null ? (float) $this->costo : null),

            'stock' => $this->stock,
            'status' => $this->estado,
            'isAvailable' => $this->estaDisponible(),

            'summary' => $this->resumen,
            'description' => $this->descripcion,
            'featured' => $this->destacado,

            'pieceHeightCm' => $this->alto_pieza_cm,
            'package' => [
                'weightKg' => $this->peso_kg === null ? null : (float) $this->peso_kg,
                'heightCm' => $this->alto_cm,
                'widthCm' => $this->ancho_cm,
                'lengthCm' => $this->largo_cm,
            ],

            'image' => $imagenPrincipal ? new ProductoImagenResource($imagenPrincipal) : null,
            'images' => ProductoImagenResource::collection($this->whenLoaded('imagenes')),

            'soldUnits' => $this->unidades_vendidas,
            'order' => $this->orden,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
