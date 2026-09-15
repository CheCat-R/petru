<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Services\Envios\CotizadorEnvio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnvioController extends Controller
{
    public function cotizar(Request $request, CotizadorEnvio $cotizador): JsonResponse
    {
        $datos = $request->validate([
            'codigo_postal' => ['required', 'string', 'max:10', 'regex:/\d{4}/'],
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.producto_id' => ['required', 'integer', 'exists:productos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $productos = Producto::whereIn('id', collect($datos['items'])->pluck('producto_id'))->get()->keyBy('id');

        $lineas = collect($datos['items'])
            ->map(fn ($i) => ['producto' => $productos->get($i['producto_id']), 'cantidad' => (int) $i['cantidad']])
            ->filter(fn ($l) => $l['producto'] !== null)
            ->values();

        return response()->json([
            'codigoPostal' => CotizadorEnvio::normalizarCp($datos['codigo_postal']),
            'opciones' => collect($cotizador->cotizar($datos['codigo_postal'], $lineas))->map(fn ($o) => [
                'method' => $o['metodo'],
                'name' => $o['nombre'],
                'detail' => $o['detalle'],
                'carrier' => $o['transportista'],
                'cost' => $o['costo'],
                'eta' => $o['plazo'],
                'source' => $o['origen'],
            ])->values(),
        ]);
    }
}
