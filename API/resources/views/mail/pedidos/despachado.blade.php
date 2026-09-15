<x-mail::message>
# Tu pedido está en camino, {{ $nombre }}

El pedido #{{ $pedido->numero }} salió del taller por **{{ $pedido->transportista }}**.

@if ($pedido->tracking)
<x-mail::panel>
Código de seguimiento: **{{ $pedido->tracking }}**
</x-mail::panel>
@endif

@include('mail.pedidos._entrega')

Si no hay nadie para recibirlo, el correo deja aviso y lo vuelve a intentar. Ante cualquier cosa, escribinos.

<x-mail::button :url="$urlSeguimiento">
Ver mi pedido
</x-mail::button>

Que la pieza encuentre su lugar,<br>
Pëtru
</x-mail::message>
