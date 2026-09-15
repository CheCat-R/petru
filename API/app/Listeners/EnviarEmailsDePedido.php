<?php

namespace App\Listeners;

use App\Events\PagoRechazado;
use App\Events\PedidoCreado;
use App\Events\PedidoDespachado;
use App\Events\PedidoPagado;
use App\Mail\NuevoPedidoTaller;
use App\Mail\PagoConfirmado;
use App\Mail\PagoRechazadoMail;
use App\Mail\PedidoDespachadoMail;
use App\Mail\PedidoRecibido;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Mail;

/**
 * Un solo suscriptor para el ciclo de vida del pedido. Corre en cola: el
 * webhook de MercadoPago no espera al SMTP.
 *
 * En hosting compartido no hay worker: el cron corre `queue:work --stop-when-empty`
 * cada minuto (ver routes/console.php), así que un mail tarda hasta un minuto.
 */
class EnviarEmailsDePedido implements ShouldQueue
{
    public int $tries = 3;

    public int $backoff = 60;

    public function subscribe(Dispatcher $eventos): array
    {
        return [
            PedidoCreado::class => 'alCrear',
            PedidoPagado::class => 'alPagar',
            PagoRechazado::class => 'alRechazar',
            PedidoDespachado::class => 'alDespachar',
        ];
    }

    public function alCrear(PedidoCreado $evento): void
    {
        Mail::to($evento->pedido->email_cliente)->send(new PedidoRecibido($evento->pedido));
    }

    public function alPagar(PedidoPagado $evento): void
    {
        Mail::to($evento->pedido->email_cliente)->send(new PagoConfirmado($evento->pedido));

        if ($taller = config('petru.email_taller')) {
            Mail::to($taller)->send(new NuevoPedidoTaller($evento->pedido));
        }
    }

    public function alRechazar(PagoRechazado $evento): void
    {
        Mail::to($evento->pedido->email_cliente)->send(new PagoRechazadoMail($evento->pedido));
    }

    public function alDespachar(PedidoDespachado $evento): void
    {
        Mail::to($evento->pedido->email_cliente)->send(new PedidoDespachadoMail($evento->pedido));
    }
}
