<?php

use Illuminate\Support\Facades\Route;

// API pura: la raíz solo confirma que el servicio responde.
Route::get('/', fn () => response()->json([
    'servicio' => config('app.name'),
    'estado' => 'ok',
    'version' => app()->version(),
]));
