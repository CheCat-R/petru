<?php

return [

    // URL pública del sitio: links en emails y retorno de MercadoPago
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    // URL del panel, para los links en los mails al taller
    'panel_url' => env('PANEL_URL', 'http://localhost:5174'),

    // Casilla del taller: aviso de pedidos pagados y consultas
    'email_taller' => env('PETRU_EMAIL_TALLER'),

    // Minutos que se sostiene la reserva de stock mientras el cliente paga afuera
    'reserva_minutos' => (int) env('PEDIDO_RESERVA_MINUTOS', 30),

    'mercadopago' => [
        'access_token' => env('MERCADOPAGO_ACCESS_TOKEN'),
        'public_key' => env('MERCADOPAGO_PUBLIC_KEY'),
        'webhook_secret' => env('MERCADOPAGO_WEBHOOK_SECRET'),
        // Texto que ve el cliente en el resumen de su tarjeta
        'descriptor' => env('MERCADOPAGO_DESCRIPTOR', 'PETRU'),
    ],

    'andreani' => [
        'api_url' => env('ANDREANI_API_URL') ?: 'https://apis.andreani.com',
        'usuario' => env('ANDREANI_USUARIO'),
        'password' => env('ANDREANI_PASSWORD'),
        'cliente' => env('ANDREANI_CLIENTE'),
        'contrato' => env('ANDREANI_CONTRATO'),
        'cp_origen' => env('ANDREANI_CP_ORIGEN', '2000'), // Rosario
        'timeout' => 3,
        'cache_minutos' => 10,
        // Bulto que se asume cuando una pieza no tiene medidas cargadas.
        // Conviene que sea generoso: cotizar de más molesta, cotizar de menos cuesta plata.
        'bulto_por_defecto' => [
            'peso_kg' => 3.0,
            'alto_cm' => 30,
            'ancho_cm' => 30,
            'largo_cm' => 30,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Envíos: cobertura y tarifas de respaldo
    |--------------------------------------------------------------------------
    | Cobertura actual: Rosario y alrededores. Un código postal fuera de estas
    | zonas no puede comprar (el checkout lo dice antes de pedir el pago).
    |
    | Las tarifas de respaldo se usan cuando Andreani no está configurado o no
    | responde. Son la red de seguridad de la venta: siempre tienen que estar
    | cargadas, aunque la cotización en vivo funcione.
    |
    | Esto es solo el valor de ARRANQUE: lo que rige es lo que el taller guarda
    | en el panel (Integraciones → Envíos, App\Integraciones\EnviosConfig).
    */
    'envios' => [
        'retiro_en_taller' => [
            'habilitado' => true,
            'nombre' => 'Retiro en el taller',
            'detalle' => 'Rosario, con cita previa por WhatsApp',
            'plazo' => 'A coordinar',
        ],

        'zonas' => [
            [
                'nombre' => 'Rosario',
                'codigos_postales' => ['2000'],
                'costo' => 3500,
                'plazo' => '24 a 48 hs hábiles',
            ],
            [
                'nombre' => 'Gran Rosario',
                'codigos_postales' => [
                    '2121', // Pérez
                    '2122', // Soldini
                    '2124', // Villa Gobernador Gálvez
                    '2126', // Alvear · Pueblo Esther
                    '2128', // Arroyo Seco
                    '2132', // Funes
                    '2134', // Roldán
                    '2142', // Ibarlucea
                    '2152', // Granadero Baigorria
                    '2154', // Capitán Bermúdez
                    '2156', // Fray Luis Beltrán
                    '2200', // San Lorenzo
                ],
                'costo' => 5500,
                'plazo' => '48 a 72 hs hábiles',
            ],
        ],

        // Transportista que se informa al despachar cuando la cotización fue de respaldo
        'transportista_por_defecto' => 'Andreani',
    ],

];
