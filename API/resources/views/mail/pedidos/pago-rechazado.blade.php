<x-mail::message>
# No pudimos procesar el pago, {{ $nombre }}

MercadoPago no aprobó el pago del pedido #{{ $pedido->numero }}.
@if ($pedido->motivo_rechazo)
Motivo informado: _{{ $pedido->motivo_rechazo }}_.
@endif

Tus piezas siguen reservadas un rato más. Podés intentar de nuevo con otro medio de pago desde el link de tu pedido, o escribirnos y lo resolvemos juntos.

<x-mail::button :url="$urlSeguimiento">
Reintentar el pago
</x-mail::button>

Si el problema persiste, contestá este mail o escribinos por WhatsApp.

Pëtru
</x-mail::message>
