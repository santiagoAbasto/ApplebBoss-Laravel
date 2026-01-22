import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

export default function Index({
  celulares = [],
  computadoras = [],
  productosGenerales = [],
  productosApple = [],
}) {
  const [activeTab, setActiveTab] = useState('celulares');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // ✅ usado correctamente

  const tabs = {
    celulares: { label: 'Celulares', data: celulares?.data || [], meta: celulares?.meta, links: celulares?.links },
    computadoras: { label: 'Computadoras', data: computadoras?.data || [], meta: computadoras?.meta, links: computadoras?.links },
    productosGenerales: { label: 'Productos Generales', data: productosGenerales?.data || [], meta: productosGenerales?.meta, links: productosGenerales?.links },
    productosApple: { label: 'Productos Apple', data: productosApple?.data || [], meta: productosApple?.meta, links: productosApple?.links },
  };

  const isMobileTab = activeTab === 'celulares' || activeTab === 'productosApple';

  const filteredProducts = useMemo(() => {
    const currentData = tabs[activeTab]?.data || [];
    const term = debouncedSearchTerm.toLowerCase();

    const results = currentData.filter(item => {
      if (!term) return true;

      return (
        item.modelo?.toLowerCase().includes(term) ||
        item.nombre?.toLowerCase().includes(term) ||
        (!isMobileTab && (
          item.numero_serie?.toLowerCase()?.includes(term) ||
          item.codigo?.toLowerCase()?.includes(term)
        )) ||
        item.imei_1?.toLowerCase()?.includes(term) ||
        item.imei_2?.toLowerCase()?.includes(term)
      );
    });

    // Si hay búsqueda, mostrar todos los resultados. Si no, limitar a 10 para rendimiento.
    return results;
  }, [debouncedSearchTerm, activeTab, tabs, isMobileTab]);

  const renderTableCell = (item, key, defaultValue = '-') => {
    const value = item[key];
    if (typeof value === 'number' && (key === 'precio_venta' || key === 'precio_costo')) {
      return `Bs ${value.toLocaleString()}`;
    }
    return value || defaultValue;
  };

  const getColSpan = () => {
    if (isMobileTab || activeTab === 'computadoras') return 12;
    if (activeTab === 'productosGenerales') return 8;
    return 10;
  };

  const chipEstadoProducto = (estado) => {
    const base = 'px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border';
    if (estado === 'disponible') return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    if (estado === 'vendido') return `${base} bg-rose-50 text-rose-700 border-rose-200`;
    return `${base} bg-slate-50 text-slate-600 border-slate-200`;
  };

  const chipEstadoImei = (estado) => {
    const base = 'px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border';
    if (estado === 'activo') return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    if (estado === 'bloqueado') return `${base} bg-rose-50 text-rose-700 border-rose-200`;
    return `${base} bg-slate-50 text-slate-600 border-slate-200`;
  };

    const formatPaginationLabel = (label) => {
      if (label.includes('previous')) return '← Anterior';
      if (label.includes('next')) return 'Siguiente →';
      return label;
    };


  return (
    <VendedorLayout>
      <Head title="Inventario" />

      {/* CONTENEDOR GENERAL estilo SaaS */}
      <div className="space-y-6">
        {/* HEADER */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Inventario Disponible
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Consulta los productos en stock. Solo lectura.
            </p>
          </div>

          {/* TABS */}
          <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3 overflow-x-auto whitespace-nowrap">
            {Object.entries(tabs).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setSearchTerm('');
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
                  ${activeTab === key
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/30'
                    : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Buscar por modelo, IMEI, serie o código..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm sm:text-base
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400
                         bg-white shadow-sm transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <i className="fas fa-search text-slate-400"></i>
            </div>

            {/* Hint */}
            <div className="mt-2 text-xs text-slate-500">
              Tip: probá con <span className="font-semibold">IMEI</span>, <span className="font-semibold">serie</span>, <span className="font-semibold">código</span> o <span className="font-semibold">modelo</span>.
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Modelo / Nombre</th>

                  {activeTab === 'computadoras' && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Procesador</th>
                  )}

                  {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Capacidad</th>
                  )}

                  {activeTab !== 'productosGenerales' && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Color</th>
                  )}

                  {(activeTab === 'celulares' || activeTab === 'computadoras' || activeTab === 'productosApple') && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Batería</th>
                  )}

                  {activeTab === 'computadoras' && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">RAM</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Almacenamiento</th>
                    </>
                  )}

                  {activeTab === 'productosGenerales' && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tipo</th>
                  )}

                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Precio Venta</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Precio Costo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Procedencia</th>

                  {!(activeTab === 'celulares' || activeTab === 'productosApple') && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Código / Serie</th>
                  )}

                  {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">IMEI 1</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">IMEI 2</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Estado IMEI</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item, i) => (
                    <tr
                      key={item.id}
                      className="hover:bg-emerald-50/40 transition duration-150 ease-in-out"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">{i + 1}</td>

                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                        {item.modelo || item.nombre || '-'}
                      </td>

                      {activeTab === 'computadoras' && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {renderTableCell(item, 'procesador')}
                        </td>
                      )}

                      {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {renderTableCell(item, 'capacidad')}
                        </td>
                      )}

                      {activeTab !== 'productosGenerales' && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {renderTableCell(item, 'color')}
                        </td>
                      )}

                      {(activeTab === 'celulares' || activeTab === 'computadoras' || activeTab === 'productosApple') && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {renderTableCell(item, 'bateria')}
                        </td>
                      )}

                      {activeTab === 'computadoras' && (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                            {renderTableCell(item, 'ram')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                            {renderTableCell(item, 'almacenamiento')}
                          </td>
                        </>
                      )}

                      {activeTab === 'productosGenerales' && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {renderTableCell(item, 'tipo')}
                        </td>
                      )}

                      <td className="px-4 py-3 whitespace-nowrap text-emerald-700 font-extrabold">
                        {renderTableCell(item, 'precio_venta')}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-rose-700 font-extrabold">
                        {renderTableCell(item, 'precio_costo')}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={chipEstadoProducto(item.estado)}>
                          {item.estado
                            ? item.estado.charAt(0).toUpperCase() + item.estado.slice(1)
                            : '-'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {renderTableCell(item, 'procedencia')}
                      </td>

                      {!(activeTab === 'celulares' || activeTab === 'productosApple') && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {item.codigo || item.numero_serie || '-'}
                        </td>
                      )}

                      {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                            {renderTableCell(item, 'imei_1')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                            {renderTableCell(item, 'imei_2')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={chipEstadoImei(item.estado_imei)}>
                              {item.estado_imei
                                ? item.estado_imei.charAt(0).toUpperCase() + item.estado_imei.slice(1)
                                : '-'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={getColSpan()} className="text-center px-4 py-12 text-slate-400 italic">
                      <div className="flex flex-col items-center justify-center">
                        <i className="fas fa-box-open fa-2x mb-3"></i>
                        No se encontraron productos disponibles o que coincidan con tu búsqueda.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINACIÓN (MISMA LÓGICA, SOLO ESTILO) */}
            {tabs[activeTab]?.links && tabs[activeTab]?.links.length > 1 && (
              <div className="flex justify-center gap-2 flex-wrap p-5 border-t border-slate-200 bg-white">
                {tabs[activeTab].links.map((link, i) => (
                  <button
                    key={i}
                    disabled={!link.url}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition border
          ${link.active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                      }
          ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                    onClick={() => {
                      if (link.url) window.location.href = link.url;
                    }}
                  >
                    {formatPaginationLabel(link.label)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </VendedorLayout>
  );
}
