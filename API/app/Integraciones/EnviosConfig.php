<?php

namespace App\Integraciones;

use App\Services\Envios\AndreaniClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Envíos, configurados desde el panel: retiro en el taller, zonas de cobertura
 * con su tarifa de respaldo, el bulto por defecto y las credenciales de
 * Andreani. Va cifrado en `integraciones` porque lleva la contraseña de
 * Andreani; `config/petru.php` y el `.env` son los valores de arranque.
 *
 * La tabla de zonas es la red de seguridad de la venta: aunque Andreani cotice
 * en vivo, si no responde se cobra lo que diga la zona, y por eso siempre
 * tiene que estar cargada.
 */
class EnviosConfig
{
    private const NOMBRE = 'envios';

    private const CACHE = 'integraciones.envios';

    /** Configuración completa (con la contraseña de Andreani en claro). Uso interno. */
    public function obtener(): array
    {
        return Cache::rememberForever(self::CACHE, function () {
            $fila = DB::table('integraciones')->where('nombre', self::NOMBRE)->value('config');
            $guardado = $fila ? json_decode(Crypt::decryptString($fila), true) : [];
            $defecto = $this->porDefecto();

            $c = array_replace_recursive($defecto, $guardado ?? []);
            // Las zonas guardadas reemplazan enteras a las de fábrica (el merge por índice las mezclaría).
            if (isset($guardado['zonas']) && is_array($guardado['zonas'])) {
                $c['zonas'] = array_values($guardado['zonas']);
            }

            return $c;
        });
    }

    /** Lo que vino del panel. La contraseña de Andreani vacía conserva la guardada. */
    public function guardar(array $datos): void
    {
        $actual = $this->obtener();

        $actual['retiro'] = [...$actual['retiro'], ...$datos['retiro']];
        $actual['zonas'] = array_values(array_map(fn ($z) => [
            'nombre' => trim($z['nombre']),
            'codigos_postales' => array_values(array_unique(array_map('strval', $z['codigos_postales']))),
            'costo' => (float) $z['costo'],
            'plazo' => trim((string) ($z['plazo'] ?? '')),
        ], $datos['zonas']));
        $actual['transportista_por_defecto'] = $datos['transportista_por_defecto'] ?? $actual['transportista_por_defecto'];
        $actual['bulto_por_defecto'] = [...$actual['bulto_por_defecto'], ...($datos['bulto_por_defecto'] ?? [])];

        foreach (['usuario', 'cliente', 'contrato', 'cp_origen'] as $campo) {
            if (array_key_exists($campo, $datos['andreani'] ?? [])) {
                $actual['andreani'][$campo] = trim((string) $datos['andreani'][$campo]);
            }
        }
        if (filled($datos['andreani']['password'] ?? null)) {
            $actual['andreani']['password'] = trim($datos['andreani']['password']);
        }

        $this->persistir($actual);
    }

    public function borrarAndreani(): void
    {
        $actual = $this->obtener();
        $actual['andreani'] = ['usuario' => '', 'password' => '', 'cliente' => '', 'contrato' => '', 'cp_origen' => $actual['andreani']['cp_origen']];
        $actual['estado']['ultima_prueba'] = null;
        $this->persistir($actual);
    }

    /** Config lista para `new AndreaniClient(...)`: credenciales + parámetros técnicos. */
    public function andreani(): array
    {
        $tecnico = config('petru.andreani');

        return [
            ...$this->obtener()['andreani'],
            'api_url' => $tecnico['api_url'],
            'timeout' => $tecnico['timeout'],
            'cache_minutos' => $tecnico['cache_minutos'],
        ];
    }

    public function zonas(): array
    {
        return $this->obtener()['zonas'];
    }

    public function retiro(): array
    {
        return $this->obtener()['retiro'];
    }

    public function bultoPorDefecto(): array
    {
        return $this->obtener()['bulto_por_defecto'];
    }

    public function transportistaPorDefecto(): string
    {
        return $this->obtener()['transportista_por_defecto'];
    }

