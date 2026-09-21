<?php

namespace App\Support;

/**
 * Iconos de trazo para los PDF. dompdf no dibuja <svg> en línea: van como imagen en data URI.
 * Solo formas simples (rect, circle, line, polyline y curvas), que son las que su lector de SVG resuelve bien.
 * El ancho y el alto tienen que ser los del viewBox: ese lector no escala uno contra el otro.
 */
class IconoPdf
{
    private const TRAZOS = [
        'cliente'    => '<circle cx="12" cy="8" r="4"/><path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21"/>',
        'calendario' => '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
        'pago'       => '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>',
        'vendedor'   => '<circle cx="10" cy="8" r="4"/><path d="M2 21 C2 16 6 14 10 14 C12 14 13.5 14.4 15 15.2"/><polyline points="15,19 17.5,21.5 22,16.5"/>',
        'telefono'   => '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
        'ubicacion'  => '<path d="M12 22 C12 22 5 15 5 9.5 C5 5.4 8.1 2.5 12 2.5 C15.9 2.5 19 5.4 19 9.5 C19 15 12 22 12 22 Z"/><circle cx="12" cy="9.5" r="2.5"/>',
        'documento'  => '<path d="M6 2 L14 2 L19 7 L19 22 L6 22 Z"/><polyline points="14,2 14,7 19,7"/><line x1="9" y1="13" x2="16" y2="13"/><line x1="9" y1="17" x2="16" y2="17"/>',
        'garantia'   => '<path d="M12 2 L20 5 L20 11.5 C20 16.5 16.6 20.4 12 22 C7.4 20.4 4 16.5 4 11.5 L4 5 Z"/><polyline points="8.5,12 11,14.5 15.5,9.5"/>',
        'celular'    => '<rect x="6" y="2" width="12" height="20" rx="2.5"/><line x1="10.5" y1="5" x2="13.5" y2="5"/>',
        'computadora' => '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19 L22 19 L20 15 L4 15 Z"/>',
        'tablet'     => '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="11" y1="18.5" x2="13" y2="18.5"/>',
        'caja'       => '<path d="M3 7.5 L12 3 L21 7.5 L21 16.5 L12 21 L3 16.5 Z"/><polyline points="3,7.5 12,12 21,7.5"/><line x1="12" y1="12" x2="12" y2="21"/>',
        'permuta'    => '<polyline points="16,3 20,7 16,11"/><line x1="4" y1="7" x2="20" y2="7"/><polyline points="8,13 4,17 8,21"/><line x1="20" y1="17" x2="4" y2="17"/>',
        'chip'       => '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><line x1="9" y1="3" x2="9" y2="6"/><line x1="15" y1="3" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="21"/><line x1="15" y1="18" x2="15" y2="21"/><line x1="3" y1="9" x2="6" y2="9"/><line x1="3" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="21" y2="9"/><line x1="18" y1="15" x2="21" y2="15"/>',
        'memoria'    => '<rect x="2" y="7" width="20" height="9" rx="1.5"/><rect x="5" y="9.5" width="3.5" height="4"/><rect x="10.25" y="9.5" width="3.5" height="4"/><rect x="15.5" y="9.5" width="3.5" height="4"/><line x1="5" y1="16" x2="5" y2="19"/><line x1="9.5" y1="16" x2="9.5" y2="19"/><line x1="14.5" y1="16" x2="14.5" y2="19"/><line x1="19" y1="16" x2="19" y2="19"/>',
        'disco'      => '<rect x="3" y="4" width="18" height="16" rx="2.5"/><line x1="3" y1="14" x2="21" y2="14"/><circle cx="17" cy="17" r="0.9"/><line x1="7" y1="17" x2="11" y2="17"/>',
        'color'      => '<path d="M12 3 C12 3 5.5 10 5.5 14.5 C5.5 18.1 8.4 21 12 21 C15.6 21 18.5 18.1 18.5 14.5 C18.5 10 12 3 12 3 Z"/><path d="M9 15 C9 16.7 10.3 18 12 18"/>',
        'bateria'    => '<rect x="2" y="7.5" width="17" height="9" rx="2.2"/><line x1="22" y1="10.5" x2="22" y2="13.5"/><rect x="4.8" y="10.2" width="8" height="3.6" rx="0.8"/>',
        'etiqueta'   => '<path d="M3 11.5 L11.5 3 L21 3 L21 12.5 L12.5 21 Z"/><circle cx="16.3" cy="7.7" r="1.4"/>',
        'codigo'     => '<line x1="4" y1="5" x2="4" y2="19"/><line x1="7.5" y1="5" x2="7.5" y2="19"/><line x1="10.5" y1="5" x2="10.5" y2="16"/><line x1="14" y1="5" x2="14" y2="19"/><line x1="17" y1="5" x2="17" y2="16"/><line x1="20" y1="5" x2="20" y2="19"/>',
        'sim'        => '<path d="M7 2.5 L14.5 2.5 L19 7 L19 21.5 L7 21.5 Z"/><rect x="10" y="11" width="6" height="7" rx="1"/><line x1="10" y1="14.5" x2="16" y2="14.5"/>',
        'alerta'     => '<path d="M12 3.5 L22 20.5 L2 20.5 Z"/><line x1="12" y1="10" x2="12" y2="14.5"/><line x1="12" y1="17.4" x2="12" y2="17.6"/>',
        'web'        => '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3 C8.5 6.5 8.5 17.5 12 21 C15.5 17.5 15.5 6.5 12 3 Z"/>',
    ];

    public static function uri(string $nombre, string $color = '#01295c'): string
    {
        return 'data:image/svg+xml;base64,' . base64_encode(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' . $color
            . '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' . (self::TRAZOS[$nombre] ?? self::TRAZOS['caja']) . '</svg>'
        );
    }
}
