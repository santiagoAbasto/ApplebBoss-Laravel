<?php

namespace App\Support\FichaTecnica;

/**
 * Los textos de la ficha de un accesorio (database/data/modelos_referencia/accesorios.php). La ficha de un accesorio
 * ya se escribe como se lee en la tienda, así que pasa tal cual: solo se descartan los vacíos. Las claves son las del
 * grupo producto_general de fichaTecnica.jsx (EsquemaAccesorio::FICHA).
 */
final class TextosAccesorio
{
    public static function desde(array $d): array
    {
        return array_filter($d['ficha'] ?? [], fn ($texto) => is_string($texto) && trim($texto) !== '');
    }
}
