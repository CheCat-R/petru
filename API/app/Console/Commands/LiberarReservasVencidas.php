<?php

namespace App\Console\Commands;

use App\Models\Pedido;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Devuelve al catálogo el stock de los pedidos pendientes cuya reserva venció
 * (el cliente se fue a MercadoPago y nunca terminó de pagar).
 *
 * Corre cada minuto desde el cron del hosting: `php artisan schedule:run`.
 */
class LiberarReservasVencidas extends Command
{
    protected $signature = 'petru:liberar-reservas';

    protected $description = 'Libera el stock de pedidos pendientes o rechazados cuya reserva venció';

    public function handle(): int
    {
        $liberados = 0;

        Pedido::query()
            ->reservaVencida()
            ->with('items.producto')
            ->chunkById(50, function ($pedidos) use (&$liberados) {
                foreach ($pedidos as $pedido) {
                    DB::transaction(function () use ($pedido) {
                        $pedido->cancelar('Reserva vencida: el pago no se completó a tiempo');
                    });
                    $liberados++;
                }
            });

        $this->info("Reservas liberadas: {$liberados}");

        return self::SUCCESS;
    }
}
