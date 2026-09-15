<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Estadísticas del sitio para el panel: visitas, de dónde vienen, qué miran y
 * cuánto de eso termina en venta. Todo sale de `eventos_sitio` (analítica
 * propia) y de `pedidos` (lo pagado). Un solo endpoint, un solo período.
 */
class EstadisticaController extends Controller
{
    private const PERIODOS = [7, 30, 90, 365];

    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['dias' => ['nullable', 'integer', 'in:'.implode(',', self::PERIODOS)]]);
        $dias = (int) $request->integer('dias', 30);

        $hasta = CarbonImmutable::now()->endOfDay();
        $desde = $hasta->subDays($dias - 1)->startOfDay();
        $desdeAnterior = $desde->subDays($dias);
        $hastaAnterior = $desde->subSecond();

        $actual = $this->resumen($desde, $hasta);
        $anterior = $this->resumen($desdeAnterior, $hastaAnterior);

        return response()->json(['data' => [
            'period' => ['days' => $dias, 'from' => $desde->toDateString(), 'to' => $hasta->toDateString()],
            'summary' => $actual,
            'previous' => $anterior,
            'series' => $this->serie($desde, $hasta, $dias),
            'funnel' => $this->embudo($desde, $hasta, $actual),
            'sources' => $this->fuentes($desde, $hasta),
            'referrers' => $this->referentes($desde, $hasta),
            'campaigns' => $this->campanias($desde, $hasta),
            'pages' => $this->paginas($desde, $hasta),
            'products' => $this->productos($desde, $hasta),
            'devices' => $this->dispositivos($desde, $hasta),
            'hasData' => DB::table('eventos_sitio')->exists(),
        ]]);
    }

    private function eventos(CarbonImmutable $desde, CarbonImmutable $hasta)
    {
        return DB::table('eventos_sitio')->whereBetween('creado_en', [$desde, $hasta]);
    }

    private function pedidosPagados(CarbonImmutable $desde, CarbonImmutable $hasta)
    {
        return Pedido::query()->where('estado_pago', Pedido::PAGO_PAGADO)->whereBetween('pagado_en', [$desde, $hasta]);
    }

    private function resumen(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $e = fn () => $this->eventos($desde, $hasta);

        $visitantes = (int) $e()->where('tipo', 'pageview')->distinct()->count('visitante');
        $pedidos = (int) $this->pedidosPagados($desde, $hasta)->count();
        $ingresos = (float) $this->pedidosPagados($desde, $hasta)->sum('total');

        return [
            'visitors' => $visitantes,
            'sessions' => (int) $e()->distinct()->count('sesion'),
            'pageviews' => (int) $e()->where('tipo', 'pageview')->count(),
            'productViews' => (int) $e()->where('tipo', 'product_view')->count(),
            'productViewers' => (int) $e()->where('tipo', 'product_view')->distinct()->count('visitante'),
            'addToCart' => (int) $e()->where('tipo', 'add_to_cart')->distinct()->count('visitante'),
            'checkouts' => (int) $e()->where('tipo', 'checkout_start')->distinct()->count('visitante'),
            'orders' => $pedidos,
            'revenue' => $ingresos,
            'conversion' => $visitantes > 0 ? round($pedidos / $visitantes * 100, 2) : 0,
            'averageOrder' => $pedidos > 0 ? round($ingresos / $pedidos, 2) : 0,
        ];
    }

    /** Un punto por día (o por semana cuando el período es de un año). */
    private function serie(CarbonImmutable $desde, CarbonImmutable $hasta, int $dias): array
    {
        $porSemana = $dias > 90;
        $formato = $porSemana ? '%x-%v' : '%Y-%m-%d';

        $filas = $this->eventos($desde, $hasta)
            ->selectRaw("DATE_FORMAT(creado_en, '{$formato}') as periodo")
            ->selectRaw("COUNT(DISTINCT CASE WHEN tipo = 'pageview' THEN visitante END) as visitantes")
            ->selectRaw("SUM(tipo = 'pageview') as vistas")
            ->selectRaw("SUM(tipo = 'product_view') as vistas_producto")
            ->groupBy('periodo')
            ->get()
            ->keyBy('periodo');

        $pedidos = $this->pedidosPagados($desde, $hasta)
            ->selectRaw("DATE_FORMAT(pagado_en, '{$formato}') as periodo, COUNT(*) as pedidos, SUM(total) as ingresos")
            ->groupBy('periodo')
            ->get()
            ->keyBy('periodo');

        $puntos = [];
        $cursor = $desde;
        while ($cursor <= $hasta) {
            $clave = $porSemana ? $cursor->format('o-W') : $cursor->toDateString();
            $puntos[$clave] ??= [
                'date' => $cursor->toDateString(),
                'label' => $porSemana ? 'Sem. '.$cursor->format('W') : $cursor->format('d/m'),
                'visitors' => (int) ($filas[$clave]->visitantes ?? 0),
                'pageviews' => (int) ($filas[$clave]->vistas ?? 0),
                'productViews' => (int) ($filas[$clave]->vistas_producto ?? 0),
                'orders' => (int) ($pedidos[$clave]->pedidos ?? 0),
                'revenue' => (float) ($pedidos[$clave]->ingresos ?? 0),
            ];
            $cursor = $cursor->addDay();
        }

        return array_values($puntos);
    }

    private function embudo(CarbonImmutable $desde, CarbonImmutable $hasta, array $resumen): array
    {
        return [
            ['key' => 'visitors', 'label' => 'Visitaron el sitio', 'value' => $resumen['visitors']],
            ['key' => 'productViewers', 'label' => 'Miraron una pieza', 'value' => $resumen['productViewers']],
            ['key' => 'addToCart', 'label' => 'Agregaron al carrito', 'value' => $resumen['addToCart']],
            ['key' => 'checkouts', 'label' => 'Empezaron el checkout', 'value' => $resumen['checkouts']],
            ['key' => 'orders', 'label' => 'Pagaron', 'value' => $resumen['orders']],
        ];
    }

    private function fuentes(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $visitantes = $this->eventos($desde, $hasta)->where('tipo', 'pageview')
            ->selectRaw('fuente, COUNT(DISTINCT visitante) as visitantes')
            ->groupBy('fuente')->get()->keyBy('fuente');

        $pedidos = $this->eventos($desde, $hasta)->where('tipo', 'order')
            ->selectRaw('fuente, COUNT(DISTINCT pedido_numero) as pedidos')
            ->groupBy('fuente')->get()->keyBy('fuente');

        return $visitantes->map(fn ($f, $fuente) => [
            'source' => $fuente,
            'visitors' => (int) $f->visitantes,
            'orders' => (int) ($pedidos[$fuente]->pedidos ?? 0),
        ])->sortByDesc('visitors')->values()->all();
    }

    private function referentes(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        return $this->eventos($desde, $hasta)->where('tipo', 'pageview')->whereNotNull('referente')
            ->selectRaw('referente, COUNT(DISTINCT visitante) as visitantes')
            ->groupBy('referente')->orderByDesc('visitantes')->limit(10)->get()
            ->map(fn ($r) => ['host' => $r->referente, 'visitors' => (int) $r->visitantes])->all();
    }

    private function campanias(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $visitantes = $this->eventos($desde, $hasta)->where('tipo', 'pageview')->whereNotNull('utm_campaign')
            ->selectRaw('utm_campaign, utm_source, utm_medium, COUNT(DISTINCT visitante) as visitantes')
            ->groupBy('utm_campaign', 'utm_source', 'utm_medium')->orderByDesc('visitantes')->limit(10)->get();

        $pedidos = $this->eventos($desde, $hasta)->where('tipo', 'order')->whereNotNull('utm_campaign')
            ->selectRaw('utm_campaign, COUNT(DISTINCT pedido_numero) as pedidos')
            ->groupBy('utm_campaign')->get()->keyBy('utm_campaign');

        return $visitantes->map(fn ($c) => [
            'campaign' => $c->utm_campaign,
            'source' => $c->utm_source,
            'medium' => $c->utm_medium,
            'visitors' => (int) $c->visitantes,
            'orders' => (int) ($pedidos[$c->utm_campaign]->pedidos ?? 0),
        ])->all();
    }

    private function paginas(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        return $this->eventos($desde, $hasta)->where('tipo', 'pageview')
            ->selectRaw('ruta, COUNT(*) as vistas, COUNT(DISTINCT visitante) as visitantes')
            ->groupBy('ruta')->orderByDesc('vistas')->limit(12)->get()
            ->map(fn ($p) => ['path' => $p->ruta, 'views' => (int) $p->vistas, 'visitors' => (int) $p->visitantes])->all();
    }

    private function productos(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $vistas = $this->eventos($desde, $hasta)->whereIn('tipo', ['product_view', 'add_to_cart'])->whereNotNull('producto_id')
            ->selectRaw("producto_id, SUM(tipo = 'product_view') as vistas, COUNT(DISTINCT CASE WHEN tipo = 'product_view' THEN visitante END) as visitantes, SUM(tipo = 'add_to_cart') as carritos")
            ->groupBy('producto_id')->get()->keyBy('producto_id');

        $vendidos = DB::table('pedido_items')
            ->join('pedidos', 'pedidos.id', '=', 'pedido_items.pedido_id')
            ->where('pedidos.estado_pago', Pedido::PAGO_PAGADO)
            ->whereBetween('pedidos.pagado_en', [$desde, $hasta])
            ->selectRaw('pedido_items.producto_id, SUM(pedido_items.cantidad) as unidades')
            ->groupBy('pedido_items.producto_id')->get()->keyBy('producto_id');

        $ids = $vistas->keys()->merge($vendidos->keys())->unique()->filter();
        if ($ids->isEmpty()) {
            return [];
        }

        $productos = DB::table('productos')->whereIn('id', $ids)->get(['id', 'nombre', 'slug'])->keyBy('id');
        $imagenes = DB::table('producto_imagenes')->whereIn('producto_id', $ids)->where('principal', true)->get(['producto_id', 'url'])->keyBy('producto_id');

        return $ids->map(fn ($id) => [
            'id' => (int) $id,
            'name' => $productos[$id]->nombre ?? "Pieza #{$id}",
            'slug' => $productos[$id]->slug ?? null,
            'imageUrl' => $imagenes[$id]->url ?? null,
            'views' => (int) ($vistas[$id]->vistas ?? 0),
            'viewers' => (int) ($vistas[$id]->visitantes ?? 0),
            'addToCart' => (int) ($vistas[$id]->carritos ?? 0),
            'sold' => (int) ($vendidos[$id]->unidades ?? 0),
        ])->sortByDesc('views')->values()->take(15)->all();
    }

    private function dispositivos(CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        return $this->eventos($desde, $hasta)->where('tipo', 'pageview')
            ->selectRaw('dispositivo, COUNT(DISTINCT visitante) as visitantes')
            ->groupBy('dispositivo')->orderByDesc('visitantes')->get()
            ->map(fn ($d) => ['device' => $d->dispositivo, 'visitors' => (int) $d->visitantes])->all();
    }
}
