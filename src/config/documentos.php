<?php

/*
 | Lo que imprimen los documentos que se entregan al cliente (boleta de venta).
 | Los textos de la garantía salen de la hoja «Garantía de productos Apple Boss» de la tienda.
 | Para cambiar un plazo o una frase se edita aquí: no hay que tocar la plantilla.
 */
return [
    'nit'           => '12555473014',
    'contribuyente' => 'Empresa Unipersonal',
    'web'           => 'appleboss.com.bo',
    'instagram'     => '@apple_boss_bol',
    'correo'        => 'apple.boss2011@gmail.com',

    'garantia' => [
        // Meses de garantía según lo que se vende
        'meses' => [
            'equipo_nuevo'       => 12,
            'equipo_seminuevo'   => 4,
            'cargador_original'  => 6,
            'cargador_certificado' => 3,
        ],

        'intro' => 'Gracias por confiar en Apple Boss. Al realizar su compra, el cliente acepta los siguientes términos.',

        'secciones' => [
            [
                'titulo' => 'Períodos de garantía',
                'icono'  => 'calendario',
                'lista'  => [
                    'Equipos nuevos: 12 meses.',
                    'Equipos seminuevos: 4 meses.',
                    'Cargadores originales Apple: 6 meses.',
                    'Cargadores certificados: 3 meses.',
                ],
                'cierre' => 'El plazo corre desde la fecha de entrega que figura en esta boleta.',
            ],
            [
                'titulo' => '¿Qué cubre la garantía?',
                'icono'  => 'garantia',
                'texto'  => 'Cubre las fallas de fábrica que impidan el correcto funcionamiento del equipo, es decir, las que no fueron causadas por el uso:',
                'lista'  => [
                    'Problemas internos de hardware.',
                    'Fallas de encendido no causadas por mal uso.',
                    'Defectos de fabricación confirmados en la revisión técnica.',
                ],
                'cierre' => 'Comprobado que la falla está cubierta, se procede con la solución técnica que corresponda.',
            ],
            [
                'titulo' => 'Cómo hacer efectiva la garantía',
                'icono'  => 'documento',
                'texto'  => 'El cliente debe presentar:',
                'lista'  => [
                    'El equipo adquirido.',
                    'Esta boleta o el código de la nota de venta.',
                    'El número de serie o IMEI legible.',
                ],
                'cierre' => 'La revisión la realiza únicamente el Servicio Técnico de Apple Boss. Recibir el equipo para evaluarlo no implica aceptar la garantía.',
            ],
            [
                'titulo'   => 'Exclusiones de garantía',
                'icono'    => 'caja',
                'texto'    => 'La garantía queda anulada automáticamente en los siguientes casos:',
                'numerada' => true,
                'lista'    => [
                    'Daños por golpes, caídas o presión indebida.',
                    'Contacto con líquidos, humedad, arena o polvo.',
                    'Equipos abiertos, manipulados o reparados por terceros.',
                    'Alteración o ausencia de IMEI o número de serie.',
                    'Daños por voltaje, cargadores no certificados o cortocircuitos.',
                    'Pantallas rotas, flex dañados o baterías infladas por mal uso.',
                    'Problemas de software causados por el usuario.',
                    'Equipos que no encienden al momento de la revisión.',
                ],
            ],
            [
                'titulo'   => 'Qué pasa cuando traes tu equipo',
                'icono'    => 'vendedor',
                'numerada' => true,
                'lista'    => [
                    'Recibimos el equipo y lo registramos con esta boleta.',
                    'El Servicio Técnico hace el diagnóstico, que puede demorar hasta 72 horas hábiles.',
                    'Si la falla es de fábrica y está dentro del plazo, se aplica la solución técnica que corresponda.',
                    'Si la falla está entre las exclusiones, se informa al cliente el resultado del diagnóstico.',
                ],
            ],
            [
                'titulo' => 'Condiciones importantes',
                'icono'  => 'pago',
                'lista'  => [
                    'La garantía es válida únicamente dentro del tiempo establecido.',
                    'No se aceptan cambios ni devoluciones.',
                    'El diagnóstico técnico puede demorar hasta 72 horas hábiles.',
                    'La garantía aplica una sola vez por falla.',
                    'No se realizan devoluciones de dinero.',
                ],
            ],
        ],
    ],
];
