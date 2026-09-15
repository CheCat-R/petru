<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $fillable = ['nombre', 'slug', 'descripcion', 'imagen_url', 'orden'];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class)->orderBy('orden');
    }
}
