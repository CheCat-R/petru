<?php

namespace App\Integraciones;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Credenciales y estado de MercadoPago, cargados desde el panel.
 *
 * Dos juegos de credenciales (prueba y producción) y un interruptor de modo:
 * primero se prueba con las de TEST- y cuando todo anda se pasa a APP_USR-.
 * Se guardan cifradas en la tabla `integraciones`; el `.env` sigue valiendo
 * como respaldo (lo que ya estaba configurado no deja de funcionar).
 *
 * El "estado" (última prueba, último webhook, último error) vive en el mismo
 * JSON: es lo que el panel muestra para saber si algo se rompió.
 */
class MercadoPagoConfig
{
    public const MODOS = ['test', 'produccion'];

    private const NOMBRE = 'mercadopago';

    private const CACHE = 'integraciones.mercadopago';

    private const API = 'https://api.mercadopago.com';

    /**
     * Qué credenciales tiene cada modo. Client ID / Client Secret solo existen
     * en producción y son de OAuth (marketplace): Checkout Pro no los usa, pero
     * MercadoPago los entrega juntos y acá quedan guardados y cifrados.
     */
    private const CAMPOS = [
        'test' => ['access_token', 'public_key'],
        'produccion' => ['access_token', 'public_key', 'client_id', 'client_secret'],
    ];

    /** Configuración completa, con secretos en claro. Solo para uso interno. */
    public function obtener(): array
    {
        return Cache::rememberForever(self::CACHE, function () {
            $fila = DB::table('integraciones')->where('nombre', self::NOMBRE)->value('config');
            $guardado = $fila ? json_decode(Crypt::decryptString($fila), true) : [];

            return array_replace_recursive($this->porDefecto(), $guardado ?? []);
        });
    }

    /**
     * Guarda lo que vino del panel. Un secreto vacío conserva el anterior: así
     * el formulario puede volver a enviarse sin re-tipear tokens.
     */
    public function guardar(array $datos): void
    {
        $actual = $this->obtener();

        foreach (self::MODOS as $modo) {
            foreach (self::CAMPOS[$modo] as $campo) {
                $nuevo = trim((string) data_get($datos, "{$modo}.{$campo}", ''));
                if ($nuevo !== '') {
                    $actual[$modo][$campo] = $nuevo;
                }
            }
        }
        if (filled($datos['webhook_secret'] ?? null)) {
            $actual['webhook_secret'] = trim($datos['webhook_secret']);
        }
        if (filled($datos['descriptor'] ?? null)) {
            $actual['descriptor'] = trim($datos['descriptor']);
        }
        if (in_array($datos['modo'] ?? null, self::MODOS, true)) {
            $actual['modo'] = $datos['modo'];
        }

        $this->persistir($actual);
    }

    /** Borra las credenciales de un modo (o el secreto del webhook con 'webhook'). */
    public function borrar(string $que): void
    {
        $actual = $this->obtener();
        if ($que === 'webhook') {
            $actual['webhook_secret'] = '';
        } elseif (in_array($que, self::MODOS, true)) {
            $actual[$que] = array_fill_keys(self::CAMPOS[$que], '');
        }
        $this->persistir($actual);
    }

    /** Credenciales del modo activo, o null si ese modo no tiene access token. */
    public function credencialesActivas(): ?array
    {
        $c = $this->obtener();
        $modo = $c['modo'];

        if (blank($c[$modo]['access_token'])) {
            return null;
        }

        return [
            'modo' => $modo,
            'access_token' => $c[$modo]['access_token'],
            'public_key' => $c[$modo]['public_key'],
            'descriptor' => $c['descriptor'],
        ];
    }

    public function webhookSecret(): string
    {
        return (string) $this->obtener()['webhook_secret'];
    }

    /**
     * Prueba un juego de credenciales contra la API de MercadoPago y deja el
     * resultado en el estado. Se pueden pasar credenciales sin guardar (el
     * panel prueba antes de guardar); si faltan, usa las guardadas.
     */
    public function probar(string $modo, ?string $accessToken = null, ?string $publicKey = null): array
    {
        $c = $this->obtener();
        $accessToken = filled($accessToken) ? trim($accessToken) : $c[$modo]['access_token'];
        $publicKey = filled($publicKey) ? trim($publicKey) : $c[$modo]['public_key'];

        $resultado = $this->verificar($modo, $accessToken, $publicKey);

        $c['estado']['ultima_prueba'] = [...$resultado, 'modo' => $modo, 'en' => now()->toIso8601String()];
        $this->persistir($c);

        return $c['estado']['ultima_prueba'];
    }

