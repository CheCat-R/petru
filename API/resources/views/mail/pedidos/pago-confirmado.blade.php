<x-mail::message>
# ¡Pago confirmado, {{ $nombre }}!

Ya estamos con tu pedido #{{ $pedido->numero }}. Cada pieza sale del taller embalada a mano con nuestro sistema blindado: si llega dañada, te enviamos otra o te devolvemos el dinero.

@include('mail.pedidos._resumen')

@include('mail.pedidos._entrega')

@if (! $retiraEnTaller)
Te avisamos por mail cuando el paquete salga del taller, con el código de seguimiento.
@endif

<x-mail::button :url="$urlSeguimiento">
Seguir mi pedido
</x-mail::button>

Gracias por elegir una pieza única,<br>
Pëtru
</x-mail::message>
