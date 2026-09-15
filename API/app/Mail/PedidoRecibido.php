<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PedidoRecibido extends MailDePedido
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: "Recibimos tu pedido #{$this->pedido->numero}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.pedidos.recibido', with: $this->datosComunes());
    }
}
