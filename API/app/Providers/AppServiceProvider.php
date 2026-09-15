<?php

namespace App\Providers;

use App\Integraciones\EnviosConfig;
use App\Integraciones\MercadoPagoConfig;
use App\Listeners\EnviarEmailsDePedido;
use App\Services\Envios\AndreaniClient;
use App\Services\Pagos\MercadoPagoPasarela;
use App\Services\Pagos\PasarelaPago;
use App\Services\Pagos\PasarelaSimulada;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(EnviosConfig::class);
        $this->app->singleton(AndreaniClient::class, fn ($app) => new AndreaniClient($app->make(EnviosConfig::class)->andreani()));

        $this->app->singleton(MercadoPagoConfig::class);

        /*
         * La pasarela se elige por las credenciales cargadas en el panel
         * (Integraciones → MercadoPago; el .env sirve de respaldo): con access
         * token en el modo activo, MercadoPago; sin él, la simulada. En
         * producción sin token, el log lo grita.
         */
        $this->app->singleton(PasarelaPago::class, function ($app) {
            $credenciales = $app->make(MercadoPagoConfig::class)->credencialesActivas();

            if ($credenciales) {
                return new MercadoPagoPasarela($credenciales, $app->make(MercadoPagoConfig::class));
            }

            if ($app->isProduction()) {
                Log::critical('MercadoPago sin credenciales en producción: el checkout usa la pasarela simulada.');
            }

            return new PasarelaSimulada();
        });
    }

    public function boot(): void
    {
        $this->configurarRateLimiting();

        // Los listeners con handle() se descubren solos; los suscriptores se registran acá.
        Event::subscribe(EnviarEmailsDePedido::class);

        $this->configurarMailDeRestablecimiento();
    }

    /**
     * El link de "olvidé mi contraseña" abre el panel, no la API, y el mail va
     * en castellano con el tema de la casa.
     */
    private function configurarMailDeRestablecimiento(): void
    {
        $url = fn ($usuario, string $token) => rtrim(config('petru.panel_url'), '/')
            .'/restablecer?'.http_build_query(['token' => $token, 'email' => $usuario->getEmailForPasswordReset()]);

        ResetPassword::createUrlUsing($url);

        ResetPassword::toMailUsing(fn ($usuario, string $token) => (new MailMessage)
            ->subject('Elegí una contraseña nueva para el panel')
            ->greeting("Hola, {$usuario->name}.")
            ->line('Alguien pidió cambiar la contraseña del panel de Pëtru para esta cuenta. Si fuiste vos, entrá acá y elegí una nueva:')
            ->action('Elegir contraseña nueva', $url($usuario, $token))
            ->line('El link vence en '.config('auth.passwords.'.config('auth.defaults.passwords').'.expire').' minutos.')
            ->line('Si no fuiste vos, ignorá este mail: la contraseña sigue igual.')
            ->salutation('El taller'));
    }

    /**
     * Límites para los endpoints públicos que escriben. Sin esto, el formulario
     * de contacto y el checkout son un imán para spam.
     */
    private function configurarRateLimiting(): void
    {
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('olvide', fn (Request $request) => Limit::perMinute(3)->by($request->ip()));
        // Analítica: una persona navegando genera un puñado por minuto; 120 frena a un script.
        RateLimiter::for('eventos', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));

        RateLimiter::for('consultas', fn (Request $request) => Limit::perHour(5)->by($request->ip()));

        RateLimiter::for('pedidos', fn (Request $request) => Limit::perHour(10)->by($request->ip()));

        RateLimiter::for('cotizaciones', fn (Request $request) => Limit::perMinute(20)->by($request->ip()));

        RateLimiter::for('seguimiento', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
    }
}
