<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Integraciones\MercadoPagoConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Integraciones → MercadoPago. Los secretos nunca vuelven completos al panel:
 * se muestran enmascarados y un campo vacío al guardar conserva el anterior.
 */
class IntegracionMercadoPagoController extends Controller
{
    public function __construct(private readonly MercadoPagoConfig $config) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->config->resumen()]);
    }

    public function update(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'modo' => ['required', Rule::in(MercadoPagoConfig::MODOS)],
            'test.access_token' => ['nullable', 'string', 'max:200', 'starts_with:TEST-'],
            'test.public_key' => ['nullable', 'string', 'max:200', 'starts_with:TEST-'],
            'produccion.access_token' => ['nullable', 'string', 'max:200', 'starts_with:APP_USR-'],
            'produccion.public_key' => ['nullable', 'string', 'max:200', 'starts_with:APP_USR-'],
            'produccion.client_id' => ['nullable', 'string', 'max:64', 'regex:/^\d+$/'],
            'produccion.client_secret' => ['nullable', 'string', 'max:200'],
            'webhook_secret' => ['nullable', 'string', 'max:200'],
            'descriptor' => ['nullable', 'string', 'max:22', 'regex:/^[A-Za-z0-9 .\-]+$/'],
        ], [
            'test.*.starts_with' => 'Las credenciales de prueba empiezan con TEST-. Esta parece de producción.',
            'produccion.*.starts_with' => 'Las credenciales de producción empiezan con APP_USR-. Esta parece de prueba.',
            'produccion.client_id.regex' => 'El Client ID es un número.',
            'descriptor.regex' => 'Solo letras, números, espacios, punto y guion (es lo que acepta el resumen de la tarjeta).',
            'descriptor.max' => 'MercadoPago corta el descriptor a 22 caracteres.',
        ]);

        $this->config->guardar($datos);

        return $this->show();
    }

    /** Prueba credenciales: las enviadas (sin guardar todavía) o, si faltan, las guardadas. */
    public function probar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'modo' => ['required', Rule::in(MercadoPagoConfig::MODOS)],
            'access_token' => ['nullable', 'string', 'max:200'],
            'public_key' => ['nullable', 'string', 'max:200'],
        ]);

        $resultado = $this->config->probar($datos['modo'], $datos['access_token'] ?? null, $datos['public_key'] ?? null);

        return response()->json(['data' => $resultado, 'summary' => $this->config->resumen()]);
    }

    /** Borra las credenciales de un modo, o el secreto del webhook con `webhook`. */
    public function destroy(string $que): JsonResponse
    {
        abort_unless(in_array($que, [...MercadoPagoConfig::MODOS, 'webhook'], true), 404);
        $this->config->borrar($que);

        return $this->show();
    }

    public function limpiarError(): JsonResponse
    {
        $this->config->limpiarError();

        return $this->show();
    }
}
