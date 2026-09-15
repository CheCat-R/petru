<?php

namespace App\Services\Envios;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Cotización en vivo contra la API de Andreani.
 *
 * Flujo de su API pública: login con usuario/contraseña → token; luego
 * GET /v1/tarifas con CP destino, contrato, cliente y los bultos (peso y volumen).
 * El token se cachea; la cotización también, por (CP, peso, volumen), para no
 * pegarle a Andreani cada vez que el cliente toca el formulario.
 *
 * Sin credenciales en .env este cliente no se usa: `CotizadorEnvio` cae a la
 * tabla de respaldo. No está probado contra la API real todavía.
 */
class AndreaniClient
{
    public function __construct(private readonly array $config)
    {
    }


    public function estaConfigurado(): bool
    {
        return filled($this->config['usuario'])
            && filled($this->config['password'])
            && filled($this->config['cliente'])
            && filled($this->config['contrato']);
    }

    /**
     * @param  float  $pesoKg       peso total del envío
     * @param  int    $volumenCm3   volumen total del envío
     * @return array{costo: float, plazo: ?string, crudo: array}
     */
    public function cotizar(string $cpDestino, float $pesoKg, int $volumenCm3, float $valorDeclarado, bool $sinCache = false): array
    {
        $clave = sprintf('andreani:cotizacion:%s:%s:%d', $cpDestino, number_format($pesoKg, 3, '.', ''), $volumenCm3);
        if ($sinCache) {
            Cache::forget($clave);
        }

        return Cache::remember($clave, now()->addMinutes((int) $this->config['cache_minutos']), function () use ($cpDestino, $pesoKg, $volumenCm3, $valorDeclarado) {
            $respuesta = Http::baseUrl($this->config['api_url'])
                ->timeout((int) $this->config['timeout'])
                ->retry(1, 300)
                ->withHeaders(['x-authorization-token' => $this->token()])
                ->get('/v1/tarifas', [
                    'cpDestino' => $cpDestino,
                    'contrato' => $this->config['contrato'],
                    'cliente' => $this->config['cliente'],
                    'sucursalOrigen' => $this->config['cp_origen'],
                    'bultos[0][valorDeclarado]' => round($valorDeclarado, 2),
                    'bultos[0][volumen]' => $volumenCm3,
                    'bultos[0][kilos]' => round($pesoKg, 3),
                ]);

            if (! $respuesta->successful()) {
                throw new RuntimeException("Andreani respondió {$respuesta->status()}");
            }

            $datos = $respuesta->json();
            $costo = (float) ($datos['tarifaConIva']['total'] ?? $datos['tarifaConIva'] ?? $datos['total'] ?? 0);

            if ($costo <= 0) {
                throw new RuntimeException('Andreani no devolvió un importe');
            }

            return [
                'costo' => $costo,
                'plazo' => $datos['plazoEntrega'] ?? null,
                'crudo' => $datos,
            ];
        });
    }

    private function token(): string
    {
        // La clave lleva el usuario: si cambian las credenciales no se reutiliza un token ajeno.
        return Cache::remember('andreani:token:'.md5($this->config['usuario'].$this->config['password']), now()->addHours(6), function () {
            $respuesta = Http::baseUrl($this->config['api_url'])
                ->timeout((int) $this->config['timeout'])
                ->withBasicAuth($this->config['usuario'], $this->config['password'])
                ->post('/login');

            $token = $respuesta->header('x-authorization-token') ?: $respuesta->json('token');

            if (! $respuesta->successful() || blank($token)) {
                Log::warning('Andreani: login fallido', ['status' => $respuesta->status()]);
                throw new RuntimeException('No se pudo autenticar contra Andreani');
            }

            return $token;
        });
    }
}
