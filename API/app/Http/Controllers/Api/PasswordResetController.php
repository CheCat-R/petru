<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

/**
 * "Olvidé mi contraseña": link por email que abre el panel en /restablecer.
 *
 * La respuesta al pedido es siempre la misma, exista o no la cuenta: si no,
 * el formulario sirve para averiguar qué emails tienen acceso al panel.
 */
class PasswordResetController extends Controller
{
    public function enviar(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::broker()->sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'Si el email tiene una cuenta en el panel, te llega un link para elegir una contraseña nueva. Revisá también el spam.',
        ]);
    }

    public function restablecer(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PerfilController::reglaPassword()],
        ], [], ['password' => 'contraseña']);

        $estado = Password::broker()->reset($datos, function (User $usuario, string $password) {
            $usuario->forceFill(['password' => Hash::make($password), 'remember_token' => null])->save();
        });

        if ($estado !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'El link venció o ya se usó. Pedí uno nuevo desde «Olvidé mi contraseña».',
            ]);
        }

        return response()->json(['message' => 'Contraseña actualizada. Ya podés ingresar.']);
    }
}
