// Campaña de Navidad: las piezas que los layouts y las páginas montan. Todo sale de la prop `temporada`
// (App\Support\Temporada): si es null, ninguno de estos componentes dibuja nada ni registra un listener, y el
// archivo de personajes ni se descarga.
import { Link, usePage } from '@inertiajs/react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { alCambiarEfectos, efectosReducidos, guardarEfectos } from '@/temporada';
import { Campana, CarritoConRegalo, Esfera, Estrella, Gorro, Luces, Rama, Regalo, Saco } from './Adornos';

export { Campana, CarritoConRegalo, Esfera, Estrella, Gorro, Luces, Rama, Regalo, Saco };

/** La campaña activa en esta página, o null. */
export function useTemporada() {
    return usePage().props.temporada ?? null;
}

/** [reducidos, cambiar]: la preferencia «menos efectos» de esta persona, compartida entre todos los controles. */
export function useEfectos() {
    const [reducidos, setReducidos] = useState(false);
    useEffect(() => {
        setReducidos(efectosReducidos());
        return alCambiarEfectos(setReducidos);
    }, []);

    return [reducidos, guardarEfectos];
}

// Registro cerrado de ilustraciones: el panel elige entre estas, nunca sube un SVG propio.
export const ILUSTRACIONES = {
    PapaNoel: { nombre: 'Papá Noel con paquete', proporcion: '160 / 200' },
    Duende: { nombre: 'Duende técnico', proporcion: '120 / 160' },
    Reno: { nombre: 'Reno', proporcion: '120 / 130' },
    Arbol: { nombre: 'Árbol', proporcion: '120 / 160' },
    EscenaBienvenida: { nombre: 'Bienvenida de la portada', proporcion: '300 / 220' },
    EscenaCarritoVacio: { nombre: 'Carrito vacío', proporcion: '240 / 180' },
    EscenaSinResultados: { nombre: 'Búsqueda sin resultados', proporcion: '240 / 180' },
    EscenaGracias: { nombre: 'Agradecimiento', proporcion: '240 / 180' },
    Trineo: { nombre: 'Trineo con renos', proporcion: '300 / 96' },
    Paisaje: { nombre: 'Paisaje del pie', proporcion: '1200 / 120' },
    Colgantes: { nombre: 'Colgantes de los márgenes', proporcion: '120 / 200' },
};

const perezosa = (clave) => lazy(() => import('./Personajes').then((m) => ({ default: m[clave] })));
const CARGADAS = Object.fromEntries(Object.keys(ILUSTRACIONES).map((clave) => [clave, perezosa(clave)]));

/**
 * Una ilustración del registro. El hueco se reserva con la proporción del lienzo, así la página no salta cuando
 * llega el dibujo. `forzar` la muestra aunque la campaña esté apagada (galería del panel).
 */
export function Ilustracion({ nombre, className = '', titulo, forzar = false }) {
    const temporada = useTemporada();
    const dato = ILUSTRACIONES[nombre];
    if (!dato || (!forzar && (!temporada || !temporada.personajes))) return null;
    const Dibujo = CARGADAS[nombre];

    return (
        <span className={`nv-ilustracion ${className}`} style={{ aspectRatio: dato.proporcion }} aria-hidden={titulo ? undefined : true}>
            <Suspense fallback={null}><Dibujo titulo={titulo} /></Suspense>
        </span>
    );
}

/** Dibuja a sus hijos solo con la campaña encendida (y, si se pide, solo con ese interruptor). */
export function EnNavidad({ si, children }) {
    const temporada = useTemporada();
    if (!temporada || (si && !temporada[si])) return null;

    return children;
}

/** Franja de campaña arriba de la tienda: el texto y el enlace salen del panel. Sin texto, no se dibuja. */
export function FranjaDeCampana() {
    const temporada = useTemporada();
    if (!temporada?.texto) return null;
    const contenido = (
        <>
            <Estrella className="nv-franja-estrella" />
            <span className="truncate">{temporada.texto}</span>
            {temporada.enlace && <span className="nv-franja-ver" aria-hidden="true">Ver →</span>}
        </>
    );

    return (
        <div className="nv-franja">
            {temporada.enlace
                ? <Link href={temporada.enlace} className="nv-franja-contenido">{contenido}</Link>
                : <p className="nv-franja-contenido">{contenido}</p>}
        </div>
    );
}

/** Tira de luces bajo el encabezado. No ocupa alto: cuelga sobre el contenido sin empujarlo. */
export function LucesDeEncabezado() {
    return <EnNavidad si="luces"><Luces className="nv-luces-encabezado" /></EnNavidad>;
}

