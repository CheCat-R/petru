<?php

namespace App\Mail;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Base de los mails al cliente sobre un pedido: todos comparten el link de seguimiento. */
abstract class MailDePedido extends Mailable
{
    use Queueable, SerializesModels;

    public readonly string $urlSeguimiento;

    public function __construct(public readonly Pedido $pedido)
    {
        $this->urlSeguimiento = rtrim(config('petru.frontend_url'), '/').'/pedido/'.$pedido->token;
    }

    /** Datos comunes para las vistas markdown. */
    protected function datosComunes(): array
    {
        $this->pedido->loadMissing('items');

        return [
            'pedido' => $this->pedido,
            'urlSeguimiento' => $this->urlSeguimiento,
            'nombre' => explode(' ', trim($this->pedido->nombre_cliente))[0],
            'retiraEnTaller' => (float) $this->pedido->costo_envio === 0.0 && ($this->pedido->cotizacion_envio['metodo'] ?? null) === 'retiro',
        ];
    }
}
