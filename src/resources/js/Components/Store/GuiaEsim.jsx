import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, QrCode, Smartphone, Wifi } from 'lucide-react';

// Guía de activación de eSIM en Bolivia (Entel, Tigo, Viva). Se muestra en la ficha de un celular cuyo tipo de SIM
// es eSIM. Los pasos y los enlaces salen de las páginas oficiales de cada operador. El QR y la solicitud los da el
// operador; la tienda solo explica el proceso.

const PASOS = [
    { Icon: Smartphone, texto: 'Pedí tu eSIM a tu operador, siendo el titular de la línea y con tu cédula de identidad. Tu equipo ya es compatible; solo necesita tener el IMEI registrado en Bolivia.' },
    { Icon: QrCode, texto: 'Te entregan un código QR, por correo o en la tienda del operador. Ese código sirve para un solo equipo.' },
    { Icon: Wifi, texto: 'Conectá el teléfono a una red WiFi estable antes de empezar y mantenela durante toda la instalación.' },
];

const OPERADORES = [
    {
        nombre: 'Entel',
        pasos: [
            'Pedí tu eSIM en un Multicentro Entel o con tu ejecutivo de cuenta, y dales un correo electrónico para recibir el código QR.',
            'Dudas: escribí por WhatsApp a Entel, o llamá al 103 desde un celular Entel o al 600 3600 103.',
        ],
        enlace: { url: 'https://www.entel.bo/MovileSIM', texto: 'Guía oficial de Entel' },
    },
    {
        nombre: 'Tigo',
        pasos: [
            'Escribí al WhatsApp 77390000 y elegí «chatear con un asesor», o andá a una tienda Tigo.',
            'Te piden ser titular de la línea: foto de tu cédula (ambos lados), una selfie sosteniéndola (sin lentes ni gorra) y tu número de línea. La activación tarda hasta 24 horas.',
        ],
        enlace: { url: 'https://ayuda.tigo.com.bo/hc/centro-de-ayuda/articles/1745380038-como-activo-mi-esim-en-mi-celular-i_phone-_-i_os', texto: 'Guía oficial de Tigo' },
    },
    {
        nombre: 'Viva',
        pasos: [
            'Pedí tu eSIM por WhatsApp o en una tienda Viva, como titular de la línea y con tu cédula.',
            'Antes, verificá que tu IMEI esté registrado marcando *108#. La eSIM nueva cuesta unos 5 Bs; si cambiás tu chip actual por eSIM, es gratis. Dudas: 800-14-1414.',
        ],
        enlace: { url: 'https://ayuda.viva.com.bo/activa-tu-esim-sin-complicaciones-todo-lo-que-necesitas-saber-para-ios-y-android/', texto: 'Guía oficial de Viva' },
    },
];

function OperadorItem({ nombre, pasos, enlace }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
            >
                {nombre}
                {open
                    ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />}
            </button>
            {open && (
                <div className="pb-4">
                    <ol className="space-y-2">
                        {pasos.map((p, i) => (
                            <li key={i} className="flex gap-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                                    style={{ background: 'rgba(88,94,159,0.12)', color: 'var(--ab-navy)' }}>{i + 1}</span>
                                {p}
                            </li>
                        ))}
                    </ol>
                    <a href={enlace.url} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold"
                        style={{ color: 'var(--ab-navy)' }}>
                        {enlace.texto} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            )}
        </div>
    );
}

export default function GuiaEsim() {
    return (
        <div className="max-w-2xl">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Este equipo usa <strong>eSIM</strong> (chip virtual): no lleva un chip físico. Activás tu línea con un
                código QR que te da tu operador. Es el mismo proceso en iPhone y Android.
            </p>

            <div className="mt-5 space-y-3">
                {PASOS.map(({ Icon, texto }, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl p-4" style={{ background: 'var(--surface-muted)' }}>
                        <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} strokeWidth={1.75} />
                        <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{texto}</span>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--surface-muted)' }}>
                <p className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Escaneá el código QR</p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <strong>En iPhone:</strong> Configuración → Datos celulares (o Red celular) → Agregar eSIM → Usar
                    código QR.<br />
                    <strong>En Android:</strong> Ajustes → Conexiones → Administrador de SIM → Añadir eSIM → Escanear
                    el código QR.
                </p>
            </div>

            <p className="mt-6 mb-2 text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                Cómo pedirla según tu operador
            </p>
            <div className="rounded-xl border px-5" style={{ borderColor: 'var(--border-light)' }}>
                {OPERADORES.map((o) => <OperadorItem key={o.nombre} {...o} />)}
            </div>

            <p className="mt-4 text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Los pasos y requisitos los define cada operador y pueden cambiar; ante cualquier duda, confirmá en la
                guía oficial o en una tienda del operador.
            </p>
        </div>
    );
}
