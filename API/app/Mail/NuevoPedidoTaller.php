<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NuevoPedidoTaller extends MailDePedido
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: "Nuevo pedido pagado #{$this->pedido->numero} · ".number_format((float) $this->pedido->total, 0, ",", "."));
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.taller.nuevo-pedido', with: $this->datosComunes());
    }
}
