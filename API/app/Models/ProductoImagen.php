<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductoImagen extends Model
{
    protected $table = 'producto_imagenes';

    protected $fillable = ['producto_id', 'url', 'ruta_archivo', 'alt', 'orden', 'principal'];

    protected function casts(): array
    {
        return ['principal' => 'boolean'];
    }

    protected static function booted(): void
    {
        // El archivo se va con el registro. Las imágenes externas no tienen ruta.
        static::deleted(function (ProductoImagen $imagen) {
            if ($imagen->ruta_archivo) {
                Storage::disk('public')->delete($imagen->ruta_archivo);
            }
        });
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
