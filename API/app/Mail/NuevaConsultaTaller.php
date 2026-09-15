<?php

namespace App\Mail;

use App\Models\Consulta;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NuevaConsultaTaller extends Mailable
{
    use Queueable, SerializesModels;

    private const MOTIVOS = ['custom' => 'Pieza customizada', 'pedido' => 'Pedido en curso', 'otro' => 'Otra consulta', 'arrepentimiento' => 'ARREPENTIMIENTO (10 días para responder)'];

    public function __construct(public readonly Consulta $consulta)
    {
    }

    public function envelope(): Envelope
    {
        $envelope = new Envelope(subject: "Consulta: {$this->consulta->nombre} · ".(self::MOTIVOS[$this->consulta->motivo] ?? $this->consulta->motivo));

        // Responder desde el cliente de correo le contesta directo a la persona
        return $this->consulta->email ? $envelope->replyTo($this->consulta->email, $this->consulta->nombre) : $envelope;
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.taller.nueva-consulta', with: [
            'consulta' => $this->consulta,
            'motivo' => self::MOTIVOS[$this->consulta->motivo] ?? $this->consulta->motivo,
            'urlPanel' => rtrim(config('petru.panel_url'), '/').'/consultas',
        ]);
    }
}
