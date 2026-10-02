import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight, ChevronDown, MessageCircle } from '@/Components/Store/Icons';

// La portada de servicio técnico: un iPhone 17 Pro Max naranja cósmico que se desarma con el scroll, pieza por pieza, y
// se vuelve a armar al final, como las páginas de producto de Apple. La sección queda fija mientras se recorre y el
// scroll manda: cada pieza tiene su tramo de recorrido, si el scroll se detiene la pieza se detiene, y si sube, vuelve.
//
// No es un video: son las seis piezas del equipo recortadas (public/images/servicio/piezas-2) y cada una se desliza
// rígida, de costado, desde su lugar dentro de la carcasa hasta su lugar en la fila. Así ninguna se deforma ni cambia
// de tamaño por el camino. Con «reducir movimiento» no se fija nada: se muestra el equipo desarmado, quieto.

// Las piezas, del fondo al frente, en píxeles de la imagen de origen (una fila de 2688 px de ancho). `x` e `y` son su
// lugar desarmada; `casa`, cuánto a la derecha del borde de la carcasa va cuando está colocada; `paso`, en qué paso
// del desarme sale, que es también el renglón de «Lo que más reparamos» que la nombra.
const CARPETA = '/images/servicio/piezas-2';
const PIEZAS_EQUIPO = [
  { id: 'carcasa', w: 529, h: 1269, x: 2044, y: 125, paso: 5 },
  { id: 'camaras', w: 340, h: 544, x: 1649, y: 228, casa: 160, paso: 4 },
  { id: 'puerto', w: 403, h: 208, x: 1150, y: 1093, casa: 62, paso: 3 },
  { id: 'placa', w: 404, h: 466, x: 1145, y: 219, casa: 30, paso: 2 },
  { id: 'bateria', w: 367, h: 719, x: 670, y: 500, casa: 80, paso: 1 },
  { id: 'pantalla', w: 477, h: 1233, x: 98, y: 146, casa: 25, paso: 0 },
];
const CARCASA = PIEZAS_EQUIPO[0];
const PANTALLA = PIEZAS_EQUIPO[PIEZAS_EQUIPO.length - 1];
const FILA = { centro: 1336, medio: 760 };   // el centro de la fila desarmada

// Cuánto del desarme se lleva cada paso: abrir el equipo (la pantalla) es el más largo; el último, la carcasa ya vacía,
// solo se señala. CORTES es dónde empieza y termina cada uno, de 0 a 1.
const PESOS = [1.5, 1, 1, 1, 1, 0.7];
const CORTES = PESOS.reduce((cortes, peso) => [...cortes, cortes[cortes.length - 1] + peso / PESOS.reduce((a, b) => a + b)], [0]);

// En qué parte del recorrido de la sección pasa cada cosa (0 = arriba, 1 = el final)
const DESARMA = [0.05, 0.68];
const ARMA = [0.77, 0.94];

const suave = (t) => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u); };
const entre = (a, b, t) => a + (b - a) * t;
const tramo01 = (p, [desde, hasta]) => Math.min(1, Math.max(0, (p - desde) / (hasta - desde)));

// Cuánto del desarme corresponde a cada punto del recorrido: 0 es armado y 1, desarmado del todo. Va derecho con el
// scroll: la suavidad la pone cada pieza al arrancar y al llegar.
const avanceDe = (p) => (p < ARMA[0] ? tramo01(p, DESARMA) : 1 - tramo01(p, ARMA));

// Cuánto lleva hecho un paso (0 a 1) y cuál es el que está en curso
const enPaso = (avance, n) => suave((avance - CORTES[n]) / (CORTES[n + 1] - CORTES[n]));
const pasoDe = (avance) => Math.max(0, CORTES.findIndex((corte) => avance < corte) - 1);

// La animación sigue al scroll con este retraso (en segundos): lo justo para que los saltos de la rueda no se noten
const SIGUE = 0.14;

// Dónde va cada pieza (borde izquierdo, en píxeles de origen) para un avance dado. Primero se separan la pantalla y el
// resto del equipo, cada uno hacia su punta de la fila; después las piezas salen de la carcasa de a una. `junta` acerca
// las piezas de la fila en pantallas angostas, donde no entran una al lado de la otra.
function lugares(avance, junta) {
  const final = (pieza) => FILA.centro + (pieza.x + pieza.w / 2 - FILA.centro) * junta - pieza.w / 2;
  const armada = FILA.centro - CARCASA.w / 2;
  const abre = enPaso(avance, 0);
  const carcasa = entre(armada, final(CARCASA), abre);

  return PIEZAS_EQUIPO.map((pieza) => {
    if (pieza === CARCASA) return carcasa;
    if (pieza === PANTALLA) return entre(armada + PANTALLA.casa, final(PANTALLA), abre);
    return entre(carcasa + pieza.casa, final(pieza), enPaso(avance, pieza.paso));
  });
}

