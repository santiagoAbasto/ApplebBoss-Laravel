import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight, ChevronDown, MessageCircle } from '@/Components/Store/Icons';

// La portada de servicio técnico: un iPhone que se desarma al bajar y se vuelve a armar al final, como las páginas de
// producto de Apple. La sección queda fija mientras se recorre y el scroll elige el cuadro de una secuencia de imágenes
// (public/images/servicio/secuencia) que se dibuja en un <canvas>. Con «reducir movimiento» no se fija nada: se muestra
// el equipo desarmado, quieto, con la lista de piezas.

const CUADROS = 74;                       // 000.webp … 073.webp: armado → desarmado
const LADO = { grande: 1080, chico: 600 };
const ruta = (i, carpeta) => `/images/servicio/${carpeta}/${String(i).padStart(3, '0')}.webp`;

// En qué parte del recorrido pasa cada cosa (0 = arriba de la sección, 1 = el final)
const ABRE = [0.07, 0.44];
const PIEZAS = [0.46, 0.80];
const CIERRA = [0.82, 0.96];

function cuadroDe(p) {
  const ultimo = CUADROS - 1;
  if (p <= ABRE[0]) return 0;
  if (p < ABRE[1]) return Math.round(((p - ABRE[0]) / (ABRE[1] - ABRE[0])) * ultimo);
  if (p <= CIERRA[0]) return ultimo;
  if (p < CIERRA[1]) return Math.round((1 - (p - CIERRA[0]) / (CIERRA[1] - CIERRA[0])) * ultimo);
  return 0;
}

// Qué texto está a la vista en cada parte del recorrido
const tramoDe = (p) => {
  if (p < ABRE[0]) return 'portada';
  if (p >= PIEZAS[0] - 0.03 && p <= PIEZAS[1]) return 'piezas';
  if (p >= CIERRA[1] - 0.03) return 'cierre';
  return null;
};

const piezaDe = (p, total) => (p < PIEZAS[0] || p > PIEZAS[1] ? -1 : Math.min(total - 1, Math.floor(((p - PIEZAS[0]) / (PIEZAS[1] - PIEZAS[0])) * total)));

function Botones({ waUrl }) {
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <a href="#solicitud" className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-bold transition-opacity hover:opacity-90"
        style={{ background: 'var(--ab-lime)', color: 'var(--ab-navy)' }}>
        Pedir la revisión <ArrowRight className="h-4 w-4" />
      </a>
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10">
          <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
        </a>
      )}
    </div>
  );
}

function Portada({ titulo, bajada, waUrl }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ab-lime)' }}>Servicio técnico</p>
      <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">{titulo}</h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">{bajada}</p>
      <Botones waUrl={waUrl} />
    </>
  );
}

