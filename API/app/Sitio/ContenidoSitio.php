<?php

namespace App\Sitio;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * El contenido editable del sitio público.
 *
 * Lo que el taller puede cambiar sin tocar código: textos del home, contacto,
 * "nosotros", el aviso de arriba y los datos legales. La estructura (qué
 * secciones hay, cuántos diferenciales, qué botones) la decide el sitio; acá
 * solo viven los valores. Por eso cada sección tiene un esquema fijo y las
 * listas tienen largo fijo (ver `ContenidoSitioRequest`).
 *
 * `porDefecto()` es el sitio tal como se lanzó: lo que no se guardó nunca sale
 * de acá, y "restaurar" una sección es borrar su fila.
 */
class ContenidoSitio
{
    public const SECCIONES = ['general', 'announcement', 'contact', 'home', 'about', 'legal'];

    /**
     * La clave lleva un hash de los defaults: si se agrega un campo nuevo en
     * código, la caché vieja (que no lo tiene) queda huérfana sola, sin
     * acordarse de un cache:clear en el deploy.
     */
    private static function claveCache(): string
    {
        return 'sitio.contenido.'.md5(json_encode(self::porDefecto()));
    }

    /**
     * Listas del documento. El merge recursivo con los defaults mezclaría por
     * índice (dos personas guardadas sobre dos por defecto, bien; una sobre dos,
     * mal), así que una lista guardada reemplaza entera a la de por defecto.
     */
    private const LISTAS = ['home.highlights', 'about.manifesto.paragraphs', 'about.team.people'];

    /** Iconos disponibles para los diferenciales del home; el sitio dibuja cada uno. */
    public const ICONOS = ['brush', 'cube', 'shield', 'pencil', 'star', 'heart', 'truck', 'gift', 'sparkles', 'hand'];

    /** Documento completo: defaults + lo guardado, con los campos derivados. */
    public function obtener(): array
    {
        return Cache::rememberForever(self::claveCache(), function () {
            $guardado = DB::table('contenido_sitio')->pluck('contenido', 'seccion')
                ->map(fn ($json) => json_decode($json, true));

            $contenido = [];
            foreach (self::SECCIONES as $seccion) {
                $contenido[$seccion] = array_replace_recursive(
                    self::porDefecto()[$seccion],
                    $guardado[$seccion] ?? [],
                );
            }
            foreach (self::LISTAS as $ruta) {
                [$seccion] = explode('.', $ruta, 2);
                $lista = data_get($guardado[$seccion] ?? [], substr($ruta, strlen($seccion) + 1));
                if (is_array($lista)) {
                    data_set($contenido, $ruta, array_values($lista));
                }
            }

            return $this->derivar($contenido);
        });
    }

    public function guardar(string $seccion, array $contenido): void
    {
        DB::table('contenido_sitio')->updateOrInsert(
            ['seccion' => $seccion],
            ['contenido' => json_encode($contenido, JSON_UNESCAPED_UNICODE), 'updated_at' => now(), 'created_at' => now()],
        );
        Cache::forget(self::claveCache());
    }

    public function restaurar(string $seccion): void
    {
        DB::table('contenido_sitio')->where('seccion', $seccion)->delete();
        Cache::forget(self::claveCache());
    }

    /** Qué secciones tienen algo guardado (para que el panel muestre "personalizado"). */
    public function seccionesPersonalizadas(): array
    {
        return DB::table('contenido_sitio')->pluck('seccion')->all();
    }

    /** Campos que se calculan a partir de otros, para que el sitio no los arme. */
    private function derivar(array $c): array
    {
        $digitos = preg_replace('/\D+/', '', $c['contact']['whatsapp']['number']);
        $c['contact']['whatsapp']['link'] = $digitos ? "https://wa.me/{$digitos}" : '';

        return $c;
    }

