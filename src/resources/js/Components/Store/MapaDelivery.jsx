import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from '@/Components/Store/Icons';

/*
 * Mapa para marcar dónde entrega el delivery. OpenStreetMap: sin API key ni cobro por uso.
 * Se carga solo cuando el cliente elige «Delivery en Cochabamba» (ver Checkout.jsx).
 */

const PLAZA_14_DE_SEPTIEMBRE = [-17.3935, -66.157];

// Pin propio: el ícono por defecto de Leaflet busca imágenes que el bundler no copia
const PIN = L.divIcon({
    className: '',
    html: '<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 43s15-14.6 15-26A15 15 0 0 0 2 17c0 11.4 15 26 15 26z" fill="#011446"/><circle cx="17" cy="17" r="6.5" fill="#C6CB36"/></svg>',
    iconSize: [34, 44],
    iconAnchor: [17, 43],
});

export default function MapaDelivery({ lat, lng, onChange, error }) {
    const nodo = useRef(null);
    const mapa = useRef(null);
    const pin = useRef(null);
    const alCambiar = useRef(onChange);
    alCambiar.current = onChange;

    const [ubicando, setUbicando] = useState(false);
    const [aviso, setAviso] = useState(null);

    const poner = (punto) => {
        if (!mapa.current) return;
        if (!pin.current) {
            pin.current = L.marker(punto, { icon: PIN, draggable: true, keyboard: false }).addTo(mapa.current);
            pin.current.on('dragend', () => {
                const q = pin.current.getLatLng();
                alCambiar.current(q.lat, q.lng);
            });
        } else {
            pin.current.setLatLng(punto);
        }
        alCambiar.current(punto.lat, punto.lng);
    };

    useEffect(() => {
        const hayPunto = lat != null && lng != null;
        const m = L.map(nodo.current, {
            center: hayPunto ? [lat, lng] : PLAZA_14_DE_SEPTIEMBRE,
            zoom: hayPunto ? 17 : 13,
            scrollWheelZoom: false,
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap',
        }).addTo(m);
        m.on('click', (e) => poner(e.latlng));
        mapa.current = m;
        if (hayPunto) poner(L.latLng(lat, lng));

        return () => { m.remove(); mapa.current = null; pin.current = null; };
    }, []);

    const usarMiUbicacion = () => {
        if (!navigator.geolocation) {
            setAviso('Tu navegador no comparte la ubicación. Marca el punto tocando el mapa.');
            return;
        }
        setUbicando(true);
        setAviso(null);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setUbicando(false);
                const punto = L.latLng(coords.latitude, coords.longitude);
                mapa.current?.setView(punto, 17);
                poner(punto);
            },
            () => {
                setUbicando(false);
                setAviso('No pudimos obtener tu ubicación. Marca el punto tocando el mapa.');
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
        );
    };

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Ubicación en el mapa
                </span>
                <button type="button" onClick={usarMiUbicacion} disabled={ubicando}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-60"
                    style={{ borderColor: 'var(--border-light)', color: 'var(--ab-navy)' }}>
                    <MapPin className="h-3.5 w-3.5" />
                    {ubicando ? 'Buscando…' : 'Usar mi ubicación'}
                </button>
            </div>

            {/* `isolate`: Leaflet usa z-index de 400 en adelante y taparía el encabezado de la tienda */}
            <div ref={nodo} className="relative isolate h-64 w-full overflow-hidden rounded-xl border sm:h-72"
                style={{ borderColor: error ? '#dc2626' : 'var(--border-light)' }}
                role="application" aria-label="Mapa para marcar el punto de entrega" />

            <p className="mt-1.5 text-xs" style={{ color: lat != null ? 'var(--ab-navy)' : 'var(--text-muted)' }}>
                {lat != null
                    ? 'Punto marcado. Si no es exacto, arrastra el pin.'
                    : 'Toca el mapa donde entregamos. Puedes arrastrar el pin para ajustarlo.'}
            </p>
            {aviso && <p className="mt-1 text-xs font-semibold" style={{ color: '#b45309' }}>{aviso}</p>}
            {error && <p className="mt-1 text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</p>}
        </div>
    );
}
