<?php

use Illuminate\Support\Facades\Schedule;

// En hosting compartido no hay worker: el cron del hPanel corre `schedule:run` cada minuto.
Schedule::command('petru:liberar-reservas')->everyMinute()->withoutOverlapping();

// Los mails salen por cola. Sin worker persistente, se drena la cola cada minuto.
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3')->everyMinute()->withoutOverlapping();
