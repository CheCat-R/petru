<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Producto extends Model
{
    public const ESTADO_ACTIVO = 'Activo';
    public const ESTADO_AGOTADO = 'Agotado';
    public const ESTADO_BORRADOR = 'Borrador';

    protected $fillable = [
        'nombre', 'slug', 'sku', 'categoria_id',
        'precio', 'precio_comparacion', 'costo',
        'stock', 'estado', 'resumen', 'descripcion', 'destacado',
        'peso_kg', 'alto_cm', 'ancho_cm', 'largo_cm', 'alto_pieza_cm',
        'unidades_vendidas', 'orden',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'precio_comparacion' => 'decimal:2',
            'costo' => 'decimal:2',
            'peso_kg' => 'decimal:3',
            'destacado' => 'boolean',
            'stock' => 'integer',
            'unidades_vendidas' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Producto $producto) {
            if (blank($producto->slug)) {
                $producto->slug = Str::slug($producto->nombre);
            }

            // Sin stock nunca queda "Activo"; con stock nunca queda "Agotado".
            // "Borrador" se respeta siempre: es una decisión editorial, no de stock.
            if ($producto->estado !== self::ESTADO_BORRADOR) {
                $producto->estado = $producto->stock > 0 ? self::ESTADO_ACTIVO : self::ESTADO_AGOTADO;
            }
        });
    }

    // --- Relaciones ---

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(ProductoImagen::class)->orderByDesc('principal')->orderBy('orden');
    }

    // --- Scopes ---

    /** Lo que el sitio público puede ver: todo menos borradores. */
    public function scopePublicado(Builder $query): Builder
    {
        return $query->where('estado', '!=', self::ESTADO_BORRADOR);
    }

    public function scopeComprable(Builder $query): Builder
    {
        return $query->where('estado', self::ESTADO_ACTIVO)->where('stock', '>', 0);
    }

    // --- Helpers ---

    /**
     * Suma o resta stock pasando por save(), para que el hook de `saving`
     * sincronice el estado (Activo ↔ Agotado). `increment()`/`decrement()`
     * no lo disparan. Llamar con la fila bloqueada (lockForUpdate) al vender.
     */
    public function ajustarStock(int $delta): void
    {
        $this->stock = max(0, $this->stock + $delta);
        $this->save();
    }

    public function estaDisponible(): bool
    {
        return $this->estado === self::ESTADO_ACTIVO && $this->stock > 0;
    }

    public function imagenPrincipal(): ?ProductoImagen
    {
        return $this->imagenes->firstWhere('principal', true) ?? $this->imagenes->first();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
