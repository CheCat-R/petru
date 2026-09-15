<?php

namespace App\Exceptions;

use RuntimeException;

/** Un ítem del carrito ya no se puede comprar tal como se pidió (sin stock, borrador, etc.). */
class CarritoInvalido extends RuntimeException
{
    public function __construct(string $mensaje, public readonly array $detalles = [])
    {
        parent::__construct($mensaje);
    }
}
