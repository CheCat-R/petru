<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Sesión del panel, en modo cookie de Sanctum.
 *
 * El panel primero pide `GET /sanctum/csrf-cookie` y después hace el login; a
 * partir de ahí cada request viaja con la cookie de sesión (httpOnly) y el
 * header X-XSRF-TOKEN. Ningún token queda accesible desde JavaScript.
 */
class AuthController extends Controller
{
    public function login(Request $request): UsuarioResource
    {
        $credenciales = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credenciales, remember: $request->boolean('recordarme'))) {
            throw ValidationException::withMessages([
                'email' => 'El email o la contraseña no son correctos.',
            ]);
        }

        $request->session()->regenerate();

        return new UsuarioResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function usuario(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user());
    }
}
