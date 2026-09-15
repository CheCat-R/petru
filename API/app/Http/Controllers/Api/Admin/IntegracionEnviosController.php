<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Integraciones\EnviosConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Integraciones → Envíos. Una sola pantalla y un solo PUT: retiro en el
 * taller, zonas con tarifa de respaldo, bulto por defecto y Andreani.
 */
class IntegracionEnviosController extends Controller
{
    public function __construct(private readonly EnviosConfig $config) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->config->resumen()]);
    }

    public function update(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'retiro.habilitado' => ['required', 'boolean'],
            'retiro.nombre' => ['required', 'string', 'max:60'],
            'retiro.detalle' => ['nullable', 'string', 'max:120'],
            'retiro.plazo' => ['nullable', 'string', 'max:60'],

            'zonas' => ['required', 'array', 'min:1', 'max:20'],
            'zonas.*.nombre' => ['required', 'string', 'max:60'],
            'zonas.*.codigos_postales' => ['required', 'array', 'min:1', 'max:200'],
            'zonas.*.codigos_postales.*' => ['required', 'string', 'regex:/^\d{4}$/'],
            'zonas.*.costo' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'zonas.*.plazo' => ['nullable', 'string', 'max:60'],

            'transportista_por_defecto' => ['required', 'string', 'max:40'],

            'bulto_por_defecto.peso_kg' => ['required', 'numeric', 'min:0.1', 'max:100'],
            'bulto_por_defecto.alto_cm' => ['required', 'integer', 'min:1', 'max:200'],
            'bulto_por_defecto.ancho_cm' => ['required', 'integer', 'min:1', 'max:200'],
            'bulto_por_defecto.largo_cm' => ['required', 'integer', 'min:1', 'max:200'],

            'andreani.usuario' => ['nullable', 'string', 'max:120'],
            'andreani.password' => ['nullable', 'string', 'max:120'],
            'andreani.cliente' => ['nullable', 'string', 'max:40'],
            'andreani.contrato' => ['nullable', 'string', 'max:40'],
            'andreani.cp_origen' => ['required', 'string', 'regex:/^\d{4}$/'],
        ], [
            'zonas.*.codigos_postales.*.regex' => 'Cada código postal son 4 dígitos (2000, 2132…).',
            'zonas.*.codigos_postales.required' => 'La zona necesita al menos un código postal.',
            'andreani.cp_origen.regex' => 'El código postal de origen son 4 dígitos.',
        ], [
            'zonas.*.nombre' => 'nombre de la zona',
            'zonas.*.costo' => 'costo',
            'bulto_por_defecto.peso_kg' => 'peso',
        ]);

        // Un CP no puede repetirse (en la misma zona o en dos): la primera que lo tenga ganaría en silencio.
        $repetidos = collect($datos['zonas'])->flatMap(fn ($z) => $z['codigos_postales'])->duplicates()->unique()->values();
        if ($repetidos->isNotEmpty()) {
            return response()->json([
                'message' => 'Hay códigos postales repetidos.',
                'errors' => ['zonas' => ['Estos códigos postales están repetidos o en más de una zona: '.$repetidos->implode(', ').'.']],
            ], 422);
        }

        $this->config->guardar($datos);

        return $this->show();
    }

    /** Prueba las credenciales enviadas (o las guardadas) con una cotización real. */
    public function probarAndreani(Request $request): JsonResponse
    {
        $credenciales = $request->validate([
            'usuario' => ['nullable', 'string', 'max:120'],
            'password' => ['nullable', 'string', 'max:120'],
            'cliente' => ['nullable', 'string', 'max:40'],
            'contrato' => ['nullable', 'string', 'max:40'],
            'cp_origen' => ['nullable', 'string', 'regex:/^\d{4}$/'],
        ]);

        return response()->json(['data' => $this->config->probarAndreani($credenciales), 'summary' => $this->config->resumen()]);
    }

    public function borrarAndreani(): JsonResponse
    {
        $this->config->borrarAndreani();

        return $this->show();
    }

    public function limpiarError(): JsonResponse
    {
        $this->config->limpiarError();

        return $this->show();
    }
}
