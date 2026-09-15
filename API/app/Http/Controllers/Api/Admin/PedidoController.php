<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PedidoResource;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/**
 * Pedidos para el panel. Las transiciones son acciones explícitas, como el
 * panel ya las llama; la regla de cada una vive en el modelo.
 */
class PedidoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'buscar' => ['nullable', 'string', 'max:120'],
            'estado_pago' => ['nullable', 'string', 'max:30'],
            'estado_envio' => ['nullable', 'string', 'max:30'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $pedidos = Pedido::query()
            ->with('items')
            ->when($request->filled('buscar'), function ($q) use ($request) {
                $termino = '%'.$request->input('buscar').'%';
                $q->where(fn ($w) => $w
                    ->where('numero', 'like', $termino)
                    ->orWhere('nombre_cliente', 'like', $termino)
                    ->orWhere('email_cliente', 'like', $termino));
            })
            ->when($request->filled('estado_pago'), fn ($q) => $q->where('estado_pago', $request->input('estado_pago')))
            ->when($request->filled('estado_envio'), fn ($q) => $q->where('estado_envio', $request->input('estado_envio')))
            ->orderByDesc('id')
            ->paginate($request->integer('por_pagina', 25));

        return PedidoResource::collection($pedidos);
    }

    public function show(Pedido $pedido): PedidoResource
    {
        return new PedidoResource($pedido->load(['items', 'envio']));
    }

    public function actualizarNotas(Request $request, Pedido $pedido): PedidoResource
    {
        $pedido->update($request->validate(['notas' => ['nullable', 'string', 'max:5000']]));

        return new PedidoResource($pedido->load('items'));
    }

    // --- Transiciones ---

    public function confirmarPago(Request $request, Pedido $pedido): PedidoResource
    {
        $datos = $request->validate([
            'referencia' => ['nullable', 'string', 'max:60'],
            'metodo' => ['nullable', 'string', 'max:80'],
        ]);

        DB::transaction(fn () => $pedido->confirmarPago(
            $datos['referencia'] ?? 'manual-'.now()->format('YmdHis'),
            $datos['metodo'] ?? 'Manual (confirmado desde el panel)',
        ));

        return new PedidoResource($pedido->fresh('items'));
    }

    public function rechazarPago(Request $request, Pedido $pedido): PedidoResource
    {
        $pedido->rechazarPago($request->input('motivo', 'Rechazado desde el panel'));

        return new PedidoResource($pedido->fresh('items'));
    }

    public function cancelar(Request $request, Pedido $pedido): PedidoResource
    {
        DB::transaction(fn () => $pedido->cancelar($request->input('motivo')));

        return new PedidoResource($pedido->fresh('items'));
    }

    public function reembolsar(Pedido $pedido): PedidoResource
    {
        DB::transaction(fn () => $pedido->reembolsar());

        return new PedidoResource($pedido->fresh('items'));
    }

    public function despachar(Request $request, Pedido $pedido): PedidoResource
    {
        $datos = $request->validate([
            'transportista' => ['required', 'string', 'max:40'],
            'tracking' => ['nullable', 'string', 'max:60'],
        ]);

        $pedido->despachar($datos['transportista'], $datos['tracking'] ?? null);

        return new PedidoResource($pedido->fresh('items'));
    }

    public function marcarEntregado(Pedido $pedido): PedidoResource
    {
        $pedido->marcarEntregado();

        return new PedidoResource($pedido->fresh('items'));
    }

    public function registrarDevolucion(Pedido $pedido): PedidoResource
    {
        $pedido->registrarDevolucion();

        return new PedidoResource($pedido->fresh('items'));
    }

    public function confirmarReembolso(Pedido $pedido): PedidoResource
    {
        $pedido->confirmarReembolso();

        return new PedidoResource($pedido->fresh('items'));
    }
}
