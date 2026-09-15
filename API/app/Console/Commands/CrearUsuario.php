<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/** Crea un usuario del panel. Es la única forma de dar de alta acceso: no hay registro público. */
class CrearUsuario extends Command
{
    protected $signature = 'petru:usuario {email} {--nombre=} {--password=}';

    protected $description = 'Crea un usuario con acceso al panel de administración';

    public function handle(): int
    {
        $email = $this->argument('email');
        $nombre = $this->option('nombre') ?? $this->ask('Nombre');
        $password = $this->option('password') ?? $this->secret('Contraseña (mínimo 12 caracteres)');

        $validador = Validator::make(compact('email', 'nombre', 'password'), [
            'email' => ['required', 'email', 'unique:users,email'],
            'nombre' => ['required', 'string', 'max:120'],
            'password' => ['required', 'string', 'min:12'],
        ]);

        if ($validador->fails()) {
            foreach ($validador->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $usuario = User::create(['name' => $nombre, 'email' => $email, 'password' => $password]);

        $this->info("Usuario #{$usuario->id} creado: {$usuario->email}");

        return self::SUCCESS;
    }
}
