<?php

namespace App\Exceptions;

use RuntimeException;

/** Se lanza cuando se intenta mover un pedido a un estado que su estado actual no permite. */
class TransicionInvalida extends RuntimeException
{
}
