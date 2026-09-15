<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('email', 160)->nullable();
            $table->string('telefono', 40)->nullable();
            $table->enum('motivo', ['custom', 'pedido', 'otro']);
            $table->text('mensaje');
            $table->enum('estado', ['nueva', 'leida', 'respondida'])->default('nueva');
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultas');
    }
};
