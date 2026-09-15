<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Controller;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Cuentas del panel. Un solo rol (todos administran), así que las reglas son
 * pocas: nadie se borra a sí mismo y siempre queda al menos una cuenta.
 */
class UsuarioController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UsuarioResource::collection(User::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', PerfilController::reglaPassword()],
        ], [], ['name' => 'nombre', 'password' => 'contraseña']);

        $usuario = User::create([...$datos, 'password' => Hash::make($datos['password'])]);

        return (new UsuarioResource($usuario))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $usuario): UsuarioResource
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users', 'email')->ignore($usuario->id)],
        ], [], ['name' => 'nombre']);

        $usuario->fill($datos)->save();

        return new UsuarioResource($usuario);
    }

    /** Nueva contraseña para otra cuenta (cuando alguien la olvidó y no le llega el mail). */
    public function restablecerPassword(Request $request, User $usuario): JsonResponse
    {
        $datos = $request->validate([
            'password' => ['required', 'confirmed', PerfilController::reglaPassword()],
        ], [], ['password' => 'contraseña']);

        $usuario->forceFill(['password' => Hash::make($datos['password']), 'remember_token' => null])->save();

        return response()->json(['message' => "Contraseña de {$usuario->name} actualizada."]);
    }

    public function destroy(Request $request, User $usuario): JsonResponse
    {
        abort_if($usuario->is($request->user()), 409, 'No podés borrar tu propia cuenta. Pedíselo a otra persona del taller.');
        abort_if(User::count() <= 1, 409, 'Es la única cuenta del panel: creá otra antes de borrarla.');

        $usuario->delete();

        return response()->json(['message' => 'Cuenta eliminada.']);
    }
}
