<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->nombre,
            'email' => $this->email,
            'phone' => $this->telefono,
            'reason' => $this->motivo,
            'message' => $this->mensaje,
            'status' => $this->estado,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
