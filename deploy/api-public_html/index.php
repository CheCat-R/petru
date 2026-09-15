<?php

/**
 * Puente para Hostinger: este archivo vive en el document root del subdominio
 * (…/domains/api.petru.com.ar/public_html) y la aplicación Laravel completa
 * vive un nivel arriba, en ../laravel, fuera del alcance del navegador.
 *
 * Es el public/index.php de Laravel con las rutas apuntando a ../laravel.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$laravel = __DIR__.'/../laravel';

if (file_exists($maintenance = $laravel.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravel.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravel.'/bootstrap/app.php';

// public_path() tiene que ser esta carpeta (storage:link y assets), no laravel/public.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
