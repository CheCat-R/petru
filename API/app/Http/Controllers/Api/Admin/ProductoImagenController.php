<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductoImagenResource;
use App\Models\Producto;
use App\Models\ProductoImagen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductoImagenController extends Controller
{
    public function store(Request $request, Producto $producto): JsonResponse
    {
        $request->validate([
            'imagen' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'alt' => ['nullable', 'string', 'max:200'],
        ]);

        $ruta = $request->file('imagen')->store("productos/{$producto->id}", 'public');

        $imagen = $producto->imagenes()->create([
            'url' => Storage::disk('public')->url($ruta),
            'ruta_archivo' => $ruta,
            'alt' => $request->input('alt') ?: $producto->nombre,
            'orden' => ((int) $producto->imagenes()->max('orden')) + 1,
            'principal' => ! $producto->imagenes()->where('principal', true)->exists(),
        ]);

        return (new ProductoImagenResource($imagen))->response()->setStatusCode(201);
    }

    public function update(Request $request, Producto $producto, ProductoImagen $imagen): ProductoImagenResource
    {
        $this->asegurarPertenencia($producto, $imagen);

        $datos = $request->validate([
            'alt' => ['sometimes', 'string', 'max:200'],
            'orden' => ['sometimes', 'integer', 'min:0'],
            'principal' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('principal')) {
            $producto->imagenes()->where('id', '!=', $imagen->id)->update(['principal' => false]);
        }

        $imagen->update($datos);

        return new ProductoImagenResource($imagen->fresh());
    }

    public function destroy(Producto $producto, ProductoImagen $imagen): JsonResponse
    {
        $this->asegurarPertenencia($producto, $imagen);

        $eraPrincipal = $imagen->principal;
        $imagen->delete();

        // Si se borró la principal, la siguiente en orden hereda el rol
        if ($eraPrincipal) {
            $producto->imagenes()->orderBy('orden')->first()?->update(['principal' => true]);
        }

        return response()->json(['message' => 'Imagen eliminada.']);
    }

    private function asegurarPertenencia(Producto $producto, ProductoImagen $imagen): void
    {
        abort_unless($imagen->producto_id === $producto->id, 404);
    }
}
