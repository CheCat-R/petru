<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 160);
            $table->string('slug', 180)->unique();
            $table->string('sku', 40)->unique();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();

            // Importes en ARS. `precio` es el precio final al público (no se factura).
            $table->decimal('precio', 12, 2);
            $table->decimal('precio_comparacion', 12, 2)->nullable();
            $table->decimal('costo', 12, 2)->nullable(); // nunca sale por la API pública

            $table->unsignedInteger('stock')->default(0);
            $table->enum('estado', ['Activo', 'Agotado', 'Borrador'])->default('Borrador');

            $table->string('resumen', 280)->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('destacado')->default(false);

            // Del PAQUETE EMBALADO, no de la pieza: es lo que cotiza Andreani.
            $table->decimal('peso_kg', 6, 3);
            $table->unsignedSmallInteger('alto_cm');
            $table->unsignedSmallInteger('ancho_cm');
            $table->unsignedSmallInteger('largo_cm');
            $table->unsignedSmallInteger('alto_pieza_cm')->nullable(); // dato de venta

            $table->unsignedInteger('unidades_vendidas')->default(0);
            $table->unsignedInteger('orden')->default(0);
            $table->timestamps();

            $table->index(['estado', 'categoria_id']);
            $table->index('destacado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
