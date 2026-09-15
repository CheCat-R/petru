@if ($retiraEnTaller)
**Retiro en el taller** — te escribimos por WhatsApp para coordinar día y horario.
@else
**Envío a domicilio**<br>
{{ $pedido->calle }} {{ $pedido->numero_calle }}{{ $pedido->piso ? ', piso '.$pedido->piso : '' }}{{ $pedido->departamento ? ' depto '.$pedido->departamento : '' }}<br>
{{ $pedido->codigo_postal }} {{ $pedido->localidad }}, {{ $pedido->provincia }}
@if ($pedido->referencia_direccion)
<br>_{{ $pedido->referencia_direccion }}_
@endif
@endif
