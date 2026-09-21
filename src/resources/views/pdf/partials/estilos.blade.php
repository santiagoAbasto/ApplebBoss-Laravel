{{-- Estilos de los documentos A4 que se entregan al cliente. Línea de la marca: negro, verde lima, píldoras y cajas
     redondeadas. dompdf: sin flexbox ni grid; las columnas se arman con tablas. --}}
<style>
  @page { margin: 34px 40px 58px; }

  body { font-family: Helvetica, Arial, sans-serif; font-size: 9.5px; line-height: 1.4; color: #0d0d0d; }
  table { width: 100%; border-collapse: collapse; }
  td, th { vertical-align: top; padding: 0; text-align: left; font-weight: normal; }
  p { margin: 0; }
  .gris { color: #5f6368; }
  .der { text-align: right; }
  .nowrap { white-space: nowrap; }
  .ico { width: 11px; height: 11px; vertical-align: -2px; margin-right: 4px; }

  /* Encabezado */
  .sello { width: 74px; height: 74px; background: #c8f902; text-align: center; }
  .sello img { height: 52px; margin-top: 11px; }
  .marca { padding-left: 12px; }
  .marca .nombre { font-size: 25px; line-height: .95; letter-spacing: -.5px; }
  .marca .nombre b { font-weight: bold; }
  .marca .dato { font-size: 8.6px; color: #2b2b2b; margin-top: 2px; }
  .ficha { width: 214px; background: #0d0d0d; color: #fff; border-radius: 16px; padding: 12px 16px; }
  .ficha .tipo { font-size: 10px; font-weight: bold; letter-spacing: 1.2px; color: #c8f902; }
  .ficha .codigo { font-size: 23px; font-weight: bold; line-height: 1.15; }
  .ficha .cuando { font-size: 9px; color: #d6d6d6; }

  /* Tarjetas con los datos de la venta */
  .tarjetas { margin-top: 16px; }
  .tarjeta { border: 1px solid #0d0d0d; border-radius: 14px; padding: 9px 12px; }
  .tarjeta .rotulo { font-size: 8.4px; color: #5f6368; }
  .tarjeta .valor { font-size: 11px; font-weight: bold; line-height: 1.25; }
  .hueco-col { width: 10px; }
  .bola { width: 22px; height: 22px; background: #c8f902; border-radius: 11px; text-align: center; }
  .bola img { width: 13px; height: 13px; margin-top: 4.5px; }

  /* Títulos en píldora */
  .pildora { display: inline-block; background: #0d0d0d; color: #fff; font-size: 9.6px; font-weight: bold; letter-spacing: .9px;
    border-radius: 11px; padding: 4px 16px 4px 13px; margin: 16px 0 7px; }

  /* Productos: una ficha por cada uno */
  .ficha-producto { border: 1px solid #0d0d0d; border-radius: 18px; padding: 13px 15px 12px; margin-bottom: 9px; page-break-inside: avoid; }
  .cuadro { width: 36px; height: 36px; background: #c8f902; border-radius: 11px; text-align: center; }
  .cuadro img { width: 21px; height: 21px; margin-top: 7.5px; }
  .producto { font-size: 15px; font-weight: bold; line-height: 1.15; letter-spacing: -.2px; }
  .importe { width: 150px; text-align: right; font-size: 15px; font-weight: bold; white-space: nowrap; vertical-align: middle; }
  .importe .detalle { font-size: 8.4px; font-weight: normal; color: #5f6368; }
  .mosaicos { margin-top: 7px; }
  .mosaicos td { padding-right: 7px; }
  .mosaicos td td { padding-right: 0; }
  .mosaico { background: #f3f3f3; border-radius: 13px; padding: 8px 10px; }
  .aro { width: 26px; height: 26px; background: #fff; border-radius: 13px; text-align: center; }
  .aro img { width: 16px; height: 16px; margin-top: 5px; }
  .mosaico .rotulo { font-size: 8.2px; color: #5f6368; line-height: 1.2; }
  .mosaico .valor { font-size: 12.5px; font-weight: bold; line-height: 1.2; }
  .bandas { margin-top: 9px; }
  .banda { border: 1px solid #0d0d0d; border-radius: 11px; padding: 7px 12px; font-size: 10px; }
  .banda.lima { background: #c8f902; border-color: #c8f902; font-size: 11px; }
  .banda .ico { width: 13px; height: 13px; vertical-align: -3px; margin-right: 6px; }
  .ident { display: inline-block; margin-right: 18px; white-space: nowrap; }
  .ident b { font-size: 11px; font-weight: bold; letter-spacing: .5px; }

  /* Resumen de la garantía en la primera hoja */
  .resumen .bloque { border: 1px solid #0d0d0d; border-radius: 16px; padding: 11px 13px 7px; font-size: 9.2px; line-height: 1.5; min-height: 134px; }
  .bloque-titulo { font-size: 10.5px; font-weight: bold; margin-bottom: 4px; }
  .bloque-titulo .ico { width: 13px; height: 13px; vertical-align: -3px; margin-right: 5px; }
  .resumen ul { margin: 0 0 4px; padding-left: 13px; }
  .resumen li { margin-bottom: 1.5px; }

  /* Totales */
  .cierre { margin-top: 8px; }
  .letras { font-size: 9.4px; padding-right: 18px; }
  .letras b { font-weight: bold; }
  .totales { width: 250px; }
  .totales td { padding: 3px 4px; }
  .total { background: #0d0d0d; color: #fff; border-radius: 13px; padding: 9px 16px; margin-top: 5px; }
  .total td { font-size: 11px; font-weight: bold; vertical-align: middle; }
  .total .monto { font-size: 17px; color: #c8f902; text-align: right; white-space: nowrap; }

  /* Notas de la venta (texto con formato) y secciones de la garantía */
  .texto { border: 1px solid #0d0d0d; border-radius: 16px; padding: 9px 15px 6px; font-size: 9px; line-height: 1.45; }
  .texto h2, .texto h3, .texto h4 { font-size: 10px; margin: 0 0 4px; }
  .texto p { margin: 0 0 4px; }
  .texto ul, .texto ol { margin: 0 0 4px; padding-left: 15px; }
  .texto li { margin: 0 0 1px; }
  .texto a { color: #0d0d0d; }

  /* Firmas */
  .firmas { margin-top: 14px; page-break-inside: avoid; }
  .firmas.holgada { margin-top: 44px; }
  .firmas td { width: 50%; text-align: center; padding: 0 20px; }
  .firmas .trazo { height: 60px; vertical-align: bottom; }
  .firmas .trazo img { height: 56px; }
  .firmas .raya { border-top: 1px solid #0d0d0d; padding-top: 5px; font-weight: bold; }

  /* Hoja de garantía */
  .salto { page-break-before: always; }
  .g-titulo { font-size: 21px; font-weight: bold; letter-spacing: -.2px; line-height: 1.1; }
  .g-intro { font-size: 10.5px; margin-top: 4px; }
  .cobertura th { font-size: 8.4px; color: #5f6368; padding: 5px 0; border-bottom: 1px solid #0d0d0d; }
  .cobertura td { padding: 6px 0; border-bottom: 1px solid #dcdcdc; font-size: 9.6px; }
  .cobertura tr.ultima td { border-bottom: 0; }
  .columna { width: 50%; }
  .garantia .pildora { font-size: 10px; margin: 20px 0 8px; padding: 5px 17px 5px 13px; }
  .garantia .texto { font-size: 10.2px; line-height: 1.55; padding: 12px 17px 8px; }
  .garantia .texto li { margin-bottom: 2px; }
  .gracias { font-size: 26px; font-weight: bold; letter-spacing: -.6px; margin-top: 18px; }

  /* Pie en todas las páginas */
  .pie { position: fixed; bottom: -40px; left: 0; right: 0; background: #0d0d0d; color: #fff; border-radius: 13px; padding: 7px 18px; font-size: 8.6px; }
  .pie td { vertical-align: middle; }
  .pie .ico { margin-right: 5px; }
</style>
