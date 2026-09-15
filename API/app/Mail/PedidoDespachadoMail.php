<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PedidoDespachadoMail extends MailDePedido
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: "Tu pedido #{$this->pedido->numero} está en camino");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.pedidos.despachado', with: $this->datosComunes());
    }
}
