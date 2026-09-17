import { Check, Mail, ServerCog, TriangleAlert, Users, X } from 'lucide-react';
import { Badge, buttonCls } from '@/Components/Admin/ui';

// Piezas que comparten las tres pantallas del newsletter (Campañas, Suscriptores y Ajustes): el estado del correo
// del servidor, el estado de una campaña y las guías para escribir bien.

export const ESTADOS = {
  borrador:  { label: 'Borrador',  tono: 'slate',   texto: 'Todavía no se envió. Se puede editar y probar.' },
  enviando:  { label: 'Enviando',  tono: 'lila',    texto: 'Saliendo por lotes. Se puede detener.' },
  enviada:   { label: 'Enviada',   tono: 'emerald', texto: 'Terminó de salir.' },
  cancelada: { label: 'Cancelada', tono: 'amber',   texto: 'Se detuvo a mitad del envío.' },
};

export function EstadoCampana({ estado }) {
  const e = ESTADOS[estado] ?? { label: estado, tono: 'slate' };
  return <Badge tone={e.tono}>{e.label}</Badge>;
}

/** Barra de lo que ya salió de una campaña. */
export function Progreso({ enviados = 0, fallidos = 0, total = 0, progreso = 0 }) {
  if (!total) return <span className="text-slate-400">—</span>;

  return (
    <div className="min-w-[150px]">
      <div className="flex justify-between gap-2 text-xs tabular-nums text-slate-600">
        <span><span className="font-bold text-slate-800">{enviados.toLocaleString('es-BO')}</span> de {total.toLocaleString('es-BO')}</span>
        {fallidos > 0 && <span className="font-bold text-red-600">{fallidos} sin llegar</span>}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progreso}%` }} />
      </div>
    </div>
  );
}

/**
 * Lo que hace falta en el servidor para que los correos salgan de verdad.
 * En producción, lo único que queda por cargar es la clave de la cuenta de envío (MAIL_PASSWORD).
 */
export function EstadoDelServidor({ estado, compacto = false }) {
  const { correo, cola } = estado ?? {};
  if (!correo) return null;

  const filas = [
    {
      icon: Mail,
      titulo: 'Servidor de correo',
      listo: correo.listo,
      bien: `Los correos salen desde ${correo.desde}${correo.servidor ? ` por ${correo.servidor}` : ''}.`,
      mal: correo.falta,
    },
    {
      icon: ServerCog,
      titulo: 'Proceso de envío',
      listo: cola?.listo,
      bien: cola?.pendientes > 0
        ? `Atendiendo la cola: ${cola.pendientes} ${cola.pendientes === 1 ? 'envío' : 'envíos'} en camino.`
        : 'Listo y esperando campañas.',
      mal: cola?.falta,
    },
  ];

  return (
    <ul className={`grid gap-2 ${compacto ? '' : 'sm:grid-cols-2'}`}>
      {filas.map(({ icon: Icon, titulo, listo, bien, mal }) => (
        <li key={titulo} className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 ${listo ? 'border-slate-100' : 'border-amber-200 bg-amber-50'}`}>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${listo ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
            {listo ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className={`text-[13px] font-bold ${listo ? 'text-slate-800' : 'text-amber-900'}`}>{titulo}</p>
            <p className={`mt-0.5 text-xs leading-relaxed ${listo ? 'text-slate-500' : 'text-amber-800'}`}>{listo ? bien : mal}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** La lista de suscriptores, en una línea. */
export function ResumenLista({ activos = 0, bajas = 0 }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
      <Users className="h-4 w-4 text-[#585E9F]" />
      <span><span className="font-bold text-slate-800">{activos.toLocaleString('es-BO')}</span> {activos === 1 ? 'suscriptor activo' : 'suscriptores activos'}</span>
      {bajas > 0 && <span>· {bajas.toLocaleString('es-BO')} de baja</span>}
    </p>
  );
}

/** Tres consejos con un ejemplo bueno y uno a evitar, con el mismo formato del resto del panel. */
export function Consejos({ consejos, cierre }) {
  return (
    <>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {consejos.map((c, i) => (
          <li key={c.titulo} className="rounded-xl border border-slate-100 px-3.5 py-3">
            <p className="flex items-start gap-2 text-[13px] font-bold leading-snug text-slate-800">
              <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#011446] text-[11px] font-bold text-white">{i + 1}</span>
              {c.titulo}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{c.texto}</p>
            <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5 text-xs">
              <p className="flex items-start gap-1.5 text-emerald-700">
                <Check className="mt-px h-3.5 w-3.5 shrink-0" aria-label="Bien" /> <span>«{c.bien}»</span>
              </p>
              <p className="flex items-start gap-1.5 text-slate-400">
                <X className="mt-px h-3.5 w-3.5 shrink-0" aria-label="Evita" /> <span className="line-through decoration-slate-300">«{c.mal}»</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
      {cierre && <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">{cierre}</p>}
    </>
  );
}

export const CONSEJOS_CAMPANA = [
  {
    titulo: 'El asunto decide si lo abren',
    texto: 'Es lo único que se ve en la bandeja, y en el celular se corta cerca de los 45 caracteres. Di qué hay adentro, sin mayúsculas ni signos de más.',
    bien: 'Llegaron 6 iPhone 15 seminuevos · desde Bs 4.200',
    mal: '¡¡¡OFERTA IMPERDIBLE!!! NO TE LO PIERDAS 🔥🔥🔥',
  },
  {
    titulo: 'Una sola cosa por correo',
    texto: 'Un correo con un tema y un botón se lee entero. Si hay cinco temas, no se lee ninguno. Deja lo demás para la próxima campaña.',
    bien: 'Los equipos que llegaron esta semana + «Ver los 6 equipos»',
    mal: 'Equipos nuevos, servicio técnico, fundas, Trade-In y horarios de fin de año',
  },
  {
    titulo: 'Prueba antes de mandar',
    texto: 'Mándate una prueba y ábrela en el celular: ahí se lee el 8 de cada 10 correos. Mira que las fotos carguen y que el botón lleve a donde tiene que llevar.',
    bien: 'Prueba a tu correo → abrir en el celular → recién ahí «Enviar campaña»',
    mal: 'Escribir y enviar de una a los 800 suscriptores',
  },
];

export const CONSEJOS_LISTA = [
  {
    titulo: 'Solo quien te lo pidió',
    texto: 'Los correos que no pidieron recibir tus campañas los marcan como spam, y entonces tus correos dejan de llegar también a los demás. No compres listas ni cargues tu agenda del celular.',
    bien: 'Quien dejó su correo en la tienda o en el formulario del sitio',
    mal: 'Todos los contactos que tengo guardados',
  },
  {
    titulo: 'La baja se respeta sola',
    texto: 'Cada correo lleva su enlace para darse de baja, y quien lo usa no vuelve a recibir campañas. No lo reactives a mano: que se dé de baja es mejor que te marquen como spam.',
    bien: 'Dejarlo de baja y ganárselo de nuevo en la tienda',
    mal: 'Volver a activarlo porque «seguro se equivocó»',
  },
  {
    titulo: 'Una lista chica y viva rinde más',
    texto: 'Vale más mandarle a 200 personas que te conocen que a 2.000 que no. Si un correo rebota siempre, bórralo: los rebotes bajan la reputación de tu dominio.',
    bien: '200 clientes que compraron o consultaron',
    mal: '2.000 correos juntados de cualquier lado',
  },
];

export const AVISO_SIN_CORREO = {
  icon: TriangleAlert,
  titulo: 'Los correos todavía no pueden salir.',
};

/** Botón de enlace que respeta la línea del panel (para descargas y ayudas externas). */
export function Enlace({ href, children, ...props }) {
  return (
    <a href={href} className={buttonCls('secondary', 'h-11 px-4')} {...props}>
      {children}
    </a>
  );
}
