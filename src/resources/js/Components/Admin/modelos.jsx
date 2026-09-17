import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import ModeloVisual from '@/Components/Store/ModeloVisual';

// Piezas de «Modelos y fotos» (Tienda online): la guía de la foto, los ejemplos y la revisión del archivo antes de
// subirlo. La foto alimenta la comparativa pública (/comparar/iphone, /comparar/mac, /comparar/apple…); la tarjeta es vertical 5:6.

export const RECOMENDADO = { ancho: 1200, alto: 1440 };

/** Qué pedir de cada foto. Se muestra en la pantalla del modelo y en docs/admin-ui/guia-fotos-modelos.md. */
const PRIMERO = {
  celular: { titulo: 'El dorso del equipo', texto: 'De frente y en vertical, que se vean bien las cámaras. Un solo equipo por foto.' },
  computadora: { titulo: 'La computadora de frente', texto: 'Abierta y de frente, con la pantalla a la vista y el teclado apenas visible. Un solo equipo por foto.' },
  producto_apple: { titulo: 'El producto de frente', texto: 'Fuera de su caja, de frente y centrado: el iPad y el Apple Watch con la pantalla a la vista. Un solo producto por foto.' },
  producto_general: { titulo: 'El accesorio de frente', texto: 'Fuera de su caja, de frente y centrado. Un solo accesorio por foto: se usa para todos los artículos de ese tipo.' },
};
export const requisitosFoto = (tipo) => [PRIMERO[tipo] ?? PRIMERO.celular, ...REQUISITOS_FOTO];
export const REQUISITOS_FOTO = [
  { titulo: 'Fondo transparente o blanco liso', texto: 'Sin mesa, manos, sombras fuertes ni reflejos. Lo ideal es un PNG sin fondo.' },
  { titulo: 'Vertical 5:6', texto: `Ideal ${RECOMENDADO.ancho} × ${RECOMENDADO.alto} px (mínimo 600 px por lado), con el equipo centrado y ocupando unas tres cuartas partes del alto.` },
  { titulo: 'JPG, PNG o WebP', texto: 'Hasta 10 MB. La tienda la convierte a WebP y la achica sola.' },
  { titulo: 'Todas iguales', texto: 'Mismo ángulo y encuadre en todos los modelos: así la comparativa se ve ordenada.' },
  { titulo: 'Sin textos ni marcas', texto: 'Nada de precios, logos, marcas de agua ni stickers. Usa fotos propias o con permiso de uso.' },
];

