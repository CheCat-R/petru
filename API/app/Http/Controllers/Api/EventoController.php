<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventoSitio;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * Recibe los eventos que manda el sitio (analítica propia).
 *
 * Privacidad por diseño: no hay cookie, no se guarda la IP ni el user-agent.
 * El "visitante" es un hash de ip + user-agent + sal que cambia cada día, así
 * se cuentan visitantes únicos del día sin poder seguir a nadie entre días.
 * Los bots conocidos se descartan antes de guardar.
 */
class EventoController extends Controller
{
    private const BOTS = '/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|curl|wget|python-requests/i';

    public function store(Request $request): Response
    {
        $datos = $request->validate([
            'tipo' => ['required', Rule::in(EventoSitio::TIPOS)],
            'ruta' => ['required', 'string', 'max:200', 'regex:#^/#'],
            'sesion' => ['required', 'string', 'min:8', 'max:40', 'regex:/^[a-zA-Z0-9\-]+$/'],
            'producto_id' => ['nullable', 'integer', 'exists:productos,id'],
            'pedido_numero' => ['nullable', 'string', 'max:12'],
            'referente' => ['nullable', 'string', 'max:500'],
            'utm_source' => ['nullable', 'string', 'max:80'],
            'utm_medium' => ['nullable', 'string', 'max:80'],
            'utm_campaign' => ['nullable', 'string', 'max:120'],
            'ancho' => ['nullable', 'integer', 'min:0', 'max:10000'],
        ]);

        $agente = (string) $request->userAgent();
        if (blank($agente) || preg_match(self::BOTS, $agente)) {
            return response()->noContent();
        }

        $referente = $this->hostDe($datos['referente'] ?? null);

        EventoSitio::create([
            'tipo' => $datos['tipo'],
            'ruta' => $this->limpiarRuta($datos['ruta']),
            'producto_id' => $datos['producto_id'] ?? null,
            'pedido_numero' => $datos['pedido_numero'] ?? null,
            'visitante' => $this->visitante($request, $agente),
            'sesion' => $datos['sesion'],
            'fuente' => EventoSitio::fuenteDe($referente, $datos['utm_source'] ?? null, $datos['utm_medium'] ?? null),
            'referente' => $referente,
            'utm_source' => $datos['utm_source'] ?? null,
            'utm_medium' => $datos['utm_medium'] ?? null,
            'utm_campaign' => $datos['utm_campaign'] ?? null,
            'dispositivo' => EventoSitio::dispositivoDe($datos['ancho'] ?? null),
            'creado_en' => now(),
        ]);

        return response()->noContent();
    }

    /** Hash del día: la misma persona cuenta una vez por día, y mañana es otra. */
    private function visitante(Request $request, string $agente): string
    {
        return substr(hash('sha256', now()->toDateString().'|'.$request->ip().'|'.$agente.'|'.config('app.key')), 0, 32);
    }

    /** Host del referente, sin "www." ni el propio sitio. */
    private function hostDe(?string $url): ?string
    {
        if (blank($url)) {
            return null;
        }
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^(www|m|l|lm)\./', '', $host);
        $propio = strtolower((string) parse_url(config('petru.frontend_url'), PHP_URL_HOST));

        return $host && $host !== $propio ? substr($host, 0, 120) : null;
    }

    /** Sin query string ni tokens de pedido: la ruta es lo que se agrega, no el detalle. */
    private function limpiarRuta(string $ruta): string
    {
        $ruta = strtok($ruta, '?') ?: '/';

        return substr(preg_replace('#^/pedido/[^/]+#', '/pedido/*', $ruta), 0, 200);
    }
}
