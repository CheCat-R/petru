<?php

namespace App\Models;

use App\Events\PagoRechazado;
use App\Events\PedidoDespachado;
use App\Events\PedidoPagado;
use App\Exceptions\TransicionInvalida;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * Pedido con dos ejes de estado independientes (pago y envío).
 *
 * Las transiciones viven acá como métodos, no en los controllers: son las mismas
 * reglas que `panel-dashboard/src/modules/pedidos/api/pedidosApi.js` ya aplica, y
 * los valores de estado son los strings exactos que el panel consume.
 */
class Pedido extends Model
{
    // estado_pago
    public const PAGO_PENDIENTE = 'Pendiente';
    public const PAGO_PAGADO = 'Pagado';
    public const PAGO_RECHAZADO = 'Rechazado';
    public const PAGO_CANCELADO = 'Cancelado';
    public const PAGO_REEMBOLSO_PENDIENTE = 'Reembolso pendiente';
    public const PAGO_REEMBOLSADO = 'Reembolsado';

    // estado_envio
    public const ENVIO_SIN_DESPACHAR = 'Sin despachar';
    public const ENVIO_DESPACHADO = 'Despachado';
    public const ENVIO_ENTREGADO = 'Entregado';
    public const ENVIO_DEVUELTO = 'Devuelto';
    public const ENVIO_CANCELADO = 'Cancelado';

