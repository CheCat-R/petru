<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PagoConfirmado extends MailDePedido
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: "¡Pago confirmado! Pedido #{$this->pedido->numero}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.pedidos.pago-confirmado', with: $this->datosComunes());
    }
}
