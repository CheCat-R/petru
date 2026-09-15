<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Database\Seeder;

/**
 * Catálogo de desarrollo: las mismas seis piezas que el sitio usaba como mock,
 * para poder reemplazar `Sitio_web/app/data/productos.js` sin cambiar nada visual.
 *
 * Los pesos y medidas son del PAQUETE EMBALADO y son estimados: el taller tiene
 * que cargar los reales desde el panel antes de activar la cotización de Andreani.
 */
class ProductoSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = Categoria::pluck('id', 'slug');

        $productos = [
            [
                'nombre' => 'Buda bajo el Árbol', 'slug' => 'buda-bajo-el-arbol', 'sku' => 'MIT-BUD-ARB-01',
                'categoria' => 'mitologia', 'precio' => 48000, 'stock' => 3, 'destacado' => true,
                'resumen' => 'Figura serena con follaje pintado en verdes profundos y detalles en pan de oro.',
                'descripcion' => "Un Buda en meditación bajo un árbol de copa turquesa, moldeado en yeso alabastrino de alta densidad. El follaje se pinta hoja por hoja y el halo lleva pan de oro de 24k aplicado a mano.\n\nCada unidad varía en la intensidad de los verdes y en la distribución del dorado: eso es lo que la hace única.",
                'alto_pieza_cm' => 28, 'peso_kg' => 2.400, 'alto_cm' => 38, 'ancho_cm' => 30, 'largo_cm' => 30,
                'imagen' => ['url' => '/img/buda-home.webp', 'alt' => 'Estatuilla de yeso de un Buda pintada a mano bajo un árbol'],
            ],
            [
                'nombre' => 'Venus Neón', 'slug' => 'venus-neon', 'sku' => 'POP-VEN-NEO-01',
                'categoria' => 'pop-art', 'precio' => 39500, 'stock' => 2, 'destacado' => false,
                'resumen' => 'La Venus clásica intervenida con bloques de color saturado y goteo urbano.',
                'descripcion' => 'El busto de la Venus de Milo reinterpretado con bloques de color fluorescente y goteos que bajan desde los hombros. Acabado satinado.',
                'alto_pieza_cm' => 24, 'peso_kg' => 1.900, 'alto_cm' => 34, 'ancho_cm' => 26, 'largo_cm' => 26,
            ],
            [
                'nombre' => 'David Cromático', 'slug' => 'david-cromatico', 'sku' => 'POP-DAV-CRO-01',
                'categoria' => 'pop-art', 'precio' => 52000, 'stock' => 0, 'destacado' => false,
                'resumen' => 'Degradé completo sobre el torso, acabado mate con contraste satinado.',
                'descripcion' => 'Busto del David con un degradé que recorre todo el torso, de ámbar a violeta. Mate en la piel, satinado en el cabello.',
                'alto_pieza_cm' => 32, 'peso_kg' => 3.100, 'alto_cm' => 42, 'ancho_cm' => 30, 'largo_cm' => 30,
            ],
            [
                'nombre' => 'Mini Ganesha', 'slug' => 'mini-ganesha', 'sku' => 'MIN-GAN-01',
                'categoria' => 'miniaturas', 'precio' => 18900, 'stock' => 6, 'destacado' => false,
                'resumen' => 'Pieza de escritorio con detalles finos pintados a pincel del cero.',
                'descripcion' => 'Ganesha en escala de escritorio, con los ornamentos pintados a pincel fino y base en tono tierra.',
                'alto_pieza_cm' => 11, 'peso_kg' => 0.550, 'alto_cm' => 18, 'ancho_cm' => 14, 'largo_cm' => 14,
            ],
            [
                'nombre' => 'Atenea Mármol', 'slug' => 'atenea-marmol', 'sku' => 'MIT-ATE-MAR-01',
                'categoria' => 'mitologia', 'precio' => 61000, 'stock' => 1, 'destacado' => true,
                'resumen' => 'Veteado a mano que imita mármol de Carrara sobre yeso alabastrino.',
                'descripcion' => 'Busto de Atenea con veteado pintado a mano que imita el mármol de Carrara. Cada veta se traza con pincel seco sobre la base blanca, una por una.',
                'alto_pieza_cm' => 36, 'peso_kg' => 3.600, 'alto_cm' => 46, 'ancho_cm' => 32, 'largo_cm' => 32,
            ],
            [
                'nombre' => 'Set Mini Budas x3', 'slug' => 'mini-buda-set', 'sku' => 'MIN-BUD-SET-03',
                'categoria' => 'miniaturas', 'precio' => 44000, 'stock' => 4, 'destacado' => false,
                'resumen' => 'Trío en paleta tierra, pensado para repisas y estanterías bajas.',
                'descripcion' => 'Tres Budas en miniatura, cada uno en una postura distinta, pintados en una paleta de tierras y ocres que combina entre sí.',
                'alto_pieza_cm' => 9, 'peso_kg' => 1.200, 'alto_cm' => 16, 'ancho_cm' => 32, 'largo_cm' => 14,
            ],
        ];

        foreach ($productos as $orden => $datos) {
            $imagen = $datos['imagen'] ?? null;
            $categoriaSlug = $datos['categoria'];
            unset($datos['imagen'], $datos['categoria']);

            $producto = Producto::updateOrCreate(
                ['slug' => $datos['slug']],
                [...$datos, 'categoria_id' => $categorias[$categoriaSlug], 'orden' => $orden + 1, 'estado' => Producto::ESTADO_ACTIVO],
            );

            if ($imagen) {
                $producto->imagenes()->updateOrCreate(['url' => $imagen['url']], [...$imagen, 'principal' => true, 'orden' => 1]);
            }
        }
    }
}