function ListaDePiezas({ piezas, activa }) {
  return (
    <ol className="space-y-1">
      {piezas.map((pieza, i) => {
        const encendida = activa === i || activa === null;
        return (
          <li key={pieza.titulo} className="border-l-2 py-1.5 pl-4 transition-all duration-300"
            style={{ borderColor: activa === i ? 'var(--ab-lime)' : 'rgba(255,255,255,0.16)', opacity: encendida ? 1 : 0.38 }}>
            <p className="text-lg font-extrabold text-white sm:text-xl">{pieza.titulo}</p>
            <p className={`overflow-hidden text-sm leading-relaxed text-white/75 transition-all duration-300 ${activa === i || activa === null ? 'max-h-24' : 'max-h-0'}`}>
              {pieza.texto}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export default function SecuenciaDesarme({ titulo, bajada, piezas = [], tituloPiezas, waUrl = null }) {
  const quieto = useReducedMotion();
  const seccion = useRef(null);
  const lienzo = useRef(null);
  const imagenes = useRef([]);
  const dibujado = useRef(-1);
  const [activa, setActiva] = useState(-1);
  const [tramo, setTramo] = useState('portada');   // qué texto está a la vista: solo ese recibe los clics

  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });

  // Dibuja el cuadro pedido o, si todavía no bajó, el más cercano que ya esté
  const dibujar = (i) => {
    const ctx = lienzo.current?.getContext('2d');
    if (!ctx) return;
    let img = null;
    for (let d = 0; d < CUADROS && !img; d += 1) {
      img = [imagenes.current[i - d], imagenes.current[i + d]].find((x) => x?.complete && x.naturalWidth) ?? null;
    }
    if (!img || dibujado.current === img) return;
    dibujado.current = img;
    ctx.drawImage(img, 0, 0, lienzo.current.width, lienzo.current.height);
  };

  useEffect(() => {
    if (quieto) return undefined;
    const chico = window.matchMedia('(max-width: 640px)').matches;
    const carpeta = chico ? 'secuencia-m' : 'secuencia';
    lienzo.current.width = lienzo.current.height = chico ? LADO.chico : LADO.grande;

    imagenes.current = Array.from({ length: CUADROS }, (_, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => dibujar(cuadroDe(scrollYProgress.get()));
      img.src = ruta(i, carpeta);
      return img;
    });

    return () => { imagenes.current.forEach((img) => { img.onload = null; }); imagenes.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quieto]);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    dibujar(cuadroDe(p));
    const pieza = piezaDe(p, piezas.length);
    setActiva((antes) => (antes === pieza ? antes : pieza));
    setTramo(tramoDe(p));
  });

  // Cada texto aparece y se va con una transición propia: el scroll solo decide cuál toca
  const turno = (cual) => ({ opacity: tramo === cual ? 1 : 0, pointerEvents: tramo === cual ? 'auto' : 'none', transition: 'opacity 450ms ease' });

  // Sin movimiento: el equipo desarmado y la lista, uno debajo del otro
  if (quieto) {
    return (
      <section className="bg-black">
        <div className="mx-auto grid w-full max-w-[1224px] items-center gap-8 px-4 py-12 sm:px-7 md:px-10 lg:grid-cols-2">
          <div><Portada titulo={titulo} bajada={bajada} waUrl={waUrl} /></div>
          <img src={ruta(CUADROS - 1, 'secuencia')} alt="Un iPhone desarmado: pantalla, batería, placa, cámaras y carcasa" className="w-full" />
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-2xl font-black tracking-tight text-white">{tituloPiezas}</h2>
            <ListaDePiezas piezas={piezas} activa={null} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={seccion} className="relative bg-black" style={{ height: '420vh' }}>
      <div className="sticky overflow-hidden h-[calc(100vh-var(--alto-header,0px))] supports-[height:100svh]:h-[calc(100svh-var(--alto-header,0px))]"
        style={{ top: 'var(--alto-header, 0px)' }}>
        <div className="mx-auto grid h-full w-full max-w-[1224px] grid-rows-[auto_minmax(0,1fr)] px-4 sm:px-7 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:items-center lg:gap-6">

          {/* Los textos se turnan en el mismo lugar: la portada, las piezas y el cierre */}
          <div className="relative z-10 h-[46vh] pt-8 lg:h-[70vh] lg:pt-0">
            <div style={turno('portada')} className="absolute inset-x-0 top-8 lg:top-[15vh]">
              <Portada titulo={titulo} bajada={bajada} waUrl={waUrl} />
            </div>

            <div style={{ ...turno('piezas'), pointerEvents: 'none' }} className="absolute inset-x-0 top-6 lg:top-[12vh]">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest sm:mb-5" style={{ color: 'var(--ab-lime)' }}>{tituloPiezas}</h2>
              <ListaDePiezas piezas={piezas} activa={activa} />
            </div>

            <div style={turno('cierre')} className="absolute inset-x-0 top-8 lg:top-[18vh]">
              <p className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">Lo desarmamos, lo revisamos y lo volvemos a armar.</p>
              <Botones waUrl={waUrl} />
            </div>
          </div>

          <div className="relative flex min-h-0 items-center justify-center">
            <canvas ref={lienzo} role="img" aria-label="Un iPhone que se desarma por capas: pantalla, batería, placa, cámaras y carcasa"
              className="aspect-square h-full max-h-[min(86vh,100vw)] w-auto max-w-none lg:max-h-[min(84vh,56vw)]" />
          </div>
        </div>

        <p style={{ opacity: tramo === 'portada' ? 1 : 0, transition: 'opacity 300ms ease' }} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/60">
          Baja para desarmarlo <ChevronDown className="h-4 w-4" />
        </p>
      </div>
    </section>
  );
}