    protected $fillable = [
        'numero', 'token',
        'nombre_cliente', 'email_cliente', 'telefono_cliente', 'dni_cliente',
        'calle', 'numero_calle', 'piso', 'departamento', 'localidad', 'provincia', 'codigo_postal', 'referencia_direccion',
        'subtotal', 'costo_envio', 'descuento', 'total', 'cupon_codigo',
        'estado_pago', 'estado_envio',
        'metodo_pago', 'referencia_pago', 'mp_preference_id', 'mp_payment_id',
        'transportista', 'tracking', 'cotizacion_envio',
        'reservado_hasta', 'notas',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'costo_envio' => 'decimal:2',
            'descuento' => 'decimal:2',
            'total' => 'decimal:2',
            'cotizacion_envio' => 'array',
            'reservado_hasta' => 'datetime',
            'pagado_en' => 'datetime',
            'rechazado_en' => 'datetime',
            'despachado_en' => 'datetime',
            'entregado_en' => 'datetime',
            'devuelto_en' => 'datetime',
            'reembolsado_en' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Pedido $pedido) {
            $pedido->token ??= (string) Str::uuid();
            $pedido->numero ??= self::proximoNumero();
        });
    }

    /** Numeración visible correlativa, arrancando en 10001 como el panel. */
    public static function proximoNumero(): string
    {
        $ultimo = (int) static::query()->max('numero');

        return (string) max($ultimo + 1, 10001);
    }

    // --- Relaciones ---

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class);
    }

    public function envio(): HasOne
    {
        return $this->hasOne(Envio::class)->latestOfMany();
    }

    // --- Scopes ---

    /**
     * Pedidos cuya reserva de stock venció sin que el pago se concretara.
     * Incluye los rechazados: el cliente puede reintentar mientras dure la
     * ventana, y al vencer las piezas vuelven al catálogo.
     */
    public function scopeReservaVencida(Builder $query): Builder
    {
        return $query
            ->whereIn('estado_pago', [self::PAGO_PENDIENTE, self::PAGO_RECHAZADO])
            ->whereNotNull('reservado_hasta')
            ->where('reservado_hasta', '<', now());
    }

    // --- Presentación ---

    /** La dirección como un solo string, que es lo que el panel lee hoy en `address`. */
    public function direccionFormateada(): string
    {
        $linea = trim("{$this->calle} {$this->numero_calle}");

        if ($this->piso || $this->departamento) {
            $linea .= ', '.trim(($this->piso ? "Piso {$this->piso}" : '').' '.($this->departamento ? "Depto {$this->departamento}" : ''));
        }

        $linea .= ", {$this->codigo_postal} {$this->localidad}, {$this->provincia}, Argentina";

        if ($this->telefono_cliente) {
            $linea .= " · Tel: {$this->telefono_cliente}";
        }

        return $linea;
    }

    // --- Transiciones de pago ---

    public function confirmarPago(string $mpPaymentId, ?string $metodo = null): void
    {
        $this->exigirEstadoPago(self::PAGO_PENDIENTE, 'Solo se puede confirmar el pago de un pedido pendiente.');

        $this->forceFill([
            'estado_pago' => self::PAGO_PAGADO,
            'pagado_en' => now(),
            'mp_payment_id' => $mpPaymentId,
            'referencia_pago' => $mpPaymentId,
            'metodo_pago' => $metodo ?? $this->metodo_pago ?? 'MercadoPago',
            'reservado_hasta' => null, // la reserva pasa a ser venta
        ])->save();

        $this->items->each(fn (PedidoItem $item) => $item->producto?->increment('unidades_vendidas', $item->cantidad));

        PedidoPagado::dispatch($this);
    }

    public function rechazarPago(string $motivo = 'Rechazado por la pasarela'): void
    {
        $this->exigirEstadoPago(self::PAGO_PENDIENTE, 'Solo se puede rechazar el pago de un pedido pendiente.');

        $this->forceFill([
            'estado_pago' => self::PAGO_RECHAZADO,
            'rechazado_en' => now(),
            'motivo_rechazo' => $motivo,
        ])->save();

        PagoRechazado::dispatch($this);
    }

    public function reintentarPago(): void
    {
        $this->exigirEstadoPago(self::PAGO_RECHAZADO, 'Solo se reintenta un pago rechazado.');

        $this->forceFill([
            'estado_pago' => self::PAGO_PENDIENTE,
            'rechazado_en' => null,
            'motivo_rechazo' => null,
            'reservado_hasta' => now()->addMinutes((int) config('petru.reserva_minutos', 30)),
        ])->save();
    }

    public function cancelar(?string $motivo = null): void
    {
        if (! in_array($this->estado_pago, [self::PAGO_PENDIENTE, self::PAGO_RECHAZADO], true)) {
            throw new TransicionInvalida('Solo se cancela un pedido pendiente o rechazado.');
        }

        $this->liberarStock();

        $this->forceFill([
            'estado_pago' => self::PAGO_CANCELADO,
            'estado_envio' => self::ENVIO_CANCELADO,
            'motivo_rechazo' => $motivo ?? $this->motivo_rechazo,
            'reservado_hasta' => null,
        ])->save();
    }

    public function reembolsar(): void
    {
        $this->exigirEstadoPago(self::PAGO_PAGADO, 'Solo se puede reembolsar un pedido pagado.');

        if ($this->estado_envio !== self::ENVIO_SIN_DESPACHAR) {
            throw new TransicionInvalida('El pedido ya fue despachado: primero corresponde la devolución.');
        }

        $this->liberarStock();

        $this->forceFill([
            'estado_pago' => self::PAGO_REEMBOLSADO,
            'estado_envio' => self::ENVIO_CANCELADO,
            'reembolsado_en' => now(),
        ])->save();
    }

    public function confirmarReembolso(): void
    {
        $this->exigirEstadoPago(self::PAGO_REEMBOLSO_PENDIENTE, 'No hay un reembolso pendiente.');

        $this->forceFill(['estado_pago' => self::PAGO_REEMBOLSADO, 'reembolsado_en' => now()])->save();
    }

    public function rechazarReembolso(): void
    {
        $this->exigirEstadoPago(self::PAGO_REEMBOLSO_PENDIENTE, 'No hay un reembolso pendiente.');

        $this->forceFill(['estado_pago' => self::PAGO_PAGADO])->save();
    }

    // --- Transiciones de envío ---

    public function despachar(string $transportista, ?string $tracking = null): void
    {
        if ($this->estado_pago !== self::PAGO_PAGADO || $this->estado_envio !== self::ENVIO_SIN_DESPACHAR) {
            throw new TransicionInvalida('Solo se despacha un pedido pagado y sin despachar.');
        }

        $this->forceFill([
            'estado_envio' => self::ENVIO_DESPACHADO,
            'despachado_en' => now(),
            'transportista' => $transportista,
            'tracking' => $tracking,
        ])->save();

        PedidoDespachado::dispatch($this);
    }

    public function marcarEntregado(): void
    {
        if ($this->estado_envio !== self::ENVIO_DESPACHADO) {
            throw new TransicionInvalida('El pedido no está despachado.');
        }

        $this->forceFill(['estado_envio' => self::ENVIO_ENTREGADO, 'entregado_en' => now()])->save();
    }

    public function registrarDevolucion(): void
    {
        if (! in_array($this->estado_envio, [self::ENVIO_DESPACHADO, self::ENVIO_ENTREGADO], true)) {
            throw new TransicionInvalida('Solo se devuelve un pedido despachado o entregado.');
        }

        $this->forceFill([
            'estado_envio' => self::ENVIO_DEVUELTO,
            'estado_pago' => self::PAGO_REEMBOLSO_PENDIENTE,
            'devuelto_en' => now(),
        ])->save();
    }

    // --- Stock ---

    /** Devuelve al catálogo las unidades de este pedido. Idempotente por diseño del llamador. */
    public function liberarStock(): void
    {
        $this->items->each(fn (PedidoItem $item) => $item->producto?->ajustarStock($item->cantidad));
    }

    // --- Internos ---

    private function exigirEstadoPago(string $esperado, string $mensaje): void
    {
        if ($this->estado_pago !== $esperado) {
            throw new TransicionInvalida($mensaje);
        }
    }
}