/** Gorro que se apoya sobre el logotipo (el contenedor tiene que ser `relative`). */
export function GorroDeMarca({ className = '' }) {
    return <EnNavidad><Gorro className={`nv-gorro ${className}`} /></EnNavidad>;
}

/** El control visible para bajar los efectos. Va en el pie de la tienda y en el menú del panel. */
export function ControlDeEfectos({ className = '' }) {
    const temporada = useTemporada();
    const [reducidos, cambiar] = useEfectos();
    if (!temporada || !temporada.animaciones) return null;

    return (
        <button type="button" className={`nv-control ${className}`} aria-pressed={reducidos} onClick={() => cambiar(!reducidos)}>
            <Estrella className="nv-control-icono" />
            {reducidos ? 'Activar efectos de Navidad' : 'Reducir efectos de Navidad'}
        </button>
    );
}

const COPOS = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 7.3 + 3) % 100}%`,
    animationDuration: `${11 + (i % 5) * 2.4}s`,
    animationDelay: `${-(i * 1.7)}s`,
    '--nv-copo': `${3 + (i % 3) * 1.5}px`,
}));

/** Nieve opcional y discreta: 14 copos en CSS, sin temporizadores. Nunca sobre el checkout ni el pago. */
export function Nieve() {
    const temporada = useTemporada();
    const { url } = usePage();
    const [reducidos] = useEfectos();
    if (!temporada?.nieve || !temporada.animaciones || reducidos || /^\/(checkout|pedido|seguimiento)/.test(url)) return null;

    return (
        <div className="nv-nieve" aria-hidden="true">
            {COPOS.map((estilo, i) => <span key={i} style={estilo} />)}
        </div>
    );
}

/** Aviso para quien está mirando una vista previa: nadie más ve la tienda así. */
export function AvisoDeVistaPrevia() {
    const temporada = useTemporada();
    if (!temporada?.vistaPrevia) return null;

    return (
        <a href="/admin/configuracion/navidad" className="nv-previa">
            Vista previa de Navidad · solo tú la ves · <span>Volver al panel</span>
        </a>
    );
}

/** Encabezado de temporada para una sección: una rama y un título chico encima del título real. */
export function CintaDeSeccion({ children, className = '' }) {
    return (
        <EnNavidad>
            <span className={`nv-cinta ${className}`}>
                <Rama className="nv-cinta-rama" />
                {children}
            </span>
        </EnNavidad>
    );
}

/** Portada: el punto protagonista de la campaña. Papá Noel, el árbol y una invitación a ver el catálogo real. */
export function BienvenidaNavidad() {
    const temporada = useTemporada();
    if (!temporada) return null;

    return (
        <section aria-labelledby="nv-bienvenida-titulo" className="mx-auto w-full max-w-[1224px] px-4 py-6 sm:px-7 md:px-10">
            <div className="nv-bienvenida">
                <div>
                    <CintaDeSeccion>Navidad en Apple Boss</CintaDeSeccion>
                    <h2 id="nv-bienvenida-titulo" className="nv-bienvenida-titulo mt-2">{temporada.texto || 'Esta Navidad, regala tecnología'}</h2>
                    <p className="nv-bienvenida-texto">
                        Encuentra tu próximo regalo entre los equipos disponibles hoy: cada uno con su precio en bolivianos, su estado y su garantía a la vista.
                    </p>
                    <Link href={temporada.enlace || '/catalogo'} className="nv-bienvenida-boton">
                        <Regalo className="h-5 w-5" tono="burdeos" /> Ver el catálogo
                    </Link>
                </div>
                {temporada.personajes
                    ? <Ilustracion nombre="EscenaBienvenida" className="nv-bienvenida-escena" />
                    : <span className="nv-bienvenida-escena flex items-end justify-center gap-3" aria-hidden="true"><Regalo className="h-16 w-16" tono="marfil" /><Regalo className="h-24 w-24" /><Regalo className="h-14 w-14" tono="navy" /></span>}
            </div>
        </section>
    );
}

// Qué dice la tira de cada recorrido. Son saludos, no promociones: nada de descuentos, envoltorio ni entregas.
const TIRAS = [
    [/^\/(checkout|pedido|carrito)/, null],   // pago y pedido: zona limpia para el QR, los importes y los errores
    [/^\/$/, null],                           // la portada ya tiene su bloque de bienvenida
    [/^\/(catalogo|colecciones)/, 'Ideas para regalar esta Navidad', 'regalo'],
    [/^\/trade-in/, 'Estrena en Navidad: tu equipo como parte de pago', 'Reno'],
    [/^\/servicio-tecnico/, 'Tu equipo a punto para las fiestas', 'Duende'],
    [/^\/(seguimiento|mi-cuenta|ingresar|crear-cuenta|forgot-password|reset-password)/, 'Felices fiestas de parte de Apple Boss', 'campana'],
    [/^\/(iphone|mac|apple|seminuevos|myskin|accesorios|productos|comparar)/, 'Esta Navidad, regala tecnología', 'regalo'],
    [/./, 'Felices fiestas de parte de Apple Boss', 'campana'],
];

/** Tira de temporada entre el encabezado y el contenido de cada página interior, con su adorno según el recorrido. */
export function TiraDeTemporada() {
    const temporada = useTemporada();
    const { url } = usePage();
    if (!temporada) return null;
    const [, texto, adorno] = TIRAS.find(([patron]) => patron.test(url)) ?? [];
    if (!texto) return null;
    const conPersonaje = temporada.personajes && ILUSTRACIONES[adorno];

    return (
        <div className="nv-tira" data-nv-tira>
            {temporada.personajes && <Ilustracion nombre="Trineo" className="nv-vuelo" />}
            <div className="nv-tira-contenido">
                <Rama className="nv-tira-rama" />
                {conPersonaje && <Ilustracion nombre={adorno} className="nv-tira-personaje" />}
                {!conPersonaje && (adorno === 'campana' ? <Campana className="nv-tira-adorno" /> : <Regalo className="nv-tira-adorno" />)}
                <p>{texto}</p>
                <Rama espejo className="nv-tira-rama" />
            </div>
        </div>
    );
}

/** Resumen del panel: un saludo chico de temporada arriba de las métricas, sin desplazarlas de su grilla. */
export function BienvenidaDelPanel() {
    const temporada = useTemporada();
    const nombre = usePage().props.auth?.user?.name?.split(' ')[0];
    if (!temporada) return null;

    return (
        <div className="nv-panel-bienvenida ab-reset mx-auto mb-5 max-w-[1400px]">
            {temporada.personajes
                ? <Ilustracion nombre="Duende" className="nv-panel-bienvenida-escena" />
                : <Campana className="h-10 w-10 shrink-0" />}
            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Felices fiestas{nombre ? `, ${nombre}` : ''}</p>
                <p className="text-[13px] text-slate-600">El panel está con la apariencia de Navidad. Todo funciona igual que siempre.</p>
            </div>
        </div>
    );
}

/** Remate del menú del panel: una tira corta de luces y el control para bajar los efectos. */
export function RemateDelMenu() {
    const temporada = useTemporada();
    if (!temporada) return null;

    return (
        <div className="nv-sidebar-remate">
            {temporada.luces && <Luces compacta />}
            <ControlDeEfectos className="nv-control-panel" />
        </div>
    );
}

/** Acceso: el personaje que acompaña el panel de marca (solo en pantallas anchas, donde ese panel existe). */
export function PersonajeDeAcceso() {
    return <Ilustracion nombre="PapaNoel" className="nv-acceso-personaje" />;
}

/** Los espacios vacíos: colgantes en los márgenes de las pantallas anchas. Fijos, sin clics y solo desde 1500 px. */
export function AdornosDeMargen() {
    const temporada = useTemporada();
    const { url } = usePage();
    if (!temporada?.personajes || /^\/(checkout|pedido)/.test(url)) return null;

    return (
        <>
            <Ilustracion nombre="Colgantes" className="nv-margen nv-margen-izq" />
            <Ilustracion nombre="Colgantes" className="nv-margen nv-margen-der" />
        </>
    );
}

/** Paisaje animado sobre el pie: colinas, pinos, regalos, un reno que pasea y el trineo que cruza el cielo. */
export function PaisajeDelPie() {
    const temporada = useTemporada();
    const { url } = usePage();
    if (!temporada?.personajes || /^\/(checkout|pedido)/.test(url)) return null;

    return (
        <div className="nv-paisaje" aria-hidden="true">
            <Ilustracion nombre="Trineo" className="nv-vuelo nv-vuelo-alto" />
            <Ilustracion nombre="Paisaje" className="nv-paisaje-suelo" />
        </div>
    );
}

/** Carrito: adorno de la cabecera (saco de regalos y luces colgando del borde). */
export function CabeceraDelCarrito() {
    const temporada = useTemporada();
    if (!temporada) return null;

    return (
        <>
            <CarritoConRegalo className="nv-carrito-saco" />
            {temporada.luces && <Luces compacta className="nv-carrito-luces" />}
        </>
    );
}

/** Carrito: el trineo pasa sobre el total. Solo adorno: no dice nada del envío ni de la entrega. */
export function CieloDelCarrito() {
    const temporada = useTemporada();
    if (!temporada?.personajes) return null;

    return (
        <div className="nv-carrito-cielo" aria-hidden="true">
            <Ilustracion nombre="Trineo" className="nv-carrito-trineo" />
        </div>
    );
}

/** El ícono del carrito del encabezado, de temporada: un saco de regalos en lugar de la bolsa. */
export function IconoDeCarrito({ children }) {
    const temporada = useTemporada();

    return temporada ? <CarritoConRegalo className="nv-carrito-icono" /> : children;
}

/** El botón para apagar o encender la música. Queda a la vista, abajo a la izquierda, en toda la tienda. */
export function ControlDeMusica() {
    const temporada = useTemporada();
    const [suena, setSuena] = useState(false);
    const [modulo, setModulo] = useState(null);
    useEffect(() => {
        if (!temporada?.musica) return undefined;
        let cortar = () => {};
        let vivo = true;
        import('./musica').then((m) => {
            if (!vivo) return;
            setModulo(m);
            setSuena(m.sonando());
            cortar = m.alCambiarMusica(setSuena);
        });
        return () => { vivo = false; cortar(); };
    }, [temporada?.musica]);
    if (!temporada?.musica) return null;

    return (
        <button type="button" className="nv-musica" aria-pressed={suena} onClick={() => modulo?.alternarMusica()}
            aria-label={suena ? 'Apagar la música navideña' : 'Encender la música navideña'}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className={suena ? 'nv-musica-nota nv-musica-suena' : 'nv-musica-nota'}>
                <path d="M9 17.500V5.500L19 3.500V15.500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6.500" cy="17.500" r="2.800" fill="currentColor" /><circle cx="16.500" cy="15.500" r="2.800" fill="currentColor" />
                {!suena && <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
            </svg>
            <span>{suena ? 'Apagar música' : 'Encender música'}</span>
        </button>
    );
}

// ── Tapas de regalo del catálogo ─────────────────────────────────────────────────────────────────────
// Qué regalos ya se abrieron en esta visita. Vive en sessionStorage: dura mientras la pestaña esté abierta y se
// borra sola al cerrar la web, así que una tapa abierta no se vuelve a cerrar al navegar ni al recargar.
const CLAVE_REGALOS = 'appleboss:navidad-regalos';
const abiertos = new Set();
let regalosLeidos = false;

function leerRegalos() {
    if (regalosLeidos) return;
    regalosLeidos = true;
    try { JSON.parse(window.sessionStorage.getItem(CLAVE_REGALOS) || '[]').forEach((id) => abiertos.add(id)); } catch { /* sin almacenamiento */ }
}

function recordarRegalo(id) {
    abiertos.add(id);
    try { window.sessionStorage.setItem(CLAVE_REGALOS, JSON.stringify([...abiertos])); } catch { /* vale para esta página */ }
}

/**
 * La tapa de la caja de regalo que cubre la foto de un producto. Va como hermana del enlace de la foto (dentro
 * del <article>, que es `relative`): un botón de verdad, con nombre y foco, que el primer clic destapa. Mientras
 * está puesta, ese clic no abre el producto: lo abre el siguiente, ya sobre la foto.
 */
export function TapaDeRegalo({ id, nombre, completa = false }) {
    const temporada = useTemporada();
    const [estado, setEstado] = useState(() => { leerRegalos(); return abiertos.has(id) ? 'abierta' : 'puesta'; });
    if (!temporada?.tapas || !id || estado === 'abierta') return null;

    const destapar = () => {
        if (estado !== 'puesta') return;
        recordarRegalo(id);
        setEstado('saliendo');
        window.setTimeout(() => setEstado('abierta'), 560);
    };

    return (
        <button type="button" className={`nv-tapa ${completa ? 'nv-tapa-completa' : ''} ${estado === 'saliendo' ? 'nv-tapa-saliendo' : ''}`} onClick={destapar}
            aria-label={`Abrir el regalo: ${nombre}`} disabled={estado === 'saliendo'}>
            <svg className="nv-tapa-mono" viewBox="0 0 64 40" aria-hidden="true">
                <path d="M32 30C22 6 2 6 6 22C8 31 22 32 32 30Z" fill="#B88A44" /><path d="M32 30C42 6 62 6 58 22C56 31 42 32 32 30Z" fill="#B88A44" />
                <path d="M32 30C25 14 12 12 12 21C12 27 24 30 32 30Z" fill="#E2BC72" /><path d="M32 30C39 14 52 12 52 21C52 27 40 30 32 30Z" fill="#E2BC72" />
                <path d="M32 30L24 40M32 30L40 40" stroke="#B88A44" strokeWidth="4" strokeLinecap="round" />
                <circle cx="32" cy="29" r="6.500" fill="#F0D08E" />
            </svg>
            <span className="nv-tapa-pista">Toca para abrir</span>
        </button>
    );
}
