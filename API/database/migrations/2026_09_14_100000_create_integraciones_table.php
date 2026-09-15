<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Credenciales y estado de integraciones externas (MercadoPago hoy).
 * `config` va cifrado con APP_KEY: un dump de la base no expone los tokens.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integraciones', function (Blueprint $table) {
            $table->string('nombre', 40)->primary();
            $table->text('config');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integraciones');
    }
};
