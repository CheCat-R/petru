@php
    $precio = fn ($v) => '$ '.number_format((float) $v, 0, ',', '.');
@endphp
<x-mail::table>
| Pieza | Cant. | Importe |
|:------|:-----:|--------:|
@foreach ($pedido->items as $item)
| {{ $item->nombre }} | {{ $item->cantidad }} | {{ $precio($item->subtotal) }} |
@endforeach
| Envío | | {{ (float) $pedido->costo_envio > 0 ? $precio($pedido->costo_envio) : 'Sin cargo' }} |
| **Total** | | **{{ $precio($pedido->total) }}** |
</x-mail::table>
