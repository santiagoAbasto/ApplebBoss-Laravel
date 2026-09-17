import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { Camera, CheckCircle2, Globe, Images, Search, Smartphone, Store, X } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, EmptyState, PageHeader, Toast, buttonCls, inputCls, useToast } from '@/Components/Admin/ui';
import { Aviso, ChipsEstado, Stat } from '@/Components/Admin/inventario';
import ModeloVisual from '@/Components/Store/ModeloVisual';

// Tienda online → Modelos y fotos: la base de modelos de referencia con el estado de la foto de cada uno.
// La foto alimenta la comparativa pública; las fichas no se editan acá (salen de las páginas oficiales de cada marca).
// Hay iPhone, Mac, PC (laptops con Windows), productos Apple (iPad, Apple Watch, AirPods y accesorios de Apple) y
// accesorios (cargadores, vidrios, protectores, fundas, cables y accesorios de marca): el filtro aparece cuando la base
// tiene más de una familia.

const TIPOS = [
  { key: 'todos', label: 'Todos los tipos' },
  { key: 'iphone', label: 'iPhone' },
  { key: 'mac', label: 'Mac' },
  { key: 'pc', label: 'PC' },
  { key: 'ipad', label: 'iPad' },
  { key: 'watch', label: 'Apple Watch' },
  { key: 'airpods', label: 'AirPods' },
  { key: 'accesorio_apple', label: 'Accesorios Apple' },
  { key: 'otra_marca', label: 'Otras marcas' },
  { key: 'cargador', label: 'Cargadores' },
  { key: 'vidrio', label: 'Vidrios' },
  { key: 'protector', label: 'Protectores' },
  { key: 'funda', label: 'Fundas' },
  { key: 'cable', label: 'Cables' },
  { key: 'accesorio', label: 'Accesorios' },
];

/** Familias de accesorios: se agrupan por familia (no tienen año) y en el resumen cuentan juntas. */
const ACCESORIOS = ['cargador', 'vidrio', 'protector', 'funda', 'cable', 'accesorio'];
const etiquetaFamilia = (familia) => TIPOS.find((t) => t.key === familia)?.label ?? 'Accesorios';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'sin_foto', label: 'Sin foto', alerta: true },
  { key: 'con_foto', label: 'Con foto' },
  { key: 'en_tienda', label: 'En tienda' },
];

const CUMPLE = {
  todos: () => true,
  sin_foto: (m) => !m.foto,
  con_foto: (m) => Boolean(m.foto),
  en_tienda: (m) => m.en_tienda > 0,
};

const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Los equipos por año; los accesorios, que no tienen año, por familia («Cargadores», «Vidrios»…). */
function agruparPorAnio(lista) {
  const grupos = [];
  for (const m of lista) {
    const clave = ACCESORIOS.includes(m.familia) ? etiquetaFamilia(m.familia) : m.anio;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.anio === clave) ultimo.lista.push(m);
    else grupos.push({ anio: clave, lista: [m] });
  }
  return grupos;
}

function TarjetaModelo({ m }) {
  return (
    <Link href={route('admin.modelos.show', m.slug)}
      className="group flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#585E9F]/40 hover:shadow-[0_12px_28px_-18px_rgba(1,20,70,0.45)]">
      <div className="relative">
        <ModeloVisual modelo={{ nombre: m.nombre, imagen: m.foto, visual: m.visual }} tipo={m.tipo} className="aspect-[5/6] w-full rounded-xl" />
        <span className="absolute left-2 top-2">
          {m.foto
            ? <Badge tone="emerald"><CheckCircle2 className="h-3 w-3" /> Con foto</Badge>
            : <Badge tone="amber"><Camera className="h-3 w-3" /> Sin foto</Badge>}
        </span>
      </div>
      <p className="mt-3 truncate text-[15px] font-bold text-slate-900 group-hover:text-[#585E9F]">{m.nombre}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">
        {m.anio}{m.en_tienda > 0 ? ` · ${m.en_tienda} en tienda` : m.publicaciones > 0 ? ` · ${m.publicaciones} ${m.publicaciones === 1 ? 'publicación' : 'publicaciones'}` : ''}
      </p>
      <span className={buttonCls(m.foto ? 'secondary' : 'primary', 'mt-3 h-9 w-full px-3 text-xs')}>
        <Camera className="h-3.5 w-3.5" /> {m.foto ? 'Cambiar foto' : 'Subir foto'}
      </span>
    </Link>
  );
}

