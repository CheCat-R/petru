<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConsultaResource;
use App\Models\Consulta;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConsultaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'estado' => ['nullable', 'in:nueva,leida,respondida'],
            'motivo' => ['nullable', 'in:custom,pedido,otro,arrepentimiento'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $consultas = Consulta::query()
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->input('estado')))
            ->when($request->filled('motivo'), fn ($q) => $q->where('motivo', $request->input('motivo')))
            ->orderByDesc('id')
            ->paginate($request->integer('por_pagina', 25));

        return ConsultaResource::collection($consultas);
    }

    public function update(Request $request, Consulta $consulta): ConsultaResource
    {
        $consulta->update($request->validate([
            'estado' => ['required', 'in:nueva,leida,respondida'],
        ]));

        return new ConsultaResource($consulta);
    }
}
