<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Envio extends Model
{
    protected $fillable = [
        'pedido_id', 'transportista', 'tracking', 'estado', 'peso_kg', 'costo',
        'etiqueta_url', 'eventos_tracking', 'despachado_en', 'entregado_en',
    ];

    protected function casts(): array
    {
        return [
            'peso_kg' => 'decimal:3',
            'costo' => 'decimal:2',
            'eventos_tracking' => 'array',
            'despachado_en' => 'datetime',
            'entregado_en' => 'datetime',
        ];
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }
}
