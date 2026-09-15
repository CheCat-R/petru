<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto_imagenes', function (Blueprint $table) {
            // Ruta dentro del disco `public`, para poder borrar el archivo. Null si la
            // imagen es externa (el seed apunta a /img/... del sitio).
            $table->string('ruta_archivo')->nullable()->after('url');
        });
    }

    public function down(): void
    {
        Schema::table('producto_imagenes', function (Blueprint $table) {
            $table->dropColumn('ruta_archivo');
        });
    }
};
