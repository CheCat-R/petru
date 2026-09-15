<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('numero', 12)->unique();   // el `id` que ve el panel: "10254"
            $table->uuid('token')->unique();           // seguimiento público sin login

            // Cliente (checkout como invitado: no hay usuario asociado)
            $table->string('nombre_cliente', 120);
            $table->string('email_cliente', 160);
            $table->string('telefono_cliente', 40)->nullable();
            $table->string('dni_cliente', 20)->nullable();

            // Dirección de envío, desagregada: Andreani cotiza por CP + localidad + provincia
            $table->string('calle', 120);
            $table->string('numero_calle', 20);
            $table->string('piso', 10)->nullable();
            $table->string('departamento', 10)->nullable();
            $table->string('localidad', 80);
            $table->string('provincia', 60);
            $table->string('codigo_postal', 10);
            $table->string('referencia_direccion', 200)->nullable();

            // Importes (ARS). total = subtotal + costo_envio - descuento
            $table->decimal('subtotal', 12, 2);
            $table->decimal('costo_envio', 12, 2)->default(0);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('cupon_codigo', 40)->nullable();

            // Dos ejes de estado independientes. Los valores son los que el panel ya consume.
            $table->enum('estado_pago', [
                'Pendiente', 'Pagado', 'Rechazado', 'Cancelado', 'Reembolso pendiente', 'Reembolsado',
            ])->default('Pendiente');
            $table->enum('estado_envio', [
                'Sin despachar', 'Despachado', 'Entregado', 'Devuelto', 'Cancelado',
            ])->default('Sin despachar');

            // Pago
            $table->string('metodo_pago', 80)->nullable();
            $table->string('referencia_pago', 60)->nullable();
            $table->string('mp_preference_id', 80)->nullable();
            $table->string('mp_payment_id', 60)->nullable();

            // Envío (resumen; el detalle vive en `envios`)
            $table->string('transportista', 40)->nullable();
            $table->string('tracking', 60)->nullable();
            $table->json('cotizacion_envio')->nullable(); // respuesta cruda de Andreani, congelada

            // Reserva de stock mientras el cliente paga afuera
            $table->timestamp('reservado_hasta')->nullable();

            // Ciclo de vida
            $table->timestamp('pagado_en')->nullable();
            $table->timestamp('rechazado_en')->nullable();
            $table->timestamp('despachado_en')->nullable();
            $table->timestamp('entregado_en')->nullable();
            $table->timestamp('devuelto_en')->nullable();
            $table->timestamp('reembolsado_en')->nullable();
            $table->string('motivo_rechazo', 200)->nullable();

            $table->text('notas')->nullable(); // internas del taller
            $table->timestamps();

            $table->index('email_cliente');
            $table->index(['estado_pago', 'estado_envio']);
            $table->index('reservado_hasta');
            $table->index('mp_payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
