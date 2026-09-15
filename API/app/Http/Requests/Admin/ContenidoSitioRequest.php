<?php

namespace App\Http\Requests\Admin;

use App\Sitio\ContenidoSitio;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Valida una sección del contenido del sitio.
 *
 * Las reglas son la estructura del sitio: cuatro diferenciales (la grilla es de
 * cuatro), botones con texto y destino, enlaces internos o https. Lo que no
 * está en las reglas no se guarda, así el JSON nunca trae campos inventados.
 */
class ContenidoSitioRequest extends FormRequest
{
    private const TEXTO_CORTO = ['required', 'string', 'max:120'];
    private const TEXTO_MEDIO = ['required', 'string', 'max:300'];
    private const TEXTO_LARGO = ['required', 'string', 'max:1200'];
    private const OPCIONAL_CORTO = ['nullable', 'string', 'max:120'];
    private const ENLACE = ['required', 'string', 'max:300', 'regex:#^(/|https://|mailto:|tel:)#'];
    private const IMAGEN = ['nullable', 'string', 'max:500', 'regex:#^(/|https?://)#'];
    private const URL_OPCIONAL = ['nullable', 'url:https', 'max:300'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return match ($this->route('seccion')) {
            'general' => [
                'logo' => ['required', 'string', 'max:500', 'regex:#^(/|https?://)#'],
                'favicon' => ['required', 'string', 'max:500', 'regex:#^(/|https?://)#'],
                'tagline' => self::TEXTO_CORTO,
                'description' => ['required', 'string', 'max:200'],
                'tracking.ga4' => ['nullable', 'string', 'regex:/^G-[A-Z0-9]{6,14}$/'],
                'tracking.metaPixel' => ['nullable', 'string', 'regex:/^\d{6,20}$/'],
                'tracking.searchConsole' => ['nullable', 'string', 'max:120', 'regex:/^[A-Za-z0-9_\-]+$/'],
            ],

            'announcement' => [
                'enabled' => ['required', 'boolean'],
                'text' => ['required', 'string', 'max:160'],
                'link' => ['nullable', 'string', 'max:300', 'regex:#^(/|https://)#'],
                'linkLabel' => ['nullable', 'string', 'max:40'],
            ],

            'contact' => [
                'whatsapp.number' => ['required', 'string', 'max:30', 'regex:/^\+?[\d\s\-()]{8,}$/'],
                'whatsapp.hours' => self::TEXTO_CORTO,
                'email.address' => ['required', 'email', 'max:160'],
                'email.note' => self::OPCIONAL_CORTO,
                'location.city' => self::TEXTO_CORTO,
                'location.country' => self::TEXTO_CORTO,
                'location.note' => self::OPCIONAL_CORTO,
                'social.instagram' => self::URL_OPCIONAL,
                'social.facebook' => self::URL_OPCIONAL,
                'social.tiktok' => self::URL_OPCIONAL,
                'page.label' => self::TEXTO_CORTO,
                'page.title' => ['required', 'string', 'max:160'],
                'page.intro' => self::TEXTO_MEDIO,
            ],

            'home' => [
                'hero.label' => self::TEXTO_CORTO,
                'hero.title' => ['required', 'string', 'max:160'],
                'hero.intro' => self::TEXTO_MEDIO,
                'hero.primaryButton.text' => ['required', 'string', 'max:40'],
                'hero.primaryButton.href' => self::ENLACE,
                'hero.secondaryButton.text' => ['required', 'string', 'max:40'],
                'hero.secondaryButton.href' => self::ENLACE,
                'hero.image.url' => ['required', 'string', 'max:500', 'regex:#^(/|https?://)#'],
                'hero.image.alt' => ['required', 'string', 'max:200'],

                'highlights' => ['required', 'array', 'size:4'],
                'highlights.*.icon' => ['required', Rule::in(ContenidoSitio::ICONOS)],
                'highlights.*.title' => ['required', 'string', 'max:40'],
                'highlights.*.detail' => ['required', 'string', 'max:80'],

                'featured.label' => self::TEXTO_CORTO,
                'featured.title' => self::TEXTO_CORTO,
                'featured.intro' => self::OPCIONAL_CORTO,

                'customLab.enabled' => ['required', 'boolean'],
                'customLab.label' => self::TEXTO_CORTO,
                'customLab.title' => ['required', 'string', 'max:160'],
                'customLab.text' => self::TEXTO_MEDIO,
                'customLab.buttonText' => ['required', 'string', 'max:40'],
                'customLab.note' => self::OPCIONAL_CORTO,
            ],

            'about' => [
                'header.label' => self::TEXTO_CORTO,
                'header.title' => ['required', 'string', 'max:160'],
                'header.intro' => self::TEXTO_LARGO,
                'manifesto.label' => self::TEXTO_CORTO,
                'manifesto.quote' => ['required', 'string', 'max:400'],
                'manifesto.paragraphs' => ['required', 'array', 'min:1', 'max:4'],
                'manifesto.paragraphs.*' => ['required', 'string', 'max:800'],
                'team.label' => self::TEXTO_CORTO,
                'team.title' => self::TEXTO_CORTO,
                'team.intro' => self::TEXTO_MEDIO,
                'team.people' => ['required', 'array', 'min:1', 'max:4'],
                'team.people.*.name' => ['required', 'string', 'max:80'],
                'team.people.*.role' => ['required', 'string', 'max:80'],
                'team.people.*.bio' => ['required', 'string', 'max:400'],
                'team.people.*.photo' => self::IMAGEN,
            ],

            'legal' => [
                'businessName' => ['nullable', 'string', 'max:160'],
                'taxId' => ['nullable', 'string', 'max:20', 'regex:/^[\d\-]*$/'],
                'address' => ['required', 'string', 'max:200'],
            ],

            default => abort(404, 'Esa sección no existe.'),
        };
    }

    public function messages(): array
    {
        return [
            'highlights.size' => 'Los diferenciales son exactamente cuatro: la grilla del home es de cuatro columnas.',
            '*.href.regex' => 'El destino tiene que ser una ruta del sitio (/galeria) o una dirección https://.',
            'whatsapp.number.regex' => 'Escribí el número con código de país, por ejemplo +54 9 341 555-1234.',
            'taxId.regex' => 'Solo números y guiones, por ejemplo 20-12345678-9.',
            'tracking.ga4.regex' => 'El ID de Google Analytics tiene la forma G-XXXXXXXXXX (está en Administrar → Flujos de datos).',
            'tracking.metaPixel.regex' => 'El ID del píxel de Meta es un número (está en Administrador de eventos).',
            'tracking.searchConsole.regex' => 'Pegá solo el valor de content="…" del meta google-site-verification, no la etiqueta entera.',
        ];
    }

    public function attributes(): array
    {
        return [
            'whatsapp.number' => 'número de WhatsApp',
            'whatsapp.hours' => 'horario',
            'email.address' => 'email',
            'hero.title' => 'título',
            'hero.image.url' => 'imagen',
            'logo' => 'logo',
            'favicon' => 'favicon',
            'hero.image.alt' => 'texto alternativo de la imagen',
            'businessName' => 'razón social',
            'taxId' => 'CUIT',
            'address' => 'domicilio',
        ];
    }
}
