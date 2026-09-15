<x-mail::message>
# Nuevo pedido pagado #{{ $pedido->numero }}

**{{ $pedido->nombre_cliente }}** · {{ $pedido->email_cliente }}{{ $pedido->telefono_cliente ? ' · '.$pedido->telefono_cliente : '' }}

@include('mail.pedidos._resumen')

@include('mail.pedidos._entrega')

@if ($pedido->notas)
**Nota del cliente:** {{ $pedido->notas }}
@endif

Pago: {{ $pedido->metodo_pago }} · Ref. {{ $pedido->referencia_pago }}

<x-mail::button :url="rtrim(config('petru.panel_url'), '/').'/pedidos/'.$pedido->numero">
Abrir en el panel
</x-mail::button>
</x-mail::message>
