<x-mail::message>
# Recibimos tu pedido, {{ $nombre }}

Tus piezas quedaron reservadas mientras se procesa el pago. Apenas MercadoPago nos confirme, te avisamos por acá.

@include('mail.pedidos._resumen')

@include('mail.pedidos._entrega')

<x-mail::button :url="$urlSeguimiento">
Ver el estado de mi pedido
</x-mail::button>

Guardá este mail: el link de arriba es la forma de seguir tu pedido #{{ $pedido->numero }}.

Un abrazo del taller,<br>
Pëtru
</x-mail::message>
