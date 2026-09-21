{{-- Estilos comunes de los documentos A4 que se entregan al cliente. dompdf: sin flexbox ni grid. --}}
<style>
  @page { margin: 38px 42px 64px; }

  body { font-family: Helvetica, Arial, sans-serif; font-size: 9.5px; line-height: 1.4; color: #111c2d; }
  table { width: 100%; border-collapse: collapse; }
  td, th { vertical-align: top; padding: 0; text-align: left; font-weight: normal; }
  p { margin: 0; }
  .gris { color: #5d6a7c; }
  .der { text-align: right; }
  .nowrap { white-space: nowrap; }

  /* Encabezado */
  .marca img { height: 50px; }
  .marca .nombre { font-size: 15px; font-weight: bold; color: #01295c; letter-spacing: .4px; padding-top: 6px; }
  .doc .titulo { font-size: 21px; font-weight: bold; color: #01295c; line-height: 1.1; }
  .doc .codigo { font-size: 12px; font-weight: bold; margin-top: 5px; }
  .filete { border-top: 2px solid #01295c; margin-top: 14px; }

  /* Datos de la venta */
  .datos td { width: 25%; padding: 11px 12px 11px 0; border-bottom: 1px solid #d9dee6; }
  .datos .valor { font-size: 10.5px; font-weight: bold; margin-top: 1px; }

  /* Productos */
  .seccion { font-size: 11px; font-weight: bold; color: #01295c; margin: 18px 0 2px; }
  .lineas th { font-size: 8px; color: #5d6a7c; padding: 6px 0; border-bottom: 1px solid #01295c; }
  .lineas td { padding: 9px 0; border-bottom: 1px solid #e4e8ee; }
  .lineas .n { width: 22px; color: #5d6a7c; }
  .lineas .importe { width: 96px; text-align: right; font-size: 10.5px; font-weight: bold; white-space: nowrap; }
  .producto { font-size: 11px; font-weight: bold; }
  .par { display: inline-block; margin: 3px 14px 0 0; white-space: nowrap; }
  .par b { font-weight: bold; }
  .ident { font-size: 10px; letter-spacing: .3px; }

  /* Totales */
  .totales { width: 48%; margin: 12px 0 0 52%; }
  .totales td { padding: 5px 0; }
  .totales .total td { background: #01295c; color: #fff; font-size: 12.5px; font-weight: bold; padding: 9px 10px; }

  /* Notas y garantía */
  .notas { margin-top: 20px; padding: 12px 14px; background: #f3f5f8; font-size: 8.6px; line-height: 1.5; color: #2c3748; page-break-inside: auto; }
  .notas h2, .notas h3, .notas h4 { font-size: 10.5px; color: #01295c; margin: 0 0 6px; }
  .notas p { margin: 0 0 5px; text-align: justify; }
  .notas ul, .notas ol { margin: 0 0 6px; padding-left: 14px; }
  .notas li { margin: 0 0 1px; }
  .notas a { color: #01295c; }

  /* Firmas */
  .firmas { margin-top: 26px; page-break-inside: avoid; }
  .firmas td { width: 50%; text-align: center; padding: 0 18px; }
  .firmas .hueco { height: 78px; vertical-align: bottom; }
  .firmas .hueco img { height: 74px; }
  .firmas .raya { border-top: 1px solid #111c2d; padding-top: 5px; font-weight: bold; }

  /* Pie en todas las páginas */
  .pie { position: fixed; bottom: -44px; left: 0; right: 0; border-top: 1px solid #d9dee6; padding-top: 7px; font-size: 8px; color: #5d6a7c; }
</style>
