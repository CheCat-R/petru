<?php

namespace App\Http\Controllers\Api;

use App\Events\ConsultaRecibida;
use App\Http\Controllers\Controller;
use App\Http\Requests\ConsultaRequest;
use App\Models\Consulta;
use Illuminate\Http\JsonResponse;

class ConsultaController extends Controller
{
    public function store(ConsultaRequest $request): JsonResponse
    {
        $consulta = Consulta::create([
            ...$request->safe()->except('sitio_web'),
            'ip' => $request->ip(),
        ]);

        ConsultaRecibida::dispatch($consulta);

        return response()->json([
            'id' => $consulta->id,
            'mensaje' => 'Recibimos tu consulta. Te respondemos personalmente en un máximo de 3 horas hábiles.',
        ], 201);
    }
}
