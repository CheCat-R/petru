<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConsultaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email:rfc', 'max:160', 'required_without:telefono'],
            'telefono' => ['nullable', 'string', 'max:40', 'required_without:email'],
            'motivo' => ['required', 'in:custom,pedido,otro,arrepentimiento'],
            'mensaje' => ['required', 'string', 'min:10', 'max:3000'],
            // Honeypot: un humano nunca completa este campo
            'sitio_web' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required_without' => 'Dejanos un email o un teléfono para poder responderte.',
            'telefono.required_without' => 'Dejanos un email o un teléfono para poder responderte.',
            'mensaje.min' => 'Contanos un poco más: al menos 10 caracteres.',
        ];
    }
}
