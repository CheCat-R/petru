<?php

namespace App\Services\Envios;

use App\Exceptions\FueraDeCobertura;
use App\Integraciones\EnviosConfig;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Devuelve las opciones de envío para un carrito y un código postal.
 *
 * Reglas:
 *  1. Fuera de cobertura → excepción; el checkout lo dice antes de pedir el pago.
 *  2. "Retiro en el taller" siempre está, con costo cero.
 *  3. El envío a domicilio se cotiza en vivo contra Andreani si está configurado
 *     y responde; si no, con la tabla de zonas del panel (Integraciones →
 *     Envíos). La opción dice de dónde salió (`origen`), y el pedido lo congela.
 */
class CotizadorEnvio
{
    public const METODO_RETIRO = 'retiro';
    public const METODO_DOMICILIO = 'domicilio';

    public function __construct(
        private readonly AndreaniClient $andreani,
        private readonly EnviosConfig $config,
    ) {
    }

    /**
     * @param  Collection<int, array{producto: \App\Models\Producto, cantidad: int}>  $lineas
     * @return array<int, array{metodo: string, nombre: string, detalle: ?string, transportista: ?string, costo: float, plazo: ?string, origen: string}>
     */
    public function cotizar(string $codigoPostal, Collection $lineas): array
    {
        $cp = self::normalizarCp($codigoPostal);
        $zona = $this->zonaDe($cp);

        if (! $zona) {
            throw new FueraDeCobertura(
                'Por ahora enviamos solo a '.$this->describirCobertura().'. Escribinos por WhatsApp y vemos cómo hacerte llegar la pieza.'
            );
        }

        $opciones = [];

        $retiro = $this->config->retiro();
        if ($retiro['habilitado'] ?? false) {
            $opciones[] = [
                'metodo' => self::METODO_RETIRO,
                'nombre' => $retiro['nombre'],
                'detalle' => $retiro['detalle'] ?? null,
                'transportista' => null,
                'costo' => 0.0,
                'plazo' => $retiro['plazo'] ?? null,
                'origen' => 'taller',
            ];
        }

        $opciones[] = $this->domicilio($cp, $zona, $lineas);

        return $opciones;
    }

    /** Busca una opción concreta, para que el pedido use exactamente lo que se ofreció. */
    public function opcion(string $codigoPostal, Collection $lineas, string $metodo): array
    {
        foreach ($this->cotizar($codigoPostal, $lineas) as $opcion) {
            if ($opcion['metodo'] === $metodo) {
                return $opcion;
            }
        }

        throw new FueraDeCobertura('El método de envío elegido no está disponible para ese código postal.');
    }

    public function estaEnCobertura(string $codigoPostal): bool
    {
        return $this->zonaDe(self::normalizarCp($codigoPostal)) !== null;
    }

    // --- Internos ---

    private function domicilio(string $cp, array $zona, Collection $lineas): array
    {
        $base = [
            'metodo' => self::METODO_DOMICILIO,
            'nombre' => 'Envío a domicilio',
            'detalle' => "Embalaje blindado · {$zona['nombre']}",
            'transportista' => $this->config->transportistaPorDefecto(),
        ];

        if ($this->andreani->estaConfigurado()) {
            try {
                $bulto = $this->config->bultoPorDefecto();
                $peso = $lineas->sum(fn ($l) => (float) ($l['producto']->peso_kg ?? $bulto['peso_kg']) * $l['cantidad']);
                $volumen = (int) $lineas->sum(fn ($l) => ($l['producto']->alto_cm ?? $bulto['alto_cm'])
                    * ($l['producto']->ancho_cm ?? $bulto['ancho_cm'])
                    * ($l['producto']->largo_cm ?? $bulto['largo_cm'])
                    * $l['cantidad']);
                $valor = $lineas->sum(fn ($l) => (float) $l['producto']->precio * $l['cantidad']);

                $cotizacion = $this->andreani->cotizar($cp, $peso, $volumen, $valor);

                return [...$base,
                    'transportista' => 'Andreani',
                    'costo' => round($cotizacion['costo'], 2),
                    'plazo' => $cotizacion['plazo'] ?? $zona['plazo'],
                    'origen' => 'andreani',
                ];
            } catch (Throwable $e) {
                // La venta no se frena por Andreani: se cae a la tabla y se deja rastro
                // en el log y en el panel (Integraciones → Envíos).
                Log::warning('Andreani no respondió; se usa tarifa de respaldo', ['cp' => $cp, 'error' => $e->getMessage()]);
                $this->config->registrarError($e->getMessage());
            }
        }

        return [...$base,
            'costo' => (float) $zona['costo'],
            'plazo' => $zona['plazo'],
            'origen' => 'respaldo',
        ];
    }

    /** "Rosario y Gran Rosario", a partir de los nombres de las zonas cargadas. */
    public function describirCobertura(): string
    {
        $nombres = array_column($this->config->zonas(), 'nombre');
        $ultimo = array_pop($nombres);

        return $nombres ? implode(', ', $nombres).' y '.$ultimo : (string) $ultimo;
    }

    private function zonaDe(string $cp): ?array
    {
        foreach ($this->config->zonas() as $zona) {
            if (in_array($cp, $zona['codigos_postales'], true)) {
                return $zona;
            }
        }

        return null;
    }

    /** "S2000ABC" → "2000". Acepta CPA y CP de 4 dígitos. */
    public static function normalizarCp(string $cp): string
    {
        preg_match('/\d{4}/', $cp, $m);

        return $m[0] ?? '';
    }
}
