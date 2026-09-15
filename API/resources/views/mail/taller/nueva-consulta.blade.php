<x-mail::message>
# Consulta desde el sitio

**{{ $consulta->nombre }}** · {{ $motivo }}<br>
{{ $consulta->email ?? '' }}{{ $consulta->email && $consulta->telefono ? ' · ' : '' }}{{ $consulta->telefono ?? '' }}

<x-mail::panel>
{{ $consulta->mensaje }}
</x-mail::panel>

Respondé este mail y le llega directo a la persona.

<x-mail::button :url="$urlPanel">
Ver en el panel
</x-mail::button>
</x-mail::message>
