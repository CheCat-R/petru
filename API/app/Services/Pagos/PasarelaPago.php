<?php

namespace App\Services\Pagos;

use App\Models\Pedido;

/**
 * Lo que el checkout necesita de una pasarela, sin saber cuál es.
 *
 * Dos implementaciones: MercadoPago (Checkout Pro) y una simulada para
 * desarrollo, que se activa sola cuando no hay access token en .env.
 */
interface PasarelaPago
{
    /**
     * Crea la preferencia de pago y devuelve adónde mandar al cliente.
     *
     * @return array{preferenciaId: string, urlPago: string}
     */
    public function crearPreferencia(Pedido $pedido): array;

    /**
     * Consulta el estado real del pago de un pedido y lo aplica al modelo
     * (confirmarPago / rechazarPago). Devuelve true si cambió algo.
     */
    public function sincronizar(Pedido $pedido): bool;

    /** Nombre corto para logs y para el campo `metodo_pago`. */
    public function nombre(): string;
}
