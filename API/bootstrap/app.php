<?php

use App\Exceptions\CarritoInvalido;
use App\Exceptions\FueraDeCobertura;
use App\Exceptions\TransicionInvalida;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum en modo cookie: las peticiones desde los orígenes de
        // SANCTUM_STATEFUL_DOMAINS usan la sesión de Laravel. El token nunca
        // pasa por JavaScript.
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API pura: todo error bajo /api responde JSON, pida lo que pida el cliente.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        // Una transición de estado inválida es un conflicto con el estado actual, no un 500.
        $exceptions->render(fn (TransicionInvalida $e) => response()->json(['message' => $e->getMessage()], 409));

        // Fuera de cobertura: es un dato inválido del formulario, 422 como cualquier otro.
        $exceptions->render(fn (FueraDeCobertura $e) => response()->json([
            'message' => $e->getMessage(),
            'errors' => ['codigo_postal' => [$e->getMessage()]],
        ], 422));

        // El carrito cambió (stock, borrador): conflicto con el estado actual, con el detalle por ítem.
        $exceptions->render(fn (CarritoInvalido $e) => response()->json([
            'message' => $e->getMessage(),
            'items' => $e->detalles,
        ], 409));

        // 404 limpio para la API: sin trace ni nombre de modelo, aunque APP_DEBUG esté activo.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'No encontramos lo que buscás.'], 404);
            }
        });
    })->create();
