import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight, ChevronDown, MessageCircle } from '@/Components/Store/Icons';

// La portada de servicio técnico: un iPhone 17 Pro Max naranja cósmico que se desarma al bajar y se vuelve a armar al final, como las
// páginas de producto de Apple. La sección queda fija mientras se recorre; el scroll dice hasta dónde tiene que llegar
// el desarme y la animación va hacia ahí a su propio ritmo, lento y parejo, sin importar si la rueda avanza de golpe.
//
// No es un video: son las seis piezas del equipo recortadas (public/images/servicio/piezas-2) y cada una se desliza
// rígida, de costado, desde su lugar dentro de la carcasa hasta su lugar en la fila. Así ninguna se deforma ni cambia
// de tamaño por el camino. Con «reducir movimiento» no se fija nada: se muestra el equipo desarmado, quieto.

// Las piezas, del fondo al frente, en píxeles de la imagen de origen (una fila de 2688 px de ancho). `x` e `y` son su
// lugar desarmada; `casa`, cuánto a la derecha del borde de la carcasa va cuando está colocada; `sale`, en qué parte
// del desarme deja la carcasa; `item`, qué renglón de «Lo que más reparamos» la señala.
const CARPETA = '/images/servicio/piezas-2';
const PIEZAS_EQUIPO = [
  { id: 'carcasa', w: 529, h: 1269, x: 2044, y: 125, item: 4 },
  { id: 'camaras', w: 340, h: 544, x: 1649, y: 228, casa: 160, sale: [0.58, 0.96], item: 3 },
  { id: 'puerto', w: 403, h: 208, x: 1150, y: 1093, casa: 62, sale: [0.48, 0.86], item: 5 },
  { id: 'placa', w: 404, h: 466, x: 1145, y: 219, casa: 30, sale: [0.48, 0.86], item: 2 },
  { id: 'bateria', w: 367, h: 719, x: 670, y: 500, casa: 80, sale: [0.36, 0.74], item: 1 },
  { id: 'pantalla', w: 477, h: 1233, x: 98, y: 146, casa: 25, item: 0 },
];
const CARCASA = PIEZAS_EQUIPO[0];
const PANTALLA = PIEZAS_EQUIPO[PIEZAS_EQUIPO.length - 1];
const FILA = { centro: 1336, medio: 760 };   // el centro de la fila desarmada
const ABIERTO = 0.34;                        // hasta acá se separa la pantalla; después salen las piezas
const SEPARA = 290;                          // cuánto se aparta cada mitad al abrir

// En qué parte del recorrido pasa cada cosa (0 = arriba de la sección, 1 = el final)
const ABRE = [0.06, 0.36];
const PIEZAS = [0.38, 0.82];
const CIERRA = [0.84, 0.96];

const suave = (t) => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u); };
const entre = (a, b, t) => a + (b - a) * t;

// Cuánto del desarme corresponde a cada punto del recorrido: 0 es armado y 1, desarmado del todo
function avanceDe(p) {
  if (p <= ABRE[0]) return 0;
  if (p < ABRE[1]) return suave((p - ABRE[0]) / (ABRE[1] - ABRE[0]));
  if (p <= CIERRA[0]) return 1;
  if (p < CIERRA[1]) return 1 - suave((p - CIERRA[0]) / (CIERRA[1] - CIERRA[0]));
  return 0;
}

// El ritmo: desarmarse (o armarse) entero lleva como mínimo estos segundos, aunque el scroll llegue antes. Cerca de la
// meta frena solo, y la velocidad cambia de a poco para que no arranque ni pare de golpe.
const SEGUNDOS = 6;
const FRENO = 4;
const ARRANQUE = 7;

// Dónde va cada pieza (borde izquierdo, en píxeles de origen) para un avance dado. `junta` acerca las piezas de la fila
// en pantallas angostas, donde no entran una al lado de la otra.
function lugares(avance, junta) {
  const final = (pieza) => FILA.centro + (pieza.x + pieza.w / 2 - FILA.centro) * junta - pieza.w / 2;
  const armada = FILA.centro - CARCASA.w / 2;
  const abre = suave(avance / ABIERTO);
  const sigue = suave((avance - ABIERTO) / (1 - ABIERTO));

  const carcasa = avance <= ABIERTO ? entre(armada, armada + SEPARA * junta, abre) : entre(armada + SEPARA * junta, final(CARCASA), sigue);
  const pantalla = avance <= ABIERTO
    ? entre(armada + PANTALLA.casa, armada + PANTALLA.casa - SEPARA * junta, abre)
    : entre(armada + PANTALLA.casa - SEPARA * junta, final(PANTALLA), sigue);

  return PIEZAS_EQUIPO.map((pieza) => {
    if (pieza === CARCASA) return carcasa;
    if (pieza === PANTALLA) return pantalla;
    return entre(carcasa + pieza.casa, final(pieza), suave((avance - pieza.sale[0]) / (pieza.sale[1] - pieza.sale[0])));
  });
}

// Qué texto está a la vista: lo decide el recorrido, pero espera a que el equipo termine de armarse o desarmarse
const tramoDe = (p, avance) => {
  if (p < ABRE[0] && avance < 0.04) return 'portada';
  if (p >= PIEZAS[0] - 0.03 && p <= PIEZAS[1] && avance > 0.93) return 'piezas';
  if (p >= CIERRA[1] - 0.03 && avance < 0.06) return 'cierre';
  return null;
};

// Qué renglón de la lista le toca a ese punto del recorrido
const piezaDe = (p, total) => Math.min(total - 1, Math.max(0, Math.floor(((p - PIEZAS[0]) / (PIEZAS[1] - PIEZAS[0])) * total)));

