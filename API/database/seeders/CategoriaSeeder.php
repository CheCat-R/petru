<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    /** Las cuatro categorías que el sitio actual enlaza desde el footer. */
    public function run(): void
    {
        $categorias = [
            ['nombre' => 'Mitología', 'slug' => 'mitologia', 'descripcion' => 'Dioses, budas y figuras clásicas reinterpretadas.', 'orden' => 1],
            ['nombre' => 'Pop Art', 'slug' => 'pop-art', 'descripcion' => 'Color saturado, cultura urbana y guiños contemporáneos.', 'orden' => 2],
            ['nombre' => 'Miniaturas', 'slug' => 'miniaturas', 'descripcion' => 'Piezas pequeñas de colección para repisas y escritorios.', 'orden' => 3],
            ['nombre' => 'Tarjetas de Regalo', 'slug' => 'gift-cards', 'descripcion' => 'Regalá la pieza que elijan ellos.', 'orden' => 4],
        ];

        foreach ($categorias as $categoria) {
            Categoria::updateOrCreate(['slug' => $categoria['slug']], $categoria);
        }
    }
}
