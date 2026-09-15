<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductoRequest;
use App\Http\Resources\ProductoResource;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** ABM del catálogo. A diferencia del público, ve borradores y el costo. */
class ProductoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'buscar' => ['nullable', 'string', 'max:120'],
            'estado' => ['nullable', 'in:Activo,Agotado,Borrador'],
            'categoria_id' => ['nullable', 'integer'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $productos = Producto::query()
            ->with(['categoria', 'imagenes'])
            ->when($request->filled('buscar'), function ($q) use ($request) {
                $termino = '%'.$request->input('buscar').'%';
                $q->where(fn ($w) => $w->where('nombre', 'like', $termino)->orWhere('sku', 'like', $termino));
            })
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->input('estado')))
            ->when($request->filled('categoria_id'), fn ($q) => $q->where('categoria_id', $request->integer('categoria_id')))
            ->orderBy('orden')
            ->orderByDesc('id')
            ->paginate($request->integer('por_pagina', 25));

        return ProductoResource::collection($productos);
    }

    public function show(Producto $producto): ProductoResource
    {
        return new ProductoResource($producto->load(['categoria', 'imagenes']));
    }

    public function store(ProductoRequest $request): JsonResponse
    {
        $producto = Producto::create($request->validated());

        return (new ProductoResource($producto->load(['categoria', 'imagenes'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ProductoRequest $request, Producto $producto): ProductoResource
    {
        $producto->update($request->validated());

        return new ProductoResource($producto->fresh(['categoria', 'imagenes']));
    }

    public function destroy(Producto $producto): JsonResponse
    {
        // Los ítems de pedidos ya vendidos conservan su copia: producto_id queda en null.
        $producto->imagenes->each->delete();
        $producto->delete();

        return response()->json(['message' => 'Producto eliminado.']);
    }
}
