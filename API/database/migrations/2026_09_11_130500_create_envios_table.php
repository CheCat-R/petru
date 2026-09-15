<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('envios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->string('transportista', 40);
            $table->string('tracking', 60)->nullable();
            $table->enum('estado', [
                'pendiente_preparacion', 'preparando', 'listo', 'despachado',
                'en_transito', 'entregado', 'devuelto', 'cancelado',
            ])->default('pendiente_preparacion');
            $table->decimal('peso_kg', 6, 3)->nullable();
            $table->decimal('costo', 12, 2)->nullable();
            $table->string('etiqueta_url')->nullable();
            $table->json('eventos_tracking')->nullable();
            $table->timestamp('despachado_en')->nullable();
            $table->timestamp('entregado_en')->nullable();
            $table->timestamps();

            $table->index('tracking');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('envios');
    }
};
