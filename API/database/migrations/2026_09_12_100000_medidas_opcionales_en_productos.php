<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Las medidas del paquete pasan a ser opcionales: el taller no siempre las
 * tiene al cargar la pieza. Sin medidas, la cotización usa el bulto por defecto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->decimal('peso_kg', 6, 3)->nullable()->change();
            $table->unsignedSmallInteger('alto_cm')->nullable()->change();
            $table->unsignedSmallInteger('ancho_cm')->nullable()->change();
            $table->unsignedSmallInteger('largo_cm')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->decimal('peso_kg', 6, 3)->nullable(false)->default(0)->change();
            $table->unsignedSmallInteger('alto_cm')->nullable(false)->default(0)->change();
            $table->unsignedSmallInteger('ancho_cm')->nullable(false)->default(0)->change();
            $table->unsignedSmallInteger('largo_cm')->nullable(false)->default(0)->change();
        });
    }
};
