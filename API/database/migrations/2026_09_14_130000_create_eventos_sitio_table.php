<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Analítica propia del sitio: una fila por evento (página vista, pieza vista,
 * agregado al carrito, checkout iniciado, pedido). Sin cookies ni datos
 * personales: el visitante es un hash que cambia cada día.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos_sitio', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 20);
            $table->string('ruta', 200);
            $table->foreignId('producto_id')->nullable()->constrained('productos')->nullOnDelete();
            $table->string('pedido_numero', 12)->nullable();
            $table->char('visitante', 32);        // hash diario de ip + user-agent + sal
            $table->string('sesion', 40);         // id aleatorio por pestaña/visita
            $table->string('fuente', 20);         // instagram, google, directo, whatsapp…
            $table->string('referente', 120)->nullable(); // host de donde vino
            $table->string('utm_source', 80)->nullable();
            $table->string('utm_medium', 80)->nullable();
            $table->string('utm_campaign', 120)->nullable();
            $table->string('dispositivo', 10);    // movil, tablet, escritorio
            $table->timestamp('creado_en')->index();

            $table->index(['tipo', 'creado_en']);
            $table->index(['visitante', 'creado_en']);
            $table->index('sesion');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_sitio');
    }
};
