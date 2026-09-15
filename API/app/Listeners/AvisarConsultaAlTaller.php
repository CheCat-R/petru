<?php

namespace App\Listeners;

use App\Events\ConsultaRecibida;
use App\Mail\NuevaConsultaTaller;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class AvisarConsultaAlTaller implements ShouldQueue
{
    public int $tries = 3;

    public function handle(ConsultaRecibida $evento): void
    {
        if ($taller = config('petru.email_taller')) {
            Mail::to($taller)->send(new NuevaConsultaTaller($evento->consulta));
        }
    }
}