/** Ejemplos dibujados: así sí y los errores más comunes. Usan la misma ilustración del modelo. */
export function EjemplosFoto({ modelo }) {
  const base = { nombre: modelo.nombre, visual: modelo.visual, imagen: null };
  const tipo = modelo.tipo ?? 'celular';
  const ejemplos = [
    { ok: true, titulo: 'Así sí', texto: { computadora: 'De frente, abierta y centrada', producto_apple: 'De frente y centrado', producto_general: 'De frente y centrado' }[tipo] ?? 'Dorso, vertical y centrado', estilo: {} },
    { ok: false, titulo: 'Inclinada', texto: 'De costado o girada', estilo: { transform: 'rotate(-16deg) scale(0.92)' } },
    { ok: false, titulo: 'Con fondo o texto', texto: 'Mesa, sombras o precios', fondo: true },
    { ok: false, titulo: 'Recortada', texto: 'Muy cerca o cortada', estilo: { transform: 'scale(1.75) translateY(12%)' } },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ejemplos.map((e) => {
        const Icono = e.ok ? CheckCircle2 : XCircle;
        return (
          <figure key={e.titulo} className="min-w-0">
            <div className={`relative aspect-[5/6] overflow-hidden rounded-xl ring-2 ${e.ok ? 'ring-emerald-400' : 'ring-rose-200'}`}
              style={e.fondo ? { background: 'repeating-linear-gradient(135deg, #D9C7A7 0 14px, #CDB896 14px 28px)' } : undefined}>
              <div className="h-full w-full" style={e.estilo}>
                <ModeloVisual modelo={base} tipo={tipo} className="h-full w-full" fondo={!e.fondo} />
              </div>
              {e.fondo && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rotate-[-4deg] rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">¡OFERTA!</span>
              )}
            </div>
            <figcaption className="mt-2 flex items-start gap-1.5">
              <Icono className={`mt-px h-4 w-4 shrink-0 ${e.ok ? 'text-emerald-600' : 'text-rose-500'}`} />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900">{e.titulo}</span>
                <span className="block text-[11px] leading-snug text-slate-500">{e.texto}</span>
              </span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function ListaRequisitos({ tipo = 'celular' }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {requisitosFoto(tipo).map((r, i) => (
        <li key={r.titulo} className="flex gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#011446] text-[11px] font-bold text-white">{i + 1}</span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-slate-900">{r.titulo}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">{r.texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Lee la imagen elegida en el navegador: medidas y cómo es el fondo (mira las esquinas). */
export function analizarImagen(archivo) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 60;
      lienzo.height = 72;
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      let fondo = 'otro';
      try {
        ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        const esquinas = [[1, 1], [lienzo.width - 2, 1], [1, lienzo.height - 2], [lienzo.width - 2, lienzo.height - 2]]
          .map(([x, y]) => ctx.getImageData(x, y, 1, 1).data);
        if (esquinas.every((p) => p[3] < 24)) fondo = 'transparente';
        else if (esquinas.every((p) => p[3] > 230 && p[0] > 235 && p[1] > 235 && p[2] > 235)) fondo = 'blanco';
      } catch { /* sin lienzo: no se revisa el fondo */ }
      resolve({ url, ancho: img.naturalWidth, alto: img.naturalHeight, fondo });
    };
    img.onerror = () => resolve({ url, ancho: 0, alto: 0, fondo: 'otro', ilegible: true });
    img.src = url;
  });
}

/** Revisión de la foto elegida, antes de subirla: lo que impide guardarla (error) y lo que conviene mejorar (aviso). */
export function revisarFoto(archivo, info, { maxKb, minLado }) {
  const tipos = ['image/jpeg', 'image/png', 'image/webp'];
  const puntos = [];

  puntos.push(tipos.includes(archivo.type)
    ? { tono: 'ok', texto: `Formato ${archivo.type.replace('image/', '').toUpperCase()}` }
    : { tono: 'error', texto: 'Formato no permitido: usa JPG, PNG o WebP' });

  const kb = archivo.size / 1024;
  puntos.push(kb <= maxKb
    ? { tono: 'ok', texto: `Pesa ${kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.round(kb)} KB`}` }
    : { tono: 'error', texto: 'Pesa más de 10 MB: expórtala más liviana' });

  if (info.ilegible) {
    puntos.push({ tono: 'error', texto: 'No se pudo leer la imagen' });
    return puntos;
  }

  const medidas = `${info.ancho} × ${info.alto} px`;
  if (info.ancho < minLado || info.alto < minLado) puntos.push({ tono: 'error', texto: `${medidas}: muy chica (mínimo ${minLado} px por lado)` });
  else if (info.ancho < RECOMENDADO.ancho * 0.8 || info.alto < RECOMENDADO.alto * 0.8) puntos.push({ tono: 'aviso', texto: `${medidas}: sirve, pero en pantallas grandes se verá menos nítida` });
  else puntos.push({ tono: 'ok', texto: medidas });

  const proporcion = info.ancho / info.alto;
  if (proporcion > 1) puntos.push({ tono: 'aviso', texto: 'Es horizontal: el equipo se verá chico. Mejor una foto vertical 5:6' });
  else if (proporcion < 0.7 || proporcion > 0.95) puntos.push({ tono: 'aviso', texto: 'No es 5:6: quedará más margen arriba y abajo o a los costados' });
  else puntos.push({ tono: 'ok', texto: 'Vertical, cerca de 5:6' });

  if (info.fondo === 'transparente') puntos.push({ tono: 'ok', texto: 'Fondo transparente' });
  else if (info.fondo === 'blanco') puntos.push({ tono: 'ok', texto: 'Fondo blanco' });
  else puntos.push({ tono: 'aviso', texto: 'El fondo no parece liso: mejor transparente o blanco' });

  return puntos;
}

const TONOS_PUNTO = {
  ok: { icon: CheckCircle2, clase: 'text-emerald-600' },
  aviso: { icon: AlertTriangle, clase: 'text-amber-500' },
  error: { icon: XCircle, clase: 'text-rose-600' },
  info: { icon: Info, clase: 'text-[#585E9F]' },
};

export function PuntosRevision({ puntos }) {
  return (
    <ul className="space-y-2">
      {puntos.map((p) => {
        const t = TONOS_PUNTO[p.tono] ?? TONOS_PUNTO.info;
        const Icon = t.icon;
        return (
          <li key={p.texto} className="flex items-start gap-2 text-[13px] leading-snug text-slate-700">
            <Icon className={`mt-px h-4 w-4 shrink-0 ${t.clase}`} /> {p.texto}
          </li>
        );
      })}
    </ul>
  );
}