    public function registrarWebhook(): void
    {
        $c = $this->obtener();
        $c['estado']['ultimo_webhook_en'] = now()->toIso8601String();
        $this->persistir($c);
    }

    public function registrarError(string $mensaje): void
    {
        $c = $this->obtener();
        $c['estado']['ultimo_error'] = ['mensaje' => mb_substr($mensaje, 0, 300), 'en' => now()->toIso8601String()];
        $this->persistir($c);
    }

    public function limpiarError(): void
    {
        $c = $this->obtener();
        $c['estado']['ultimo_error'] = null;
        $this->persistir($c);
    }

    /** Lo que ve el panel: secretos enmascarados, estado y alertas. */
    public function resumen(): array
    {
        $c = $this->obtener();
        $activas = $this->credencialesActivas();

        $juego = fn (string $modo) => [
            'accessToken' => self::enmascarar($c[$modo]['access_token']),
            'publicKey' => self::enmascarar($c[$modo]['public_key']),
            'clientId' => self::enmascarar($c[$modo]['client_id'] ?? null),
            'clientSecret' => self::enmascarar($c[$modo]['client_secret'] ?? null),
            'configured' => filled($c[$modo]['access_token']),
        ];

        return [
            'mode' => $c['modo'],
            'gateway' => $activas ? ($activas['modo'] === 'test' ? 'MercadoPago (prueba)' : 'MercadoPago (producción)') : 'Simulada',
            'live' => $activas !== null && $activas['modo'] === 'produccion',
            'test' => $juego('test'),
            'production' => $juego('produccion'),
            'webhookSecret' => self::enmascarar($c['webhook_secret']),
            'webhookConfigured' => filled($c['webhook_secret']),
            'webhookUrl' => url('/api/webhooks/mercadopago'),
            'descriptor' => $c['descriptor'],
            'status' => [
                'lastTest' => $c['estado']['ultima_prueba'],
                'lastWebhookAt' => $c['estado']['ultimo_webhook_en'],
                'lastError' => $c['estado']['ultimo_error'],
            ],
            'alerts' => $this->alertas(),
        ];
    }

    /**
     * Qué está mal o merece atención. Cada alerta tiene `key` estable (para
     * que el panel avise una sola vez), `level` y `message`.
     */
    public function alertas(): array
    {
        $c = $this->obtener();
        $activas = $this->credencialesActivas();
        $alertas = [];

        if (! $activas) {
            $alertas[] = [
                'key' => 'mp-sin-credenciales',
                'level' => app()->isProduction() ? 'error' : 'warning',
                'message' => 'MercadoPago sin credenciales: el checkout usa la pasarela simulada y no cobra.',
            ];
        } elseif ($activas['modo'] === 'test') {
            $alertas[] = [
                'key' => 'mp-modo-test',
                'level' => app()->isProduction() ? 'error' : 'info',
                'message' => 'MercadoPago en modo prueba: los pagos no son reales. Pasá a producción cuando termines de probar.',
            ];
        }

        if ($activas && $activas['modo'] === 'produccion' && blank($c['webhook_secret'])) {
            $alertas[] = [
                'key' => 'mp-sin-webhook-secret',
                'level' => 'warning',
                'message' => 'Falta la clave secreta del webhook: las notificaciones de MercadoPago se aceptan sin verificar la firma.',
            ];
        }

        $prueba = $c['estado']['ultima_prueba'];
        if ($prueba && ! $prueba['ok'] && $prueba['modo'] === $c['modo']) {
            $alertas[] = [
                'key' => 'mp-prueba-fallida-'.$prueba['en'],
                'level' => 'error',
                'message' => 'La última prueba de MercadoPago falló: '.$prueba['mensaje'],
            ];
        }

        $error = $c['estado']['ultimo_error'];
        if ($error && now()->diffInHours($error['en']) < 48) {
            $alertas[] = [
                'key' => 'mp-error-'.$error['en'],
                'level' => 'error',
                'message' => 'Error reciente con MercadoPago: '.$error['mensaje'],
            ];
        }

        return $alertas;
    }

