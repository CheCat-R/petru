<?php

use App\Http\Controllers\Api\Admin\CategoriaController as AdminCategoriaController;
use App\Http\Controllers\Api\Admin\ConsultaController as AdminConsultaController;
use App\Http\Controllers\Api\Admin\EstadisticaController;
use App\Http\Controllers\Api\Admin\IntegracionEnviosController;
use App\Http\Controllers\Api\Admin\IntegracionMercadoPagoController;
use App\Http\Controllers\Api\Admin\NovedadController;
use App\Http\Controllers\Api\Admin\PedidoController as AdminPedidoController;
use App\Http\Controllers\Api\Admin\ProductoController as AdminProductoController;
use App\Http\Controllers\Api\Admin\ProductoImagenController;
use App\Http\Controllers\Api\Admin\SitioController as AdminSitioController;
use App\Http\Controllers\Api\Admin\UsuarioController as AdminUsuarioController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Api\SitioController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ConsultaController;
use App\Http\Controllers\Api\EnvioController;
use App\Http\Controllers\Api\EventoController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\WebhookMercadoPagoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Públicas — las consume Sitio_web/
|--------------------------------------------------------------------------
*/

// Textos e imágenes editables del sitio (lo lee el build del sitio y el navegador)
Route::get('/sitio', SitioController::class);

Route::get('/categorias', [CategoriaController::class, 'index']);
Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/{slug}', [ProductoController::class, 'show']);

Route::post('/consultas', [ConsultaController::class, 'store'])
    ->middleware('throttle:consultas');

// Checkout
Route::post('/envios/cotizar', [EnvioController::class, 'cotizar'])->middleware('throttle:cotizaciones');
Route::post('/pedidos', [PedidoController::class, 'store'])->middleware('throttle:pedidos');
Route::get('/pedidos/{token}', [PedidoController::class, 'show'])->middleware('throttle:seguimiento');
Route::post('/pedidos/{token}/simular-pago', [PedidoController::class, 'simularPago']); // solo pasarela simulada

// Analítica propia: el sitio manda un evento por página vista, pieza vista, carrito…
Route::post('/eventos', [EventoController::class, 'store'])->middleware('throttle:eventos');

// MercadoPago avisa acá. Sin auth: valida la firma x-signature.
Route::post('/webhooks/mercadopago', WebhookMercadoPagoController::class);

