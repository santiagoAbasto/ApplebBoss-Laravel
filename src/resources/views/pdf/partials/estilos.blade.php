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
  .sello { width: 66px; height: 66px; background: #c8f902; text-align: center; }
  .sello img { height: 46px; margin-top: 10px; }
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

  /* Productos */
  .caja { border: 1px solid #0d0d0d; border-radius: 16px; padding: 3px 14px; }
  .lineas td { padding: 9px 0; border-bottom: 1px solid #dcdcdc; }
  .lineas tr.ultima td { border-bottom: 0; }
  .lineas .ic { width: 36px; }
  .cuadro { width: 27px; height: 27px; background: #f1f1f1; border-radius: 8px; text-align: center; }
  .cuadro img { width: 16px; height: 16px; margin-top: 5.5px; }
  .producto { font-size: 11.5px; font-weight: bold; }
  .chip { display: inline-block; background: #f1f1f1; border-radius: 8px; padding: 1.5px 8px; margin: 3px 4px 0 0; font-size: 8.8px; white-space: nowrap; }
  .chip.lima { background: #c8f902; font-weight: bold; }
  .ident { display: inline-block; margin: 5px 14px 0 0; font-size: 9.6px; white-space: nowrap; }
  .ident b { font-weight: bold; letter-spacing: .3px; }
  .importe { width: 104px; text-align: right; font-size: 11.5px; font-weight: bold; white-space: nowrap; }
  .importe .detalle { font-size: 8.4px; font-weight: normal; color: #5f6368; }

  /* Totales */
  .cierre { margin-top: 12px; }
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