// La lista siempre arranca en el primer renglón y avanza de a uno: cada pieza queda señalada al menos este tiempo
// (en milisegundos), aunque el scroll ya vaya más adelante.
const PAUSA = 900;

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
            <p className={`overflow-hidden text-sm leading-relaxed text-white/75 transition-all duration-300 ${encendida ? 'max-h-24' : 'max-h-0'}`}>
              {pieza.texto}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

// Las piezas dibujadas. `activa` es el renglón señalado de la lista: su pieza queda encendida y las demás se apagan.
function Equipo({ escena, capas, activa }) {
  return (
    <div ref={escena} role="img" aria-label="Un iPhone 17 Pro Max que se desarma: pantalla, batería, placa, cámaras, puerto de carga y carcasa"
      className="relative h-full min-h-0 w-full">
      {PIEZAS_EQUIPO.map((pieza, i) => (
        <div key={pieza.id} ref={(el) => { capas.current[i] = el; }} className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{ width: pieza.w, height: pieza.h }}>
          <img src={`${CARPETA}/${pieza.id}.webp`} alt="" width={pieza.w} height={pieza.h} draggable="false" decoding="async"
            className="block h-full w-full select-none transition-[filter] duration-300"
            style={{ filter: activa >= 0 && activa !== pieza.item ? 'brightness(0.35)' : 'none' }} />
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
  const [activa, setActiva] = useState(-1);
  const [tramo, setTramo] = useState('portada');   // qué texto está a la vista: solo ese recibe los clics

  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });

  // Hasta dónde pide llegar el scroll (meta), dónde va la animación (avance) y a qué velocidad
  const estado = useRef({ p: 0, meta: 0, avance: 0, velocidad: 0, tiempo: 0, cuadro: 0, pieza: -1, cambio: 0 });

  // Pone cada pieza en su lugar para un avance dado. Armado, el equipo se ve grande; al desarmarse la vista se aleja
  // hasta que entra la fila entera.
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

    const aleja = suave(avance / 0.6);
    const escala = entre(cerca, lejos, aleja);
    const centro = entre(FILA.centro, (fila[0] + fila[1]) / 2, aleja);
    const x = lugares(avance, junta);

    PIEZAS_EQUIPO.forEach((pieza, i) => {
      const capa = capas.current[i];
      if (!capa) return;
      capa.style.transform = `translate3d(${ancho / 2 + (x[i] - centro) * escala}px, ${alto / 2 + (pieza.y - FILA.medio) * escala}px, 0) scale(${escala})`;
      // Armado solo se ve la pantalla: lo de adentro aparece recién cuando empieza a abrirse
      capa.style.opacity = pieza === PANTALLA ? 1 : Math.min(1, avance / 0.05);
    });
  };

  // Decide qué texto se ve y qué renglón de la lista está señalado. Devuelve si la lista todavía tiene que avanzar.
  const textos = (ahora = performance.now()) => {
    const e = estado.current;
    const cual = tramoDe(e.p, e.avance);
    let pendiente = false;

    if (cual !== 'piezas') {
      e.pieza = -1;
    } else {
      const pedida = piezaDe(e.p, piezas.length);
      if (e.pieza < 0) {
        e.pieza = 0;
        e.cambio = ahora;
      } else if (pedida !== e.pieza && ahora - e.cambio >= PAUSA) {
        e.pieza += Math.sign(pedida - e.pieza);
        e.cambio = ahora;
      }
      pendiente = pedida !== e.pieza;
    }

    const pieza = e.pieza;
    setTramo((antes) => (antes === cual ? antes : cual));
    setActiva((antes) => (antes === pieza ? antes : pieza));
    return pendiente;
  };

  // Un paso de la animación: se acerca a la meta sin pasar la velocidad máxima y mueve las piezas a donde quedó
  const paso = (ahora) => {
    const e = estado.current;
    const dt = Math.min(0.05, Math.max(0.001, (ahora - e.tiempo) / 1000));
    e.tiempo = ahora;

    const falta = e.meta - e.avance;
    const deseada = Math.max(-1 / SEGUNDOS, Math.min(1 / SEGUNDOS, falta * FRENO));
    e.velocidad += (deseada - e.velocidad) * Math.min(1, dt * ARRANQUE);
    e.avance = Math.max(0, Math.min(1, e.avance + e.velocidad * dt));

    const llego = Math.abs(falta) < 0.0004 && Math.abs(e.velocidad) < 0.0004;
    if (llego) { e.avance = e.meta; e.velocidad = 0; }
    colocar(e.avance);
    const pendiente = textos(ahora);
    e.cuadro = llego && !pendiente ? 0 : requestAnimationFrame(paso);
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
    textos();
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
          <div className="mt-10 h-[46vh] min-h-[280px]"><Equipo escena={escena} capas={capas} activa={-1} /></div>
          <h2 className="mb-4 mt-10 text-2xl font-black tracking-tight text-white">{tituloPiezas}</h2>
          <ListaDePiezas piezas={piezas} activa={null} />
        </div>
      </section>
    );
  }

  return (
    <section ref={seccion} className="relative bg-black" style={{ height: '480vh' }}>
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
            <Equipo escena={escena} capas={capas} activa={tramo === 'piezas' ? activa : -1} />
          </div>
        </div>

        <p style={{ opacity: tramo === 'portada' ? 1 : 0, transition: 'opacity 300ms ease' }} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/60">
          Baja para desarmarlo <ChevronDown className="h-4 w-4" />
        </p>
      </div>
    </section>
  );
}