    /** Login + una cotización real a Rosario con el bulto por defecto. */
    public function probarAndreani(?array $credenciales = null): array
    {
        $config = $this->andreani();
        foreach (['usuario', 'cliente', 'contrato', 'cp_origen'] as $campo) {
            if (filled($credenciales[$campo] ?? null)) {
                $config[$campo] = trim($credenciales[$campo]);
            }
        }
        if (filled($credenciales['password'] ?? null)) {
            $config['password'] = trim($credenciales['password']);
        }

        $cliente = new AndreaniClient($config);
        if (! $cliente->estaConfigurado()) {
            $resultado = ['ok' => false, 'mensaje' => 'Faltan datos: usuario, contraseña, número de cliente y contrato.', 'cotizacion' => null];
        } else {
            try {
                $bulto = $this->bultoPorDefecto();
                $r = $cliente->cotizar('2000', (float) $bulto['peso_kg'], (int) ($bulto['alto_cm'] * $bulto['ancho_cm'] * $bulto['largo_cm']), 10000, sinCache: true);
                $resultado = [
                    'ok' => true,
                    'mensaje' => 'Andreani respondió. Un bulto de '.$bulto['peso_kg'].' kg a Rosario cuesta $ '.number_format($r['costo'], 0, ',', '.').($r['plazo'] ? " ({$r['plazo']})" : '').'.',
                    'cotizacion' => ['costo' => $r['costo'], 'plazo' => $r['plazo']],
                ];
            } catch (Throwable $e) {
                $resultado = ['ok' => false, 'mensaje' => $e->getMessage(), 'cotizacion' => null];
            }
        }

        $c = $this->obtener();
        $c['estado']['ultima_prueba'] = [...$resultado, 'en' => now()->toIso8601String()];
        $this->persistir($c);

        return $c['estado']['ultima_prueba'];
    }

    /** Lo llama el cotizador cuando Andreani falla y se cae a la tabla. */
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

    /** Para el panel: todo menos la contraseña, que va enmascarada. */
    public function resumen(): array
    {
        $c = $this->obtener();
        $andreani = (new AndreaniClient($this->andreani()))->estaConfigurado();

        return [
            'pickup' => $c['retiro'],
            'zones' => $c['zonas'],
            'defaultCarrier' => $c['transportista_por_defecto'],
            'defaultPackage' => $c['bulto_por_defecto'],
            'andreani' => [
                'usuario' => $c['andreani']['usuario'],
                'password' => MercadoPagoConfig::enmascarar($c['andreani']['password']),
                'cliente' => $c['andreani']['cliente'],
                'contrato' => $c['andreani']['contrato'],
                'cp_origen' => $c['andreani']['cp_origen'],
                'configured' => $andreani,
            ],
            'quoteSource' => $andreani ? 'Andreani en vivo (la tabla queda de respaldo)' : 'Tabla de zonas',
            'status' => [
                'lastTest' => $c['estado']['ultima_prueba'],
                'lastError' => $c['estado']['ultimo_error'],
            ],
            'alerts' => $this->alertas(),
        ];
    }

    public function alertas(): array
    {
        $c = $this->obtener();
        $alertas = [];

        if (empty($c['zonas'])) {
            $alertas[] = ['key' => 'envios-sin-zonas', 'level' => 'error', 'message' => 'No hay zonas de envío: nadie puede comprar con envío a domicilio.'];
        }

        $prueba = $c['estado']['ultima_prueba'];
        if ($prueba && ! $prueba['ok'] && (new AndreaniClient($this->andreani()))->estaConfigurado()) {
            $alertas[] = ['key' => 'andreani-prueba-fallida-'.$prueba['en'], 'level' => 'warning', 'message' => 'La última prueba de Andreani falló: '.$prueba['mensaje'].' Mientras tanto se cobra la tabla de zonas.'];
        }

        $error = $c['estado']['ultimo_error'];
        if ($error && now()->diffInHours($error['en']) < 48) {
            $alertas[] = ['key' => 'andreani-error-'.$error['en'], 'level' => 'warning', 'message' => 'Andreani no respondió en una cotización reciente y se cobró la tabla: '.$error['mensaje']];
        }

        return $alertas;
    }

    // --- Internos ---

    private function persistir(array $config): void
    {
        DB::table('integraciones')->updateOrInsert(
            ['nombre' => self::NOMBRE],
            ['config' => Crypt::encryptString(json_encode($config, JSON_UNESCAPED_UNICODE)), 'updated_at' => now(), 'created_at' => now()],
        );
        Cache::forget(self::CACHE);
    }

    private function porDefecto(): array
    {
        $envios = config('petru.envios');
        $andreani = config('petru.andreani');
        $retiro = $envios['retiro_en_taller'];

        return [
            'retiro' => [
                'habilitado' => (bool) $retiro['habilitado'],
                'nombre' => $retiro['nombre'],
                'detalle' => $retiro['detalle'],
                'plazo' => $retiro['plazo'],
            ],
            'zonas' => array_values($envios['zonas']),
            'transportista_por_defecto' => $envios['transportista_por_defecto'],
            'bulto_por_defecto' => $andreani['bulto_por_defecto'],
            'andreani' => [
                'usuario' => (string) $andreani['usuario'],
                'password' => (string) $andreani['password'],
                'cliente' => (string) $andreani['cliente'],
                'contrato' => (string) $andreani['contrato'],
                'cp_origen' => (string) $andreani['cp_origen'],
            ],
            'estado' => ['ultima_prueba' => null, 'ultimo_error' => null],
        ];
    }
}
