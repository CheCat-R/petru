<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Textos e imágenes del sitio que el taller edita desde el panel.
 *
 * Una fila por sección (home, contact, about…), con el contenido en JSON.
 * Lo que no está guardado sale de los valores por defecto en código
 * (App\Sitio\ContenidoSitio), así el sitio siempre recibe el documento completo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contenido_sitio', function (Blueprint $table) {
            $table->string('seccion', 40)->primary();
            $table->json('contenido');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contenido_sitio');
    }
};
