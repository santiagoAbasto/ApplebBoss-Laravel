<?php

namespace App\Support;

/**
 * El estado en que el cliente deja el equipo: la revisión punto por punto y el código de
 * desbloqueo. Sale impreso en la nota que firman cliente y tienda. La lista de puntos no está
 * cerrada: estos son los que trae el sistema, en el mostrador se agrega cualquier otro.
 *
 * Ningún punto viene marcado de fábrica: una nota que dice «todo funcionaba» sin que nadie lo probó
 * no defiende a nadie.
 */
final class RecepcionDeEquipo
{
    /** Lo que se revisa al recibir un equipo, en el orden en que conviene revisarlo. */
    public const PUNTOS = [
        'Enciende', 'Pantalla sin fisuras', 'Táctil responde', 'Carga',
        'Cámara frontal', 'Cámara trasera', 'Altavoz y micrófono', 'Botones',
        'Face ID / Touch ID', 'Señal y chip', 'Chasis sin golpes', 'Deja cargador',
    ];

    /** Sí / No / No se pudo probar (un equipo que no enciende no se puede revisar). */
    public const ESTADOS = ['si', 'no', 'nc'];

    public const ETIQUETAS_ESTADO = ['si' => 'Sí', 'no' => 'No', 'nc' => 'No se pudo probar'];

    public const MODOS_DESBLOQUEO = ['deja', 'no_deja', 'sin_bloqueo'];

    public const TIPOS_DESBLOQUEO = ['pin' => 'PIN', 'patron' => 'Patrón', 'contrasena' => 'Contraseña'];

    /** Reglas de validación del bloque, para usarlas tal cual en el controlador. */
    public static function reglas(): array
    {
        return [
            'recepcion'                     => 'nullable|array',
            'recepcion.revision'            => 'nullable|array|max:40',
            'recepcion.revision.*.etiqueta' => 'nullable|string|max:80',
            'recepcion.revision.*.estado'   => 'nullable|in:' . implode(',', self::ESTADOS),
            'recepcion.desbloqueo'          => 'nullable|array',
            'recepcion.desbloqueo.modo'     => 'nullable|in:' . implode(',', self::MODOS_DESBLOQUEO),
            'recepcion.desbloqueo.tipo'     => 'nullable|in:' . implode(',', array_keys(self::TIPOS_DESBLOQUEO)),
            'recepcion.desbloqueo.valor'    => 'nullable|string|max:60',
        ];
    }

    /**
     * Deja el bloque listo para guardar: sin puntos vacíos, sin repetidos y sin el código colgado
     * de un «no deja». Devuelve null cuando no se llenó nada.
     */
    public static function normalizar(?array $datos): ?array
    {
        $revision = [];
        $vistos = [];

        foreach ($datos['revision'] ?? [] as $punto) {
            $etiqueta = trim(strip_tags((string) ($punto['etiqueta'] ?? '')));
            $estado = (string) ($punto['estado'] ?? '');

            if ($etiqueta === '' || ! in_array($estado, self::ESTADOS, true)) {
                continue;
            }

            $clave = mb_strtolower($etiqueta);
            if (isset($vistos[$clave])) {
                continue;
            }

            $vistos[$clave] = true;
            $revision[] = ['etiqueta' => $etiqueta, 'estado' => $estado];
        }

        $modo = (string) ($datos['desbloqueo']['modo'] ?? '');
        $desbloqueo = null;

        if (in_array($modo, self::MODOS_DESBLOQUEO, true)) {
            $desbloqueo = ['modo' => $modo];

            if ($modo === 'deja') {
                $tipo = (string) ($datos['desbloqueo']['tipo'] ?? '');
                $desbloqueo['tipo'] = isset(self::TIPOS_DESBLOQUEO[$tipo]) ? $tipo : 'pin';
                $desbloqueo['valor'] = trim(strip_tags((string) ($datos['desbloqueo']['valor'] ?? ''))) ?: null;
            }
        }

        if ($revision === [] && $desbloqueo === null) {
            return null;
        }

        return ['revision' => $revision, 'desbloqueo' => $desbloqueo];
    }

    /** Cómo se lee el desbloqueo en la nota impresa. «No lo deja» también se imprime: es un dato, no un vacío. */
    public static function textoDesbloqueo(?array $desbloqueo): ?string
    {
        return match ($desbloqueo['modo'] ?? null) {
            'deja' => (self::TIPOS_DESBLOQUEO[$desbloqueo['tipo'] ?? 'pin'] ?? 'PIN')
                . ' ' . ($desbloqueo['valor'] ?: 'sin anotar'),
            'no_deja'     => 'El cliente no deja el código de desbloqueo.',
            'sin_bloqueo' => 'El equipo no tiene bloqueo.',
            default       => null,
        };
    }
}
