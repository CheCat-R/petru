<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * El perfil de quien está logueado: datos, contraseña y sesiones.
 *
 * Cambiar el email o la contraseña pide la contraseña actual: si alguien deja
 * el panel abierto, no alcanza con sentarse en la silla para quedarse con la
 * cuenta. Al cambiar la contraseña se cierran las demás sesiones.
 */
class PerfilController extends Controller
{
    /** Regla de contraseña del panel: la misma que usa `petru:usuario`. */
    public static function reglaPassword(): Password
    {
        return Password::min(12)->letters()->numbers();
    }

    public function update(Request $request): UsuarioResource
    {
        $usuario = $request->user();

        $datos = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users', 'email')->ignore($usuario->id)],
            'password' => [Rule::requiredIf(fn () => strcasecmp($request->input('email'), $usuario->email) !== 0), 'nullable', 'current_password:web'],
        ], [
            'password.required' => 'Para cambiar el email hace falta tu contraseña actual.',
            'password.current_password' => 'La contraseña actual no es correcta.',
        ], [
            'name' => 'nombre',
        ]);

        $usuario->fill(['name' => $datos['name'], 'email' => $datos['email']])->save();

        return new UsuarioResource($usuario);
    }

    public function cambiarPassword(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'password_actual' => ['required', 'current_password:web'],
            'password' => ['required', 'confirmed', self::reglaPassword(), 'different:password_actual'],
        ], [
            'password_actual.current_password' => 'La contraseña actual no es correcta.',
            'password.different' => 'La contraseña nueva tiene que ser distinta de la actual.',
        ], [
            'password_actual' => 'contraseña actual',
            'password' => 'contraseña nueva',
        ]);

        $request->user()->forceFill(['password' => Hash::make($datos['password'])])->save();

        // Quien tenga la contraseña vieja abierta en otro lado, afuera.
        Auth::guard('web')->logoutOtherDevices($datos['password']);
        $request->session()->regenerate();

        return response()->json(['message' => 'Contraseña actualizada. Las otras sesiones se cerraron.']);
    }

    public function cerrarOtrasSesiones(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'password' => ['required', 'current_password:web'],
        ], [
            'password.current_password' => 'La contraseña no es correcta.',
        ]);

        Auth::guard('web')->logoutOtherDevices($datos['password']);
        $request->session()->regenerate();

        return response()->json(['message' => 'Las demás sesiones se cerraron.']);
    }
}
