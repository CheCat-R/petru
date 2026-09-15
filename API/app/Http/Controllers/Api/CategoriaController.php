<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriaResource;
use App\Models\Categoria;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoriaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categorias = Categoria::query()
            ->withCount(['productos' => fn ($q) => $q->publicado()])
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get();

        return CategoriaResource::collection($categorias);
    }
}
