<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Foto del producto al momento de la compra. `producto_id` es solo una referencia
 * de conveniencia: nombre, sku, precio e imagen se leen de acá, nunca del producto.
 */
class PedidoItem extends Model
{
    protected $fillable = ['pedido_id', 'producto_id', 'nombre', 'sku', 'precio_unitario', 'cantidad', 'subtotal', 'imagen_url'];

    protected function casts(): array
    {
        return [
            'precio_unitario' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'cantidad' => 'integer',
        ];
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    /** Construye el ítem congelando los datos del producto. */
    public static function desdeProducto(Producto $producto, int $cantidad): static
    {
        return new static([
            'producto_id' => $producto->id,
            'nombre' => $producto->nombre,
            'sku' => $producto->sku,
            'precio_unitario' => $producto->precio,
            'cantidad' => $cantidad,
            'subtotal' => round($producto->precio * $cantidad, 2),
            'imagen_url' => $producto->imagenPrincipal()?->url,
        ]);
    }
}
