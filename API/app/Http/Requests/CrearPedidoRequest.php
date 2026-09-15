<?php

namespace App\Http\Requests;

use App\Services\Envios\CotizadorEnvio;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CrearPedidoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Cliente
            'nombre' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:160'],
            'telefono' => ['required', 'string', 'min:8', 'max:40'],
            'dni' => ['nullable', 'string', 'max:20'],

            // Dirección (aunque retire en el taller, sirve como contacto)
            'calle' => ['required', 'string', 'max:120'],
            'numero' => ['required', 'string', 'max:20'],
            'piso' => ['nullable', 'string', 'max:10'],
            'departamento' => ['nullable', 'string', 'max:10'],
            'localidad' => ['required', 'string', 'max:80'],
            'provincia' => ['required', 'string', 'max:60'],
            'codigo_postal' => ['required', 'string', 'max:10', 'regex:/\d{4}/'],
            'referencia' => ['nullable', 'string', 'max:200'],

            'metodo_envio' => ['required', Rule::in([CotizadorEnvio::METODO_RETIRO, CotizadorEnvio::METODO_DOMICILIO])],
            'notas' => ['nullable', 'string', 'max:1000'],

            // Solo ids y cantidades: el precio lo pone el servidor
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.producto_id' => ['required', 'integer', 'exists:productos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:10'],

            'sitio_web' => ['prohibited'], // honeypot
        ];
    }

    public function attributes(): array
    {
        return [
            'codigo_postal' => 'código postal',
            'metodo_envio' => 'método de envío',
            'items.*.producto_id' => 'producto',
            'items.*.cantidad' => 'cantidad',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_postal.regex' => 'Ingresá un código postal de 4 dígitos (o el CPA completo).',
            'items.required' => 'El carrito está vacío.',
        ];
    }
}
