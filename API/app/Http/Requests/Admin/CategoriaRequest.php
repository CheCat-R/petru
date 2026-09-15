<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('categoria')?->id;

        return [
            'nombre' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categorias', 'slug')->ignore($id)],
            'descripcion' => ['nullable', 'string', 'max:280'],
            'imagen_url' => ['nullable', 'url', 'max:255'],
            'orden' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