// Qué texto está a la vista: la portada mientras está armado, la lista durante el desarme y el cierre al volver a armar
const tramoDe = (p, avance) => {
  if (p < ARMA[0]) return avance < 0.015 ? 'portada' : 'piezas';
  if (p >= ARMA[1] - 0.02 && avance < 0.05) return 'cierre';
  return null;
};

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

// `activa` es el renglón de la pieza que está saliendo; con `null` (equipo desarmado del todo) se leen todos.
function ListaDePiezas({ piezas, activa }) {
  return (
    <ol className="space-y-1">
      {piezas.map((pieza, i) => {
        const encendida = activa === i || activa === null;
        return (
          <li key={pieza.titulo} className="border-l-2 py-1.5 pl-4 transition-all duration-300"
            style={{ borderColor: activa === i ? 'var(--ab-lime)' : 'rgba(255,255,255,0.16)', opacity: encendida ? 1 : 0.38 }}>
            <p className="text-lg font-extrabold text-white sm:text-xl">{pieza.titulo}</p>
            <p className={`overflow-hidden text-sm leading-relaxed text-white/75 transition-all duration-300 ${activa === i ? 'max-h-24' : 'max-h-0'}`}>
              {pieza.texto}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

// Las piezas dibujadas. La que está saliendo queda encendida y las demás se apagan un poco.
function Equipo({ escena, capas, activa }) {
  return (
    <div ref={escena} role="img" aria-label="Un iPhone 17 Pro Max que se desarma: pantalla, batería, placa, puerto de carga, cámaras y carcasa"
      className="relative h-full min-h-0 w-full">
      {PIEZAS_EQUIPO.map((pieza, i) => (
        <div key={pieza.id} ref={(el) => { capas.current[i] = el; }} className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{ width: pieza.w, height: pieza.h }}>
          <img src={`${CARPETA}/${pieza.id}.webp`} alt="" width={pieza.w} height={pieza.h} draggable="false" decoding="async"
            className="block h-full w-full select-none transition-[filter] duration-300"
            style={{ filter: activa !== null && activa !== pieza.paso ? 'brightness(0.5)' : 'none' }} />
        </div>
      ))}
    </div>
  );
}

export default function SecuenciaDesarme({ titulo, bajada, piezas = [], tituloPiezas, waUrl = null }) {
  const quieto = useReducedMotion();
  const seccion = useRef(null);
  const escena = useRef(null);
  const capas = useRef([]);
  const [activa, setActiva] = useState(null);      // el paso en curso; null cuando no hay ninguno que señalar
  const [tramo, setTramo] = useState('portada');   // qué texto está a la vista: solo ese recibe los clics

  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });

  // Hasta dónde pide llegar el scroll (meta) y por dónde va la animación (avance)
  const estado = useRef({ p: 0, meta: 0, avance: 0, tiempo: 0, cuadro: 0 });

  // Pone cada pieza en su lugar para un avance dado. Armado, el equipo se ve grande; al abrirse la vista se aleja hasta
  // que entra la fila entera.
  const colocar = (avance) => {
    const caja = escena.current;
    if (!caja) return;
    const [ancho, alto] = [caja.clientWidth, caja.clientHeight];
    if (!ancho || !alto) return;

    const junta = ancho < 560 ? 0.6 : 0.92;
    const finales = lugares(1, junta);
    const fila = [finales[finales.length - 1], finales[0] + CARCASA.w];   // de la pantalla a la carcasa
    const lejos = Math.min(ancho / (fila[1] - fila[0] + 90), alto / (CARCASA.h + 130));
    const cerca = Math.min((alto * 0.9) / CARCASA.h, (ancho * 0.86) / CARCASA.w, lejos * 2);

    const aleja = enPaso(avance, 0);
    const escala = entre(cerca, lejos, aleja);
    const centro = entre(FILA.centro, (fila[0] + fila[1]) / 2, aleja);
    const x = lugares(avance, junta);

    PIEZAS_EQUIPO.forEach((pieza, i) => {
      const capa = capas.current[i];
      if (!capa) return;
      capa.style.transform = `translate3d(${ancho / 2 + (x[i] - centro) * escala}px, ${alto / 2 + (pieza.y - FILA.medio) * escala}px, 0) scale(${escala})`;
      // Armado solo se ve la pantalla: lo de adentro aparece recién cuando empieza a abrirse
      capa.style.opacity = pieza === PANTALLA ? 1 : Math.min(1, avance / 0.02);
    });
  };

  const textos = () => {
    const { p, avance } = estado.current;
    const cual = tramoDe(p, avance);
    // Desarmado del todo no se señala ninguna: se lee la lista entera
    const paso = cual === 'piezas' && avance < 0.999 ? pasoDe(avance) : null;
    setTramo((antes) => (antes === cual ? antes : cual));
    setActiva((antes) => (antes === paso ? antes : paso));
  };

  // Un paso de la animación: alcanza al scroll con un retraso corto y mueve las piezas a donde quedó
  const paso = (ahora) => {
    const e = estado.current;
    const dt = Math.min(0.05, Math.max(0.001, (ahora - e.tiempo) / 1000));
    e.tiempo = ahora;

    e.avance += (e.meta - e.avance) * (1 - Math.exp(-dt / SIGUE));
    const llego = Math.abs(e.meta - e.avance) < 0.0004;
    if (llego) e.avance = e.meta;

    colocar(e.avance);
    textos();
    e.cuadro = llego ? 0 : requestAnimationFrame(paso);
  };

  const andar = () => {
    const e = estado.current;
    if (e.cuadro) return;
    e.tiempo = performance.now();
    e.cuadro = requestAnimationFrame(paso);
  };

  useEffect(() => {
    const e = estado.current;
    // Sin movimiento queda desarmado. Si la página se abre ya bajada, arranca donde corresponde, sin animar hasta ahí.
    e.p = quieto ? 0 : scrollYProgress.get();
    e.meta = e.avance = quieto ? 1 : avanceDe(e.p);
    colocar(e.avance);
    if (!quieto) textos();

    const alCambiarTamano = new ResizeObserver(() => colocar(estado.current.avance));
    if (escena.current) alCambiarTamano.observe(escena.current);

    return () => {
      alCambiarTamano.disconnect();
      cancelAnimationFrame(estado.current.cuadro);
      estado.current.cuadro = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quieto]);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (quieto) return;
    estado.current.p = p;
    estado.current.meta = avanceDe(p);
    andar();
  });

  // Cada texto aparece y se va con una transición propia: el scroll solo decide cuál toca
  const turno = (cual) => ({ opacity: tramo === cual ? 1 : 0, pointerEvents: tramo === cual ? 'auto' : 'none', transition: 'opacity 450ms ease' });

  // Sin movimiento: el equipo desarmado y la lista, uno debajo del otro
  if (quieto) {
    return (
      <section className="bg-black">
        <div className="mx-auto w-full max-w-[1224px] px-4 py-12 sm:px-7 md:px-10">
          <Portada titulo={titulo} bajada={bajada} waUrl={waUrl} />
          <div className="mt-10 h-[46vh] min-h-[280px]"><Equipo escena={escena} capas={capas} activa={null} /></div>
          <h2 className="mb-4 mt-10 text-2xl font-black tracking-tight text-white">{tituloPiezas}</h2>
          <ol className="space-y-3">
            {piezas.map((pieza) => (
              <li key={pieza.titulo} className="border-l-2 border-white/20 pl-4">
                <p className="text-lg font-extrabold text-white">{pieza.titulo}</p>
                <p className="text-sm leading-relaxed text-white/75">{pieza.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section ref={seccion} className="relative bg-black" style={{ height: '700vh' }}>
      <div className="sticky overflow-hidden h-[calc(100vh-var(--alto-header,0px))] supports-[height:100svh]:h-[calc(100svh-var(--alto-header,0px))]"
        style={{ top: 'var(--alto-header, 0px)' }}>
        <div className="mx-auto grid h-full w-full max-w-[1224px] grid-rows-[auto_minmax(0,1fr)] px-4 sm:px-7 md:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:grid-rows-1 lg:items-center lg:gap-6">

          {/* Los textos se turnan en el mismo lugar: la portada, las piezas y el cierre */}
          <div className="relative z-10 h-[46vh] pt-8 lg:h-[70vh] lg:pt-0">
            <div style={turno('portada')} className="absolute inset-x-0 top-8 lg:top-[13vh] lg:w-[130%]">
              <Portada titulo={titulo} bajada={bajada} waUrl={waUrl} />
            </div>

            <div style={{ ...turno('piezas'), pointerEvents: 'none' }} className="absolute inset-x-0 top-6 lg:top-[12vh]">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest sm:mb-5" style={{ color: 'var(--ab-lime)' }}>{tituloPiezas}</h2>
              <ListaDePiezas piezas={piezas} activa={activa} />
            </div>

            <div style={turno('cierre')} className="absolute inset-x-0 top-8 lg:top-[18vh] lg:w-[130%]">
              <p className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">Lo desarmamos, lo revisamos y lo volvemos a armar.</p>
              <Botones waUrl={waUrl} />
            </div>
          </div>

          <div className="relative h-full min-h-0 lg:h-[88%]">
            <Equipo escena={escena} capas={capas} activa={tramo === 'piezas' ? activa : null} />
          </div>
        </div>

        <p style={{ opacity: tramo === 'portada' ? 1 : 0, transition: 'opacity 300ms ease' }} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/60">
          Baja para desarmarlo <ChevronDown className="h-4 w-4" />
        </p>
      </div>
    </section>
  );
}
