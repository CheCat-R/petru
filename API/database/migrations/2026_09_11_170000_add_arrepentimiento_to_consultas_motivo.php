<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Botón de arrepentimiento (Res. 424/2020): entra como consulta con motivo propio. */
    public function up(): void
    {
        DB::statement("ALTER TABLE consultas MODIFY motivo ENUM('custom', 'pedido', 'otro', 'arrepentimiento') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE consultas MODIFY motivo ENUM('custom', 'pedido', 'otro') NOT NULL");
    }
};
