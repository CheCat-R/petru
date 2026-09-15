<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Integraciones\EnviosConfig;
use App\Integraciones\MercadoPagoConfig;
use App\Models\Consulta;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;

/**
 * Lo que el taller tiene que atender: pedidos pagados sin despachar y consultas
 * sin leer. El panel lo consulta cada pocos segundos para avisar y para los
 * contadores del menú; por eso es una sola consulta liviana, sin paginación.
 */
class NovedadController extends Controller
{
    private const MAXIMO_EVENTOS = 15;

    public function __invoke(MercadoPagoConfig $mercadoPago, EnviosConfig $envios): JsonResponse
    {
        // Alertas de integraciones: van como eventos (para que el panel avise
        // cuando aparece una) y también aparte, para el cartel del dashboard.
        $alertas = collect($mercadoPago->alertas())
            ->map(fn ($a) => [...$a, 'source' => 'mercadopago'])
            ->concat(collect($envios->alertas())->map(fn ($a) => [...$a, 'source' => 'envios']));

        $pedidos = Pedido::query()
            ->where('estado_pago', Pedido::PAGO_PAGADO)
            ->where('estado_envio', Pedido::ENVIO_SIN_DESPACHAR)
            ->orderByDesc('pagado_en')
            ->limit(self::MAXIMO_EVENTOS)
            ->get(['id', 'numero', 'nombre_cliente', 'total', 'pagado_en', 'created_at']);

        $consultas = Consulta::query()
            ->where('estado', 'nueva')
            ->orderByDesc('id')
            ->limit(self::MAXIMO_EVENTOS)
            ->get(['id', 'nombre', 'motivo', 'created_at']);

        $eventos = collect()
            ->concat($pedidos->map(fn (Pedido $p) => [
                'key' => "pedido-{$p->id}",
                'type' => 'order',
                'id' => $p->numero,
                'title' => "Pedido #{$p->numero} pagado",
                'detail' => $p->nombre_cliente.' · $ '.number_format((float) $p->total, 0, ',', '.'),
                'at' => ($p->pagado_en ?? $p->created_at)->toIso8601String(),
                'urgent' => false,
            ]))
            ->concat($consultas->map(fn (Consulta $c) => [
                'key' => "consulta-{$c->id}",
                'type' => 'inquiry',
                'id' => $c->id,
                'title' => $c->motivo === 'arrepentimiento' ? 'Solicitud de arrepentimiento' : 'Nueva consulta',
                'detail' => $c->nombre,
                'at' => $c->created_at->toIso8601String(),
                'urgent' => $c->motivo === 'arrepentimiento',
            ]))
            ->sortByDesc('at')
            ->values()
            ->take(self::MAXIMO_EVENTOS);

        $eventos = $alertas
            ->filter(fn ($a) => $a['level'] === 'error')
            ->map(fn ($a) => [
                'key' => $a['key'],
                'type' => 'alert',
                'id' => null,
                'title' => $a['source'] === 'envios' ? 'Envíos' : 'MercadoPago',
                'detail' => $a['message'],
                'at' => now()->toIso8601String(),
                'urgent' => true,
            ])
            ->concat($eventos)
            ->values();

        return response()->json([
            'ordersToPrepare' => Pedido::query()
                ->where('estado_pago', Pedido::PAGO_PAGADO)
                ->where('estado_envio', Pedido::ENVIO_SIN_DESPACHAR)
                ->count(),
            'newInquiries' => Consulta::query()->where('estado', 'nueva')->count(),
            'alerts' => $alertas->values(),
            'events' => $eventos,
        ]);
    }
}
