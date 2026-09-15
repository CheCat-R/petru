<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Usuario del panel para desarrollo. En producción se crea con `php artisan petru:usuario`.
        User::firstOrCreate(
            ['email' => 'admin@petru.com.ar'],
            ['name' => 'Taller Pëtru', 'password' => 'petru-dev-2026'],
        );

        $this->call([
            CategoriaSeeder::class,
            ProductoSeeder::class,
        ]);
    }
}
