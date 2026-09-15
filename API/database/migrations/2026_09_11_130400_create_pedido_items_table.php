<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedido_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('productos')->nullOnDelete();

            // Foto del producto al momento de la compra. Nunca hacer join para mostrar un pedido.
            $table->string('nombre', 160);
            $table->string('sku', 40);
            $table->decimal('precio_unitario', 12, 2);
            $table->unsignedSmallInteger('cantidad');
            $table->decimal('subtotal', 12, 2);
            $table->string('imagen_url')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_items');
    }
};
