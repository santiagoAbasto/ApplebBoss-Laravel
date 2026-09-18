import { useEffect, useRef, useState } from 'react';

/**
 * El botón de WhatsApp que acompaña al cliente en toda la tienda.
 *
 * - **La marca, sólida:** la burbuja va en blanco lleno y el auricular queda en el verde del botón, como el ícono
 *   oficial. Antes se dibujaba el contorno, que a 28 px se veía delgado y sucio.
 * - **Se mueve, sin molestar:** entra con un rebote, respira con dos ondas, cada tanto hace un guiño que se apaga
 *   apenas el cliente lo toca o lo apunta, y una sola vez por visita abre una burbuja de saludo que se cierra sola.
 * - **Se frena en la línea del copyright:** al llegar al pie no se monta encima del texto ni de la barra de comparar;
 *   se queda apoyado justo arriba de esa línea (`data-tope-flotante`).
 * - Con «reducir movimiento» del sistema queda quieto y sin ondas, pero se sigue viendo y usando igual.
 */

const MARGEN = 24;          // lo que separa el botón del borde de la pantalla (y del tope)
const ESPERA_ENTRADA = 1200;
const ESPERA_SALUDO  = 3600;
const DURA_SALUDO    = 11000;
const CADA_GUINO     = 9000;
const CLAVE_SALUDO   = 'ab-wa-saludo';

function IconoWhatsApp({ size = 30 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
            {/* Una sola figura: la burbuja llena y el auricular calado con `evenodd`, así el auricular deja ver
                el verde del botón en vez de pintarse con un verde plano que nunca coincide con el degradado. */}
            <path
                fill="#fff"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.955-1.418A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
            />
        </svg>
    );
}

/** Cuánto hay que subir el botón para no pisar la línea del copyright ni la barra de comparar. */
function useTope() {
    const [subir, setSubir] = useState(0);

    useEffect(() => {
        let pendiente = false;

        const medir = () => {
            pendiente = false;
            const topes = [...document.querySelectorAll('[data-tope-flotante]')]
                .map((el) => el.getBoundingClientRect().top)
                .filter((t) => Number.isFinite(t));
            if (topes.length === 0) { setSubir(0); return; }
            // Mismo `bottom` que el CSS de .ab-wa (16 px en celular, 24 en escritorio) más un aire libre sobre el tope,
            // para que el botón nunca quede pegado a «Agregar» de la barra de compra.
            const celular = window.matchMedia('(max-width: 640px)').matches;
            const abajo = celular ? 16 : MARGEN;
            const aire = celular ? 18 : 12;
            const limite = window.innerHeight - abajo + aire;
            setSubir(Math.max(0, Math.round(limite - Math.min(...topes))));
        };

        const alDesplazar = () => {
            if (pendiente) return;
            pendiente = true;
            requestAnimationFrame(medir);
        };

        medir();
        window.addEventListener('scroll', alDesplazar, { passive: true });
        window.addEventListener('resize', alDesplazar);
        const observador = new ResizeObserver(alDesplazar);
        observador.observe(document.body);
        // Una barra fija (la de compra en el celular) aparece sin cambiar el alto de la página: se mide al montarse.
        const cambios = new MutationObserver(alDesplazar);
        cambios.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('scroll', alDesplazar);
            window.removeEventListener('resize', alDesplazar);
            observador.disconnect();
            cambios.disconnect();
        };
    }, []);

    return subir;
}

export default function WhatsAppFlotante({ url, titulo = '¿Te ayudamos a elegir?', bajada = 'Te respondemos por WhatsApp, sin bots.' }) {
    const [entro, setEntro]       = useState(false);
    const [apuntado, setApuntado] = useState(false);
    const [saludo, setSaludo]     = useState(false);
    const [guino, setGuino]       = useState(false);
    const tocado = useRef(false);
    const subir = useTope();

    // Entra sola, después de que el cliente ya vio la página
    useEffect(() => {
        const t = setTimeout(() => setEntro(true), ESPERA_ENTRADA);
        return () => clearTimeout(t);
    }, []);

    // El saludo se abre una sola vez por visita y se cierra solo
    useEffect(() => {
        let visto = true;
        try { visto = sessionStorage.getItem(CLAVE_SALUDO) === 'visto'; } catch { /* sin almacenamiento */ }
        if (visto) return undefined;

        const abrir = setTimeout(() => {
            if (tocado.current) return;
            setSaludo(true);
            try { sessionStorage.setItem(CLAVE_SALUDO, 'visto'); } catch { /* sin almacenamiento */ }
        }, ESPERA_SALUDO);
        const cerrar = setTimeout(() => setSaludo(false), ESPERA_SALUDO + DURA_SALUDO);

        return () => { clearTimeout(abrir); clearTimeout(cerrar); };
    }, []);

    // El guiño se repite hasta que el cliente lo apunta o lo toca
    useEffect(() => {
        const t = setInterval(() => {
            if (tocado.current) return;
            setGuino(true);
            setTimeout(() => setGuino(false), 900);
        }, CADA_GUINO);
        return () => clearInterval(t);
    }, []);

    if (!url) return null;

    const atendido = () => {
        tocado.current = true;
        setGuino(false);
        setSaludo(false);
    };

    return (
        <div
            className="ab-wa"
            data-entro={entro || undefined}
            data-guino={guino || undefined}
            style={{ transform: `translate3d(0, -${subir}px, 0)` }}
        >
            {/* Saludo: se abre una vez por visita y también con el mouse encima */}
            <div className="ab-wa-saludo" data-abierto={(saludo || apuntado) || undefined} aria-hidden="true">
                <p className="ab-wa-saludo-titulo">{titulo}</p>
                <p className="ab-wa-saludo-texto">{bajada}</p>
                <span className="ab-wa-saludo-estado"><i /> Atención directa</span>
                {saludo && !apuntado && (
                    <button type="button" className="ab-wa-cerrar" aria-hidden="true" tabIndex={-1}
                        onClick={(e) => { e.preventDefault(); atendido(); }}>
                        ×
                    </button>
                )}
                <span className="ab-wa-pico" />
            </div>

            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ab-wa-boton"
                aria-label="Escribirnos por WhatsApp"
                onMouseEnter={() => { setApuntado(true); atendido(); }}
                onMouseLeave={() => setApuntado(false)}
                onFocus={() => { setApuntado(true); atendido(); }}
                onBlur={() => setApuntado(false)}
                onClick={atendido}
            >
                <span className="ab-wa-onda" aria-hidden="true" />
                <span className="ab-wa-onda ab-wa-onda-2" aria-hidden="true" />
                <span className="ab-wa-brillo" aria-hidden="true" />
                <IconoWhatsApp />
                <span className="ab-wa-aviso" aria-hidden="true">1</span>
            </a>
        </div>
    );
}
