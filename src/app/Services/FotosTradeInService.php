<?php

namespace App\Services;

use App\Models\TradeInSolicitud;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Las fotos que el cliente sube con su solicitud de Trade-In. Van al disco privado (`local`): solo se ven desde el panel,
 * con la ruta admin.trade-in.foto. Al borrar la solicitud se borran con ella.
 */
class FotosTradeInService
{
    public const DISCO = 'local';
    public const MAXIMO = 6;
    public const MAX_KB = 10240;

    /** @param UploadedFile[] $archivos */
    public function guardar(TradeInSolicitud $solicitud, array $archivos): void
    {
        $fotos = $solicitud->fotos ?? [];

        foreach (array_slice($archivos, 0, max(0, self::MAXIMO - count($fotos))) as $archivo) {
            $extension = strtolower($archivo->extension() ?: $archivo->getClientOriginalExtension() ?: 'jpg');
            $ruta = $archivo->storeAs($this->carpeta($solicitud), Str::uuid() . ".{$extension}", self::DISCO);

            $fotos[] = [
                'ruta'   => $ruta,
                'nombre' => Str::limit($archivo->getClientOriginalName(), 80, ''),
                'mime'   => $archivo->getMimeType(),
                'peso'   => $archivo->getSize(),
            ];
        }

        $solicitud->forceFill(['fotos' => $fotos])->save();
    }

    public function borrar(TradeInSolicitud $solicitud): void
    {
        Storage::disk(self::DISCO)->deleteDirectory($this->carpeta($solicitud));
    }

    private function carpeta(TradeInSolicitud $solicitud): string
    {
        return "trade-in/{$solicitud->codigo}";
    }
}