    /** Para el sitio: en qué modo está el checkout, sin exponer nada más. */
    public function modoPublico(): string
    {
        return $this->credencialesActivas()['modo'] ?? 'simulado';
    }

    // --- Internos ---

    private function verificar(string $modo, string $accessToken, string $publicKey): array
    {
        if (blank($accessToken)) {
            return ['ok' => false, 'mensaje' => 'No hay access token cargado para este modo.', 'cuenta' => null];
        }

        $prefijo = $modo === 'test' ? 'TEST-' : 'APP_USR-';
        if (! str_starts_with($accessToken, $prefijo)) {
            return ['ok' => false, 'mensaje' => "El access token de {$this->nombreModo($modo)} tiene que empezar con {$prefijo}. Revisá que no hayas cruzado las credenciales.", 'cuenta' => null];
        }
        if (filled($publicKey) && ! str_starts_with($publicKey, $prefijo)) {
            return ['ok' => false, 'mensaje' => "La public key de {$this->nombreModo($modo)} tiene que empezar con {$prefijo}.", 'cuenta' => null];
        }

        try {
            $respuesta = Http::withToken($accessToken)->timeout(8)->get(self::API.'/users/me');
        } catch (Throwable $e) {
            return ['ok' => false, 'mensaje' => 'No se pudo conectar con MercadoPago: '.$e->getMessage(), 'cuenta' => null];
        }

        if ($respuesta->status() === 401 || $respuesta->status() === 403) {
            return ['ok' => false, 'mensaje' => 'MercadoPago rechazó el access token (401). Copialo de nuevo desde "Tus integraciones" → Credenciales.', 'cuenta' => null];
        }
        if (! $respuesta->successful()) {
            return ['ok' => false, 'mensaje' => "MercadoPago respondió {$respuesta->status()}: ".($respuesta->json('message') ?? 'error desconocido'), 'cuenta' => null];
        }

        $u = $respuesta->json();
        $cuenta = [
            'nickname' => $u['nickname'] ?? null,
            'email' => $u['email'] ?? null,
            'siteId' => $u['site_id'] ?? null,
            'id' => $u['id'] ?? null,
        ];

        if (($u['site_id'] ?? 'MLA') !== 'MLA') {
            return ['ok' => false, 'mensaje' => "La cuenta es del sitio {$u['site_id']}, no de Argentina (MLA). Los cobros en pesos van a fallar.", 'cuenta' => $cuenta];
        }

        return ['ok' => true, 'mensaje' => 'Conexión correcta con la cuenta '.($cuenta['nickname'] ?? $cuenta['email'] ?? $cuenta['id']).'.', 'cuenta' => $cuenta];
    }

    private function persistir(array $config): void
    {
        DB::table('integraciones')->updateOrInsert(
            ['nombre' => self::NOMBRE],
            ['config' => Crypt::encryptString(json_encode($config, JSON_UNESCAPED_UNICODE)), 'updated_at' => now(), 'created_at' => now()],
        );
        Cache::forget(self::CACHE);
    }

    /** Sin nada guardado: lo del .env, ubicado en el modo que indica su prefijo. */
    private function porDefecto(): array
    {
        $env = config('petru.mercadopago');
        $token = (string) $env['access_token'];
        $modoEnv = str_starts_with($token, 'TEST-') ? 'test' : 'produccion';

        $base = [
            'modo' => 'test',
            'test' => ['access_token' => '', 'public_key' => ''],
            'produccion' => ['access_token' => '', 'public_key' => '', 'client_id' => '', 'client_secret' => ''],
            'webhook_secret' => (string) $env['webhook_secret'],
            'descriptor' => (string) ($env['descriptor'] ?: 'PETRU'),
            'estado' => ['ultima_prueba' => null, 'ultimo_webhook_en' => null, 'ultimo_error' => null],
        ];

        if (filled($token)) {
            $base[$modoEnv] = [...$base[$modoEnv], 'access_token' => $token, 'public_key' => (string) $env['public_key']];
            $base['modo'] = $modoEnv;
        }

        return $base;
    }

    private function nombreModo(string $modo): string
    {
        return $modo === 'test' ? 'prueba' : 'producción';
    }

    public static function enmascarar(?string $secreto): ?string
    {
        if (blank($secreto)) {
            return null;
        }
        $visible = mb_substr($secreto, -4);

        return str_repeat('•', 12).$visible;
    }
}