/*
|--------------------------------------------------------------------------
| Sesión del panel (Sanctum en modo cookie)
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    // "Olvidé mi contraseña": respuesta neutra, link por mail al panel
    Route::post('/olvide', [PasswordResetController::class, 'enviar'])->middleware('throttle:olvide');
    Route::post('/restablecer', [PasswordResetController::class, 'restablecer'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/usuario', [AuthController::class, 'usuario']);

        // Mi perfil
        Route::put('/perfil', [PerfilController::class, 'update']);
        Route::put('/perfil/password', [PerfilController::class, 'cambiarPassword']);
        Route::post('/perfil/cerrar-otras-sesiones', [PerfilController::class, 'cerrarOtrasSesiones']);
    });
});

/*
|--------------------------------------------------------------------------
| Privadas — las consume panel-dashboard/
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Catálogo. `{producto:id}`: el público resuelve por slug, el panel por id.
    Route::get('/productos', [AdminProductoController::class, 'index']);
    Route::post('/productos', [AdminProductoController::class, 'store']);
    Route::get('/productos/{producto:id}', [AdminProductoController::class, 'show']);
    Route::put('/productos/{producto:id}', [AdminProductoController::class, 'update']);
    Route::delete('/productos/{producto:id}', [AdminProductoController::class, 'destroy']);

    Route::post('/productos/{producto:id}/imagenes', [ProductoImagenController::class, 'store']);
    Route::patch('/productos/{producto:id}/imagenes/{imagen}', [ProductoImagenController::class, 'update']);
    Route::delete('/productos/{producto:id}/imagenes/{imagen}', [ProductoImagenController::class, 'destroy']);

    Route::apiResource('categorias', AdminCategoriaController::class)->except('show');

    // Estadísticas del sitio (visitas, fuentes, embudo, piezas más vistas)
    Route::get('/estadisticas', EstadisticaController::class);

    // Lo pendiente de atender: lo consulta el panel cada pocos segundos
    Route::get('/novedades', NovedadController::class);

    // Contenido del sitio: una sección por vez, con "restaurar" a lo de fábrica
    Route::get('/sitio', [AdminSitioController::class, 'show']);
    Route::put('/sitio/{seccion}', [AdminSitioController::class, 'update']);
    Route::delete('/sitio/{seccion}', [AdminSitioController::class, 'restaurar']);
    Route::post('/sitio/imagenes', [AdminSitioController::class, 'subirImagen']);

    // Cuentas del panel
    Route::get('/usuarios', [AdminUsuarioController::class, 'index']);
    Route::post('/usuarios', [AdminUsuarioController::class, 'store']);
    Route::put('/usuarios/{usuario}', [AdminUsuarioController::class, 'update']);
    Route::put('/usuarios/{usuario}/password', [AdminUsuarioController::class, 'restablecerPassword']);
    Route::delete('/usuarios/{usuario}', [AdminUsuarioController::class, 'destroy']);

    // Integraciones: credenciales de MercadoPago (prueba y producción), con test de conexión
    Route::get('/integraciones/mercadopago', [IntegracionMercadoPagoController::class, 'show']);
    Route::put('/integraciones/mercadopago', [IntegracionMercadoPagoController::class, 'update']);
    Route::post('/integraciones/mercadopago/probar', [IntegracionMercadoPagoController::class, 'probar']);
    Route::delete('/integraciones/mercadopago/error', [IntegracionMercadoPagoController::class, 'limpiarError']);
    Route::delete('/integraciones/mercadopago/{que}', [IntegracionMercadoPagoController::class, 'destroy']);

    // Envíos: retiro, zonas y tarifas de respaldo, bulto por defecto, Andreani
    Route::get('/integraciones/envios', [IntegracionEnviosController::class, 'show']);
    Route::put('/integraciones/envios', [IntegracionEnviosController::class, 'update']);
    Route::post('/integraciones/envios/probar-andreani', [IntegracionEnviosController::class, 'probarAndreani']);
    Route::delete('/integraciones/envios/andreani', [IntegracionEnviosController::class, 'borrarAndreani']);
    Route::delete('/integraciones/envios/error', [IntegracionEnviosController::class, 'limpiarError']);

    // Consultas del formulario de contacto
    Route::get('/consultas', [AdminConsultaController::class, 'index']);
    Route::patch('/consultas/{consulta}', [AdminConsultaController::class, 'update']);

    // Pedidos: lectura + transiciones explícitas
    Route::get('/pedidos', [AdminPedidoController::class, 'index']);
    Route::get('/pedidos/{pedido:numero}', [AdminPedidoController::class, 'show']);
    Route::patch('/pedidos/{pedido:numero}/notas', [AdminPedidoController::class, 'actualizarNotas']);
    Route::post('/pedidos/{pedido:numero}/confirmar-pago', [AdminPedidoController::class, 'confirmarPago']);
    Route::post('/pedidos/{pedido:numero}/rechazar-pago', [AdminPedidoController::class, 'rechazarPago']);
    Route::post('/pedidos/{pedido:numero}/cancelar', [AdminPedidoController::class, 'cancelar']);
    Route::post('/pedidos/{pedido:numero}/reembolsar', [AdminPedidoController::class, 'reembolsar']);
    Route::post('/pedidos/{pedido:numero}/despachar', [AdminPedidoController::class, 'despachar']);
    Route::post('/pedidos/{pedido:numero}/entregado', [AdminPedidoController::class, 'marcarEntregado']);
    Route::post('/pedidos/{pedido:numero}/devolucion', [AdminPedidoController::class, 'registrarDevolucion']);
    Route::post('/pedidos/{pedido:numero}/confirmar-reembolso', [AdminPedidoController::class, 'confirmarReembolso']);
});
