<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Catálogo público: lo que consume el sitio. Nunca devuelve borradores. */
class ProductoController extends Controller
{
    private const ORDENES = [
        'manual' => ['orden', 'asc'],
        'recientes' => ['created_at', 'desc'],
        'precio-asc' => ['precio', 'asc'],
        'precio-desc' => ['precio', 'desc'],
        'vendidos' => ['unidades_vendidas', 'desc'],
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'categoria' => ['nullable', 'string', 'max:100'],
            'destacado' => ['nullable', 'boolean'],
            'orden' => ['nullable', 'in:'.implode(',', array_keys(self::ORDENES))],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        [$columna, $direccion] = self::ORDENES[$request->input('orden', 'manual')];

        $productos = Producto::query()
            ->publicado()
            ->with(['categoria', 'imagenes'])
            ->when($request->filled('categoria'), fn ($q) => $q->whereHas(
                'categoria', fn ($c) => $c->where('slug', $request->input('categoria'))
            ))
            ->when($request->boolean('destacado'), fn ($q) => $q->where('destacado', true))
            ->orderBy($columna, $direccion)
            ->orderBy('id')
            ->paginate($request->integer('por_pagina', 24));

        return ProductoResource::collection($productos);
    }

    public function show(string $slug): ProductoResource
    {
        $producto = Producto::query()
            ->publicado()
            ->with(['categoria', 'imagenes'])
            ->where('slug', $slug)
            ->firstOrFail();

        return new ProductoResource($producto);
    }
}
