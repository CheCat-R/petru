<?php

namespace App\Events;

use App\Models\Pedido;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Se despacha recién después del commit: los listeners en cola ven el pedido ya guardado. */
class PedidoDespachado implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Pedido $pedido)
    {
    }
}
