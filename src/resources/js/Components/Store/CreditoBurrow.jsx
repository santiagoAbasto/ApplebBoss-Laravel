/*
 * La firma del sitio en el pie: el burro de Burrow Labs saluda y todo el bloque lleva a su sitio.
 *
 * La mascota es el vector oficial sin tocar (public/images/burrowlabs, copiado de public/brand del proyecto de Burrow
 * Labs): orejas detrás, cuerpo delante y la pupila en CSS, como su componente Mascot. El brazo que saluda es el
 * WavingArm de sus escenas de planes (manga azul, mano gris, pezuña y borde amarillo); su guía de marca permite sumar
 * brazos aparte, nunca redibujar al burro. Las animaciones están en app-vite.css (.ab-burro-*).
 */

const BRAZO = { stroke: '#080a09', strokeWidth: 2.6, strokeLinejoin: 'round' };

export default function CreditoBurrow() {
    return (
        <a href="https://burrowlabs.com.bo/" target="_blank" rel="noopener" title="burrowlabs.com.bo"
            className="ab-credito group inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-white/85 transition-colors hover:bg-white/[0.06] hover:text-white">
            {/* Lienzo de 96 × 148,8: el mismo del burro en las escenas de Burrow Labs. El margen es el brazo en lo alto del saludo */}
            <span className="relative mr-4 block h-16 shrink-0" style={{ aspectRatio: '529 / 820' }} aria-hidden="true">
                <svg viewBox="0 0 96 148.8" className="absolute inset-0 h-full w-full overflow-visible">
                    <g className="ab-burro-brazo">
                        <rect x="88.5" y="70" width="15" height="55" rx="7.5" fill="#fcea10" stroke="#fcea10" strokeWidth="6.5" strokeLinejoin="round" />
                        <rect x="88.5" y="70" width="15" height="55" rx="7.5" fill="#1671b1" {...BRAZO} />
                        <path d="M88.5 88 v-10.5 a7.5 7.5 0 0 1 15 0 v10.5 z" fill="#c4c2c1" {...BRAZO} />
                        <path d="M88.5 77.5 a7.5 7.5 0 0 1 15 0 z" fill="#5e615e" {...BRAZO} />
                    </g>
                </svg>
                <img src="/images/burrowlabs/mascot-ears.svg" alt="" loading="lazy" draggable="false" className="ab-burro-orejas absolute inset-0 h-full w-full" />
                <img src="/images/burrowlabs/mascot-body.svg" alt="" loading="lazy" draggable="false" className="absolute inset-0 h-full w-full" />
                <span className="ab-burro-pupila" />
            </span>
            <span className="text-[13px] font-semibold">By</span>
            <img src="/images/burrowlabs/wordmark.svg" alt="Burrow Labs" loading="lazy" draggable="false" className="h-5 w-auto" style={{ aspectRatio: '654 / 119' }} />
        </a>
    );
}
