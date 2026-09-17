import { useState } from 'react';
import { Check, CircleCheck, CircleDashed, Copy, X } from 'lucide-react';
import { Input, Switch, buttonCls } from '@/Components/Admin/ui';
import { DIAS, normalizarHorario } from '@/Components/Store/horario';
import { FichaUbicacion, MapaUbicacion, SelectorLocales } from '@/Components/Store/Ubicacion';
import { useNombreTienda } from '@/Components/Store/tienda';

// Piezas de Tienda online → Ubicaciones: el horario día por día, lo que le falta a cada local, la vista previa de
// «Dónde estamos» y la guía para cargar un local que dé confianza.

/** Los siete días cerrados: el punto de partida de un local sin horario. */
export const horarioVacio = () => DIAS.map((_, i) => ({ dia: i + 1, abierto: false, tramos: [] }));

/** Acepta el código completo de «Insertar un mapa» o solo la dirección; devuelve la dirección si es un mapa de Google. */
export function mapaDesdeTexto(texto) {
  const t = (texto ?? '').trim();
  const src = t.match(/src=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, '&') ?? t;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(src) ? src : null;
}

const plano = (t) => (t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Una dirección que solo dice la ciudad («Cochabamba, Bolivia») no sirve para llegar. */
export const soloCiudad = (direccion, ciudad, pais) => {
  const d = plano(direccion);
  return !d || d === plano(ciudad) || d === plano(`${ciudad} ${pais}`);
};

/** Lo que necesita un local para que el cliente llegue sin preguntar. */
export const DATOS = [
  ['direccion', 'Dirección con calle y número'],
  ['horario', 'Horario'],
  ['contacto', 'Teléfono o WhatsApp'],
  ['mapa', 'Mapa de Google'],
  ['como_llegar', 'Enlace «Cómo llegar»'],
];

/** Qué le falta a un local (con los nombres de campo del formulario). `contacto` es el WhatsApp de la tienda. */
export function faltanDatos(u, contacto = {}) {
  const tieneWhatsapp = contacto.whatsapp_activo && ((u.whatsapp ?? '').trim() || contacto.whatsapp_numero);
  const falta = {
    direccion: soloCiudad(u.address, u.city, u.country),
    horario: !normalizarHorario(u.horarios) && !(u.hours ?? '').trim(),
    contacto: !(u.phone ?? '').trim() && !tieneWhatsapp,
    mapa: !mapaDesdeTexto(u.map_embed_url),
    como_llegar: !(u.map_link_url ?? '').trim(),
  };

  return DATOS.filter(([clave]) => falta[clave]).map(([clave, label]) => ({ clave, label }));
}

/** Los datos del formulario con la forma que recibe la tienda, para la vista previa mientras se escribe. */
export function aPublico(d) {
  const telefono = (d.phone ?? '').trim();
  const digitos = telefono.replace(/\D/g, '');
  const internacional = telefono.startsWith('+') || (digitos.startsWith('591') && digitos.length > 8);
  const boliviano = !internacional && (d.country ?? '').trim().toLowerCase() === 'bolivia' && digitos.length === 8;

  return {
    id: d.id ?? 'nuevo',
    nombre: (d.name ?? '').trim() || 'Nombre del local',
    direccion: d.address,
    ciudad: d.city,
    pais: d.country,
    descripcion: (d.description ?? '').trim() || null,
    horarios: d.horarios ?? [],
    horario_nota: (d.hours ?? '').trim() || null,
    telefono: telefono || null,
    telefono_url: digitos ? `tel:${internacional ? '+' : boliviano ? '+591' : ''}${digitos}` : null,
    mapa: mapaDesdeTexto(d.map_embed_url),
    como_llegar: (d.map_link_url ?? '').trim() || null,
  };
}

/** Cada dato con su tilde o su «Falta». */
export function ListaDatos({ faltan = [] }) {
  const claves = new Set(faltan.map((f) => f.clave));

  return (
    <ul className="space-y-2">
      {DATOS.map(([clave, label]) => {
        const falta = claves.has(clave);
        return (
          <li key={clave} className="flex items-center gap-2 text-[13px]">
            {falta
              ? <CircleDashed className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              : <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />}
            <span className={falta ? 'font-semibold text-slate-800' : 'text-slate-500'}>{label}</span>
            <span className={`ml-auto text-[11px] font-bold ${falta ? 'text-amber-700' : 'text-emerald-700'}`}>{falta ? 'Falta' : 'Listo'}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Lo que se ve mal en un día mientras se escribe (lo mismo que después revisa el servidor). */
function problemaDelDia(d) {
  if (!d.abierto) return null;
  const [manana, tarde] = d.tramos;
  if (d.tramos.some((t) => t.abre && t.cierra && t.cierra <= t.abre)) return 'La hora de cierre tiene que ser después de la de apertura.';
  if (manana?.cierra && tarde?.abre && tarde.abre < manana.cierra) return 'La tarde tiene que empezar después de que termina la mañana.';
  return null;
}

/**
 * El horario de la semana: cada día abierto o cerrado, con uno o dos tramos (mañana y tarde).
 * Los tramos de un día cerrado se conservan por si se vuelve a abrir, pero no se guardan.
 */
export function EditorHorario({ valor, onChange, errores = {} }) {
  const dias = valor?.length === 7 ? valor : horarioVacio();
  const cambiar = (i, cambios) => onChange(dias.map((d, j) => (j === i ? { ...d, ...cambios } : d)));
  const cambiarTramo = (i, k, campo, v) => cambiar(i, { tramos: dias[i].tramos.map((t, n) => (n === k ? { ...t, [campo]: v } : t)) });
  const lunes = dias[0];
  const copiarLunes = () => onChange(dias.map((d, i) => (i >= 1 && i <= 4
    ? { ...d, abierto: lunes.abierto, tramos: lunes.tramos.map((t) => ({ ...t })) }
    : d)));

  return (
    <div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {dias.map((d, i) => {
          const error = errores[`horarios.${i}`];
          const problema = error ? null : problemaDelDia(d);
          return (
            <div key={d.dia} className={`px-4 py-3 ${d.abierto ? '' : 'bg-slate-50/60'}`}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="w-[5.5rem] text-sm font-bold text-slate-800">{DIAS[i]}</span>
                <label className="flex w-[6.5rem] cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-600">
                  <Switch
                    checked={d.abierto}
                    label={`${DIAS[i]} abierto`}
                    onChange={(v) => cambiar(i, { abierto: v, tramos: v && d.tramos.length === 0 ? [{ abre: '', cierra: '' }] : d.tramos })}
                  />
                  {d.abierto ? 'Abierto' : 'Cerrado'}
                </label>

                {d.abierto && (
                  // En el celular cada tramo va en su propia línea, debajo del día
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-0 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                    {d.tramos.map((t, k) => (
                      <div key={k} className="flex items-center gap-1.5">
                        {k > 0 && <span className="text-xs font-semibold text-slate-400">y</span>}
                        <Input type="time" value={t.abre} aria-label={`${DIAS[i]}: abre a las`} className="h-10 min-w-0 flex-1 sm:w-[7.5rem] sm:flex-none"
                          onChange={(e) => cambiarTramo(i, k, 'abre', e.target.value)} />
                        <span className="text-xs text-slate-500">a</span>
                        <Input type="time" value={t.cierra} aria-label={`${DIAS[i]}: cierra a las`} className="h-10 min-w-0 flex-1 sm:w-[7.5rem] sm:flex-none"
                          onChange={(e) => cambiarTramo(i, k, 'cierra', e.target.value)} />
                        {k > 0 && (
                          <button type="button" onClick={() => cambiar(i, { tramos: d.tramos.slice(0, 1) })} aria-label={`Quitar la tarde del ${DIAS[i].toLowerCase()}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {d.tramos.length < 2 && (
                      <button type="button" onClick={() => cambiar(i, { tramos: [...d.tramos, { abre: '', cierra: '' }] })}
                        className="self-start text-xs font-bold text-[#585E9F] hover:underline sm:self-auto">
                        + Horario de tarde
                      </button>
                    )}
                  </div>
                )}
              </div>
              {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
              {problema && <p className="mt-1.5 text-xs font-semibold text-amber-700">{problema}</p>}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={copiarLunes} disabled={!lunes.abierto} className={buttonCls('secondary', 'mt-3 h-9 px-3 text-xs')}>
        <Copy className="h-3.5 w-3.5" /> Copiar el lunes de martes a viernes
      </button>
    </div>
  );
}

/** Los pasos exactos para sacar el mapa y el enlace de Google Maps (botones de la ayuda oficial de Google). */
export function GuiaMapa() {
  const pasos = [
    ['Abre Google Maps en la computadora.', 'En la app del celular no está la opción de insertar un mapa.'],
    ['Busca tu tienda y toca «Compartir».', 'Si todavía no figura en Google Maps, búscala por su dirección.'],
    ['Elige «Insertar un mapa» y toca «Copiar HTML».', 'Pégalo en «Código del mapa». Se guarda solo la dirección del mapa.'],
    ['Vuelve a «Enviar un enlace» y toca «Copiar enlace».', 'Pégalo en «Cómo llegar»: le abre la ruta al cliente en su celular.'],
  ];

  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {pasos.map(([paso, detalle], i) => (
        <li key={paso} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#011446] text-[11px] font-bold text-white">{i + 1}</span>
          <span>
            <span className="block text-[13px] font-semibold text-slate-800">{paso}</span>
            <span className="block text-xs leading-relaxed text-slate-500">{detalle}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** «Dónde estamos» como sale en el inicio, en chico: título, locales para elegir, datos y mapa. */
export function VistaUbicaciones({ locales = [], titulo, subtitulo }) {
  const [actual, setActual] = useState(0);
  const nombre = useNombreTienda();
  const local = locales[actual] ?? locales[0];

  if (!local) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
        Sin ubicaciones encendidas, la tienda no dibuja esta sección.
      </p>
    );
  }

  const ciudades = [...new Set(locales.map((l) => l.ciudad).filter(Boolean))];
  const bajada = subtitulo || local.descripcion;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#585E9F]">Visita {nombre}</p>
        <p className="mt-1 text-lg font-black leading-tight tracking-tight text-[#0D0D1A]">
          {titulo || (ciudades.length === 1 ? `Estamos en ${ciudades[0]}` : 'Dónde estamos')}
        </p>
        {bajada && <p className="mt-1 text-xs leading-relaxed text-slate-500">{bajada}</p>}
        {locales.length > 1 && (
          <div className="mt-3">
            <SelectorLocales compacta locales={locales} actual={Math.min(actual, locales.length - 1)} onChange={setActual} />
          </div>
        )}
        <div className="mt-4">
          <FichaUbicacion compacta local={local} />
        </div>
      </div>
      {local.mapa ? (
        <div className="px-4 pb-4">
          <MapaUbicacion local={local} alto={190} animado={false} />
        </div>
      ) : (
        <p className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Sin mapa: la tienda muestra los datos solos, a lo ancho.
        </p>
      )}
    </div>
  );
}

const CONSEJOS = [
  {
    titulo: 'Una dirección para llegar sin preguntar',
    texto: 'Calle, número y entre qué calles. Si el local está dentro de una galería, dilo.',
    bien: 'Av. Heroínas 456, entre Lanza y Antezana',
    mal: 'Centro de Cochabamba',
  },
  {
    titulo: 'El horario real, día por día',
    texto: 'Con él, la tienda avisa si estás abierto. Los feriados van en la aclaración.',
    bien: 'Sábado: 9:00 a 13:00 · Feriados: cerrado',
    mal: 'Atendemos todos los días',
  },
  {
    titulo: 'Igual que en Google Maps',
    texto: 'Nombre, dirección, teléfono y horario escritos igual que en tu perfil de Google: si no coinciden, el cliente duda y Google también.',
    bien: 'Apple Boss Cochabamba, acá y en Google',
    mal: 'Un nombre acá y otro en Google',
  },
];

/** La guía para cargar un local que dé confianza. */
export function GuiaUbicaciones() {
  return (
    <>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {CONSEJOS.map((c, i) => (
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
      <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
        <span className="font-bold text-slate-800">¿Tu tienda no aparece en Google Maps?</span> Créala gratis en el Perfil de
        Empresa de Google (business.google.com). Es lo que el cliente ve cuando busca «Apple Boss» en su celular.
      </p>
    </>
  );
}
