<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PagoRechazadoMail extends MailDePedido
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: "No pudimos procesar el pago del pedido #{$this->pedido->numero}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.pedidos.pago-rechazado', with: $this->datosComunes());
    }
}
