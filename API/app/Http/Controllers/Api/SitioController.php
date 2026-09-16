<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Integraciones\EnviosConfig;
use App\Integraciones\MercadoPagoConfig;
use App\Sitio\ContenidoSitio;
use Illuminate\Http\JsonResponse;

/** Contenido editable del sitio, tal como lo consume Sitio_web/ (build y runtime). */
class SitioController extends Controller
{
    public function __invoke(ContenidoSitio $contenido, MercadoPagoConfig $mercadoPago, EnviosConfig $envios): JsonResponse
    {
        // `payments.mode`: el checkout avisa cuando los pagos son de prueba o simulados.
        // `shipping`: nombres de las zonas y si hay retiro, para los textos del checkout.
        return response()
            ->json(['data' => [
                ...$contenido->obtener(),
                'payments' => ['mode' => $mercadoPago->modoPublico()],
                'shipping' => [
                    'zones' => array_column($envios->zonas(), 'nombre'),
                    'pickup' => (bool) $envios->retiro()['habilitado'],
                ],
            ]])
            // Sin caché pública: el CDN del hosting guardaría la respuesta sin las cabeceras CORS.
            ->header('Cache-Control', 'no-cache');
    }
}
