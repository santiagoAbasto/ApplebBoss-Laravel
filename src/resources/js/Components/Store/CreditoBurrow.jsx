/*
 * La firma del sitio en la línea del copyright: el burro y el wordmark de Burrow Labs, y todo el bloque lleva a su sitio.
 * Los dos son los vectores oficiales sin tocar (public/images/burrowlabs, copiados de public/brand del proyecto de
 * Burrow Labs): el logo va tal cual, sin piezas agregadas ni animación.
 */
export default function CreditoBurrow() {
    return (
        <a href="https://burrowlabs.com.bo/" target="_blank" rel="noopener" title="burrowlabs.com.bo"
            className="inline-flex items-center gap-2 rounded-full py-0.5 pl-1 pr-2.5 text-white/85 transition-colors hover:bg-white/[0.07] hover:text-white">
            <img src="/images/burrowlabs/mascot.svg" alt="" loading="lazy" draggable="false" className="h-8 w-auto shrink-0" style={{ aspectRatio: '529 / 820' }} />
            <span>By</span>
            <img src="/images/burrowlabs/wordmark.svg" alt="Burrow Labs" loading="lazy" draggable="false" className="h-3.5 w-auto" style={{ aspectRatio: '654 / 119' }} />
        </a>
    );
}