    public static function porDefecto(): array
    {
        return [
            'general' => [
                // Logo del header/footer y favicon. Rutas del sitio o URLs subidas desde el panel.
                'logo' => '/img/petru-logo.png',
                'favicon' => '/favicon.svg',
                'tagline' => 'Hecho a mano, pintado para trascender.',
                'description' => 'Estudio de diseño y manufactura de arte pop y clásico en yeso. Estatuillas esculpidas y pintadas a mano, pieza por pieza.',
                // Herramientas externas, opcionales. Vacío = no se carga nada en el sitio.
                'tracking' => [
                    'ga4' => '',            // G-XXXXXXXXXX
                    'metaPixel' => '',      // número
                    'searchConsole' => '',  // contenido del meta google-site-verification
                ],
            ],

            'announcement' => [
                'enabled' => false,
                'text' => 'Envíos a Rosario y alrededores con embalaje blindado.',
                'link' => '/envios',
                'linkLabel' => 'Ver plazos',
            ],

            'contact' => [
                'whatsapp' => [
                    'number' => '+54 9 11 2345-6789',
                    'hours' => 'Lunes a Sábado • 09:00 a 19:00 hs',
                ],
                'email' => [
                    'address' => 'hola@petru.art',
                    'note' => 'Para colaboraciones o soporte postventa',
                ],
                'location' => [
                    'city' => 'Rosario, Santa Fe',
                    'country' => 'Argentina',
                    'note' => 'Hacemos envíos protegidos a todo el país',
                ],
                'social' => [
                    'instagram' => '',
                    'facebook' => '',
                    'tiktok' => '',
                ],
                'page' => [
                    'label' => 'Conexión Directa con el Taller',
                    'title' => "Hablemos de arte.\nHablemos de tu próximo espacio.",
                    'intro' => 'Escribinos por una pieza customizada, una consulta sobre tu pedido o una colaboración. Respondemos en un máximo de 3 horas hábiles.',
                ],
            ],

            'home' => [
                'hero' => [
                    'label' => 'Hecho a mano, pintado para trascender.',
                    // Entre guiones bajos va en cursiva ámbar; el salto de línea se respeta.
                    'title' => "El molde es el mismo.\n_El alma_ es única.",
                    'intro' => 'En Pëtru transformamos el yeso en piezas de diseño contemporáneo. Estatuillas meticulosamente esculpidas y pintadas a mano que capturan desde el misticismo clásico hasta el arte pop más vanguardista.',
                    'primaryButton' => ['text' => 'Explorar galería', 'href' => '/galeria'],
                    'secondaryButton' => ['text' => 'Encargar una pieza', 'href' => '/contacto'],
                    'image' => [
                        'url' => '/img/buda-home.webp',
                        'alt' => 'Estatuilla de yeso de un Buda pintada a mano bajo un árbol',
                    ],
                ],
                'highlights' => [
                    ['icon' => 'brush', 'title' => '100% Únicas', 'detail' => 'No hay dos pinceladas iguales'],
                    ['icon' => 'cube', 'title' => 'Yeso Alabastrino', 'detail' => 'Máxima densidad y suavidad'],
                    ['icon' => 'shield', 'title' => 'Embalaje Blindado', 'detail' => 'Garantía de llegada perfecta'],
                    ['icon' => 'pencil', 'title' => 'Custom Lab', 'detail' => 'Pintamos tus propias ideas'],
                ],
                'featured' => [
                    'label' => 'Selección del taller',
                    'title' => 'Piezas destacadas',
                    'intro' => 'Las que más nos gusta pintar esta temporada.',
                ],
                'customLab' => [
                    'enabled' => true,
                    'label' => '¿Tienes una idea loca en mente?',
                    'title' => 'Tú imaginas el diseño, nosotros mezclamos el yeso y los colores',
                    'text' => 'Ya sea un regalo corporativo rupturista, los colores de tu club favorito en una escultura clásica, o un diseño abstracto para combinar con tus sillones. Nuestro laboratorio de pintura lo hace real.',
                    'buttonText' => 'Cotizar mi idea por WhatsApp',
                    'note' => 'Plazo de entrega personalizado: 7 a 12 días hábiles',
                ],
            ],

            'about' => [
                'header' => [
                    'label' => 'La Filosofía Detrás del Molde',
                    'title' => 'Nacidos del caos, tallados con intención.',
                    'intro' => 'Pëtru no nació para decorar espacios vacíos. Nació para desafiar la frialdad de la producción en masa. En un mundo saturado de plástico idéntico, nosotros reivindicamos el peso, la textura y la imperfección sagrada del yeso pintado a mano.',
                ],
                'manifesto' => [
                    'label' => 'El Manifiesto de la Imperfección',
                    'quote' => 'Un molde genera la estructura física, pero es el pulso humano del artesano el que decide dónde vive el color y dónde se detiene el brillo.',
                    'paragraphs' => [
                        'Sostenemos que una estatuilla de yeso es un lienzo tridimensional. Mezclamos el polvo de alabastro con agua de forma meticulosa para lograr piezas de alta densidad y peso noble.',
                        'Luego, las tratamos como reliquias: cada trazo de pincel, cada salpicadura urbana y cada hoja de oro de 24k se aplica de manera completamente orgánica. No buscamos la perfección simétrica de una máquina; buscamos la emoción irrepetible.',
                    ],
                ],
                'team' => [
                    'label' => 'Manos Maestras',
                    'title' => 'Las mentes detrás de Pëtru',
                    'intro' => 'Un equipo multidisciplinario enfocado en revivir la estatuilla de autor como una pieza de colección.',
                    'people' => [
                        [
                            'name' => 'Delfina Cherey',
                            'role' => 'Co Fundadora & Maestra de Mezclas',
                            'bio' => 'Garantiza la densidad, el peso exacto y la perfección estructural de cada figura antes de pasar al lienzo.',
                            'photo' => '',
                        ],
                        [
                            'name' => 'Viviana Navarro',
                            'role' => 'Co Fundadora & Coordinadora',
                            'bio' => 'El puente entre tu mente y la pieza física. Lidera los pedidos a medida y las colaboraciones corporativas de gran escala.',
                            'photo' => '',
                        ],
                    ],
                ],
            ],

            'legal' => [
                'businessName' => '',
                'taxId' => '',
                'address' => 'Rosario, Santa Fe, Argentina',
            ],
        ];
    }
}