export default function Index({ modelos = [], comparativas = [] }) {
  const [toast] = useToast();
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [tipo, setTipo] = useState('todos');

  const conteoTipos = useMemo(() => Object.fromEntries(TIPOS.map((t) => [t.key, t.key === 'todos' ? modelos.length : modelos.filter((m) => m.familia === t.key).length])), [modelos]);
  const tipos = TIPOS.filter((t) => conteoTipos[t.key] > 0);
  const delTipo = useMemo(() => (tipo === 'todos' ? modelos : modelos.filter((m) => m.familia === tipo)), [modelos, tipo]);
  // Los accesorios cuentan juntos en el resumen: «38 iPhone, 16 Mac, 1 PC y 58 accesorios»
  const totalAccesorios = modelos.filter((m) => ACCESORIOS.includes(m.familia)).length;
  const partesTipos = [
    ...tipos.filter((t) => t.key !== 'todos' && !ACCESORIOS.includes(t.key)).map((t) => `${conteoTipos[t.key]} ${t.label}`),
    ...(totalAccesorios ? [`${totalAccesorios} accesorios`] : []),
  ];
  const resumenTipos = partesTipos.length > 1 ? `${partesTipos.slice(0, -1).join(', ')} y ${partesTipos.at(-1)}` : '';
  const conteo = useMemo(() => Object.fromEntries(Object.entries(CUMPLE).map(([k, f]) => [k, delTipo.filter(f).length])), [delTipo]);
  const visibles = useMemo(() => {
    const q = normalizar(texto.trim());
    return delTipo
      .filter(CUMPLE[filtro])
      .filter((m) => !q || [m.nombre, ...(m.alias ?? [])].some((n) => normalizar(n).includes(q)));
  }, [delTipo, filtro, texto]);
  const grupos = useMemo(() => agruparPorAnio(visibles), [visibles]);

  const total = modelos.length;
  const conFoto = modelos.filter(CUMPLE.con_foto).length;
  const sinFotoEnTienda = modelos.filter((m) => !m.foto && m.en_tienda > 0).length;
  const hayFiltros = filtro !== 'todos' || tipo !== 'todos' || texto.trim() !== '';
  const limpiar = () => { setTexto(''); setFiltro('todos'); setTipo('todos'); };

  return (
    <AdminLayout>
      <Head title="Modelos y fotos" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1400px] space-y-5">
        <PageHeader
          title="Modelos y fotos"
          subtitle="Las fichas oficiales de cada modelo y la foto que se ve en la comparativa de la tienda. Sube una foto por modelo: mientras no haya, se muestra una ilustración."
          actions={comparativas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {comparativas.map((c) => (
                <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
                  <Globe className="h-4 w-4" /> Comparativa {c.nombre}
                </a>
              ))}
            </div>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Smartphone} label="Modelos" value={total.toLocaleString('es-BO')}
            hint={resumenTipos || 'Fichas oficiales de cada marca'} />
          <Stat icon={CheckCircle2} label="Con foto" value={conFoto.toLocaleString('es-BO')} tone="emerald"
            hint={total ? `${Math.round((conFoto / total) * 100)} % del total` : '—'} />
          <Stat icon={Camera} label="Sin foto" value={(conteo.sin_foto ?? 0).toLocaleString('es-BO')} tone="lila" hint="Se ven con una ilustración" />
          <Stat icon={Store} label="En tienda" value={(conteo.en_tienda ?? 0).toLocaleString('es-BO')} tone="slate" hint="Modelos con equipos publicados" />
        </div>

        {sinFotoEnTienda > 0 && (
          <Aviso tono="amber" icon={Camera} accion="Ver cuáles" onAccion={() => { setTipo('todos'); setFiltro('en_tienda'); }}>
            <span className="font-bold">{sinFotoEnTienda === 1 ? 'Un modelo que tienes en tienda no tiene foto.' : `${sinFotoEnTienda} modelos que tienes en tienda no tienen foto.`}</span>{' '}
            Empieza por esos: son los que más se comparan.
          </Aviso>
        )}

        <AdminGuide id="modelos-fotos" title="¿Cómo cargo las fotos?" steps={[
          'Elige un modelo. Empieza por los que dicen «Sin foto» y por los que tienes en tienda.',
          'Sube la foto: el iPhone de dorso y las computadoras de frente y abiertas, en vertical, con fondo transparente o blanco, de 1200 × 1440 px o más.',
          'Revisa la vista previa y guarda. La comparativa la muestra al instante; «Siguiente sin foto» te lleva al próximo.',
        ]} tip="Las fichas técnicas no se editan acá: salen de las páginas oficiales de cada marca. Si ves un dato raro, avísale a quien administra la base." />

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar modelo"
              placeholder="Buscar modelo (por ejemplo 14 Plus, XS Max o Air M5)" className={`${inputCls} h-11 pl-10 pr-10`} />
            {texto && (
              <button type="button" onClick={() => setTexto('')} aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {tipos.length > 2 && (
            <ChipsEstado filtros={tipos} activo={tipo} conteo={conteoTipos} onChange={setTipo} etiqueta="Filtrar por tipo de equipo" />
          )}
          <ChipsEstado filtros={FILTROS} activo={filtro} conteo={conteo} onChange={setFiltro} />
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Images className="h-[18px] w-[18px] text-[#585E9F]" /> Modelos
              <span className="text-sm font-semibold text-slate-400">{visibles.length}</span>
            </h2>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className={buttonCls('ghost', 'h-8 px-2.5 text-xs')}>
                <X className="h-3.5 w-3.5" /> Quitar filtros
              </button>
            )}
          </div>

          {visibles.length === 0 ? (
            total === 0 ? (
              <EmptyState icon={Smartphone} title="Todavía no hay modelos cargados"
                text="La base se carga con el seeder de modelos de referencia (ver la guía del proyecto)." />
            ) : (
              <EmptyState icon={Search} title="Sin resultados" text="Prueba con otro nombre o quita los filtros."
                action={<button type="button" onClick={limpiar} className={buttonCls('secondary')}>Quitar filtros</button>} />
            )
          ) : (
            <div className="space-y-7 p-5">
              {grupos.map(({ anio, lista }) => (
                <div key={anio}>
                  <h3 className="mb-3 flex items-center gap-3 text-sm font-bold text-slate-500">
                    {anio}
                    <span className="h-px flex-1 bg-slate-100" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-400">{lista.length} {lista.length === 1 ? 'modelo' : 'modelos'}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {lista.map((m) => <TarjetaModelo key={m.id} m={m} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
