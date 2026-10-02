import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ChevronDown, MessageCircle } from '@/Components/Store/Icons';

// La portada de servicio técnico: un iPhone que se desarma al bajar y se vuelve a armar al final, como las páginas de
// producto de Apple. La sección queda fija mientras se recorre y el scroll elige el cuadro de una secuencia de imágenes
// (public/images/servicio/secuencia) que se dibuja en un <canvas>. Con «reducir movimiento» no se fija nada: se muestra
// el equipo desarmado, quieto, con la lista de piezas.

// Dos juegos de cuadros (armado → desarmado): el de escritorio y uno más liviano para celulares
const SERIES = {
  grande: { carpeta: 'secuencia', lado: 1080, cuadros: 121 },
  chico: { carpeta: 'secuencia-m', lado: 600, cuadros: 61 },
};
const ruta = (i, carpeta) => `/images/servicio/${carpeta}/${String(i).padStart(3, '0')}.webp`;

// En qué parte del recorrido pasa cada cosa (0 = arriba de la sección, 1 = el final)
const ABRE = [0.07, 0.44];
const PIEZAS = [0.46, 0.80];
const CIERRA = [0.82, 0.96];

// La posición dentro de la secuencia, con decimales: 12,4 es el cuadro 12 con un 40 % del 13 encima. Cada tramo arranca
// y frena suave, y entre cuadro y cuadro se funde, así el movimiento no va a saltos.
const suave = (t) => t * t * (3 - 2 * t);

function posicionDe(p, cuadros) {
  const ultimo = cuadros - 1;
  if (p <= ABRE[0]) return 0;
  if (p < ABRE[1]) return suave((p - ABRE[0]) / (ABRE[1] - ABRE[0])) * ultimo;
  if (p <= CIERRA[0]) return ultimo;
  if (p < CIERRA[1]) return (1 - suave((p - CIERRA[0]) / (CIERRA[1] - CIERRA[0]))) * ultimo;
  return 0;
}

// En qué orden se piden los cuadros: primero uno de cada ocho, para que la secuencia entera se pueda recorrer enseguida,
// y después los del medio
const ordenDe = (cuadros) => [8, 4, 2, 1].flatMap((paso, n) => Array.from({ length: cuadros }, (_, i) => i).filter((i) => i % paso === 0 && (n === 0 || i % (paso * 2) !== 0)));

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
  const dibujado = useRef(null);
  const serie = useRef(SERIES.grande);
  const [activa, setActiva] = useState(-1);
  const [tramo, setTramo] = useState('portada');   // qué texto está a la vista: solo ese recibe los clics

  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });

  // El scroll con inercia: la rueda del mouse avanza a saltos y esto los convierte en un movimiento continuo
  const recorrido = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.6, restDelta: 0.0002 });

  const lista = (i) => { const img = imagenes.current[i]; return img?.complete && img.naturalWidth ? img : null; };

  const dibujar = (pos) => {
    const ctx = lienzo.current?.getContext('2d');
    if (!ctx) return;
    const [w, h] = [lienzo.current.width, lienzo.current.height];
    const base = Math.floor(pos);
    const { cuadros } = serie.current;
    const [a, b, mezcla] = [lista(base), lista(Math.min(cuadros - 1, base + 1)), pos - base];

    if (a && b) {
      // Los dos cuadros vecinos ya están: se funde uno con el otro
      ctx.globalAlpha = 1;
      ctx.drawImage(a, 0, 0, w, h);
      if (mezcla > 0.01 && b !== a) { ctx.globalAlpha = mezcla; ctx.drawImage(b, 0, 0, w, h); ctx.globalAlpha = 1; }
      dibujado.current = pos;
      return;
    }

    // Todavía están bajando: el más cercano que haya
    for (let d = 0; d < cuadros; d += 1) {
      const img = lista(Math.round(pos) - d) ?? lista(Math.round(pos) + d);
      if (img) { if (dibujado.current !== img) { ctx.drawImage(img, 0, 0, w, h); dibujado.current = img; } return; }
    }
  };

  useEffect(() => {
    if (quieto) return undefined;
    serie.current = window.matchMedia('(max-width: 640px)').matches ? SERIES.chico : SERIES.grande;
    const { carpeta, lado, cuadros } = serie.current;
    lienzo.current.width = lienzo.current.height = lado;

    imagenes.current = [];
    ordenDe(cuadros).forEach((i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => dibujar(posicionDe(recorrido.get(), cuadros));
      img.src = ruta(i, carpeta);
      imagenes.current[i] = img;
    });

    return () => { imagenes.current.forEach((img) => { if (img) img.onload = null; }); imagenes.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quieto]);

  useMotionValueEvent(recorrido, 'change', (p) => dibujar(posicionDe(p, serie.current.cuadros)));

  // Los textos siguen al scroll real, sin inercia
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
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
          <img src={ruta(SERIES.grande.cuadros - 1, SERIES.grande.carpeta)} alt="Un iPhone desarmado: pantalla, batería, placa, cámaras y carcasa" className="w-full" />
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
