<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoriaRequest;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class CategoriaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoriaResource::collection(
            Categoria::withCount('productos')->orderBy('orden')->orderBy('nombre')->get()
        );
    }

    public function store(CategoriaRequest $request): JsonResponse
    {
        $datos = $request->validated();
        $datos['slug'] = $datos['slug'] ?? Str::slug($datos['nombre']);

        $categoria = Categoria::create($datos);

        return (new CategoriaResource($categoria->loadCount('productos')))->response()->setStatusCode(201);
    }

    public function update(CategoriaRequest $request, Categoria $categoria): CategoriaResource
    {
        $categoria->update($request->validated());

        return new CategoriaResource($categoria->fresh()->loadCount('productos'));
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        if ($categoria->productos()->exists()) {
            return response()->json([
                'message' => 'La categoría tiene productos asignados. Reasignalos antes de eliminarla.',
            ], 409);
        }

        $categoria->delete();

        return response()->json(['message' => 'Categoría eliminada.']);
    }
}
