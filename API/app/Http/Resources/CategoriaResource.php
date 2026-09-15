<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->nombre,
            'slug' => $this->slug,
            'description' => $this->descripcion,
            'imageUrl' => $this->imagen_url,
            'order' => $this->orden,
            'productCount' => $this->whenCounted('productos'),
        ];
    }
}
