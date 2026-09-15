<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContenidoSitioRequest;
use App\Sitio\ContenidoSitio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Edición del contenido del sitio desde el panel: una sección por vez.
 * Las imágenes se suben aparte y la sección guarda la URL que devuelven.
 */
class SitioController extends Controller
{
    public function __construct(private readonly ContenidoSitio $contenido) {}

    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->contenido->obtener(),
            'defaults' => ContenidoSitio::porDefecto(),
            'customized' => $this->contenido->seccionesPersonalizadas(),
            'icons' => ContenidoSitio::ICONOS,
        ]);
    }

    public function update(ContenidoSitioRequest $request, string $seccion): JsonResponse
    {
        $this->contenido->guardar($seccion, $request->validated());

        return $this->show();
    }

    public function restaurar(string $seccion): JsonResponse
    {
        abort_unless(in_array($seccion, ContenidoSitio::SECCIONES, true), 404, 'Esa sección no existe.');
        $this->contenido->restaurar($seccion);

        return $this->show();
    }

    public function subirImagen(Request $request): JsonResponse
    {
        // SVG e ICO son para logo y favicon; las fotos siguen pasando por el recortador del panel.
        $request->validate([
            'imagen' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,svg,ico', 'max:4096'],
        ]);

        $ruta = $request->file('imagen')->store('sitio', 'public');

        return response()->json(['url' => Storage::disk('public')->url($ruta)], 201);
    }
}
