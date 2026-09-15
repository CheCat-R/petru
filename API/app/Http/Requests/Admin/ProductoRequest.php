<?php

namespace App\Http\Requests\Admin;

use App\Models\Producto;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('producto')?->id;

        return [
            'nombre' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('productos', 'slug')->ignore($id)],
            'sku' => ['required', 'string', 'max:40', Rule::unique('productos', 'sku')->ignore($id)],
            'categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],

            'precio' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'precio_comparacion' => ['nullable', 'numeric', 'gt:precio', 'max:99999999'],
            'costo' => ['nullable', 'numeric', 'min:0', 'max:99999999'],

            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'estado' => ['required', Rule::in([Producto::ESTADO_ACTIVO, Producto::ESTADO_AGOTADO, Producto::ESTADO_BORRADOR])],

            'resumen' => ['nullable', 'string', 'max:280'],
            'descripcion' => ['nullable', 'string', 'max:10000'],
            'destacado' => ['boolean'],

            // Del paquete embalado. Opcionales: si faltan, Andreani cotiza con
            // el bulto de config('petru.andreani.bulto_por_defecto').
            'peso_kg' => ['nullable', 'numeric', 'min:0.01', 'max:999'],
            'alto_cm' => ['nullable', 'integer', 'min:1', 'max:300'],
            'ancho_cm' => ['nullable', 'integer', 'min:1', 'max:300'],
            'largo_cm' => ['nullable', 'integer', 'min:1', 'max:300'],
            'alto_pieza_cm' => ['nullable', 'integer', 'min:1', 'max:300'],

            'orden' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'categoria_id' => 'categoría',
            'precio_comparacion' => 'precio de comparación',
            'peso_kg' => 'peso del paquete',
            'alto_cm' => 'alto del paquete',
            'ancho_cm' => 'ancho del paquete',
            'largo_cm' => 'largo del paquete',
            'alto_pieza_cm' => 'alto de la pieza',
        ];
    }

    public function messages(): array
    {
        return [
            'precio_comparacion.gt' => 'El precio tachado tiene que ser mayor al precio de venta.',
            'slug.regex' => 'El slug solo admite minúsculas, números y guiones.',
        ];
    }
}
