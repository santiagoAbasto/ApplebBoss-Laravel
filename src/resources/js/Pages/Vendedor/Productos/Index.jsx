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

  return (
    <VendedorLayout>
      <Head title="Inventario" />

      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Inventario Disponible</h1>
          <p className="text-base text-gray-500 mt-1">Consulta los productos en stock. Solo lectura.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto whitespace-nowrap">
        {Object.entries(tabs).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setSearchTerm('');
            }}
            className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-all duration-200 ease-in-out
              ${activeTab === key
                ? 'bg-blue-600 text-white shadow-md border-b-2 border-blue-600'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Buscar por modelo, IMEI, serie o código..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <i className="fas fa-search text-gray-400"></i>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Modelo / Nombre</th>
                {activeTab === 'computadoras' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Procesador</th>}
                {(activeTab === 'celulares' || activeTab === 'productosApple') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacidad</th>}
                {activeTab !== 'productosGenerales' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Color</th>}
                {(activeTab === 'celulares' || activeTab === 'computadoras' || activeTab === 'productosApple') && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batería</th>
                )}
                {activeTab === 'computadoras' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RAM</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Almacenamiento</th>
                  </>
                )}
                {activeTab === 'productosGenerales' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio Venta</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio Costo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Procedencia</th>
                {!(activeTab === 'celulares' || activeTab === 'productosApple') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código / Serie</th>
                )}
                {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IMEI 1</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IMEI 2</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado IMEI</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((item, i) => (
                  <tr key={item.id} className="hover:bg-blue-50 transition duration-150 ease-in-out">
                    <td className="px-4 py-3 whitespace-nowrap">{i + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{item.modelo || item.nombre || '-'}</td>
                    {activeTab === 'computadoras' && <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'procesador')}</td>}
                    {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                      <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'capacidad')}</td>
                    )}
                    {activeTab !== 'productosGenerales' && <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'color')}</td>}
                    {(activeTab === 'celulares' || activeTab === 'computadoras' || activeTab === 'productosApple') && (
                      <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'bateria')}</td>
                    )}
                    {activeTab === 'computadoras' && (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'ram')}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'almacenamiento')}</td>
                      </>
                    )}
                    {activeTab === 'productosGenerales' && <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'tipo')}</td>}
                    <td className="px-4 py-3 whitespace-nowrap text-green-600 font-semibold">{renderTableCell(item, 'precio_venta')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-red-600 font-semibold">{renderTableCell(item, 'precio_costo')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${item.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                          item.estado === 'vendido' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {item.estado ? item.estado.charAt(0).toUpperCase() + item.estado.slice(1) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'procedencia')}</td>
                    {!(activeTab === 'celulares' || activeTab === 'productosApple') && (
                        <td className="px-4 py-3 whitespace-nowrap">{item.codigo || item.numero_serie || '-'}</td>
                    )}
                    {(activeTab === 'celulares' || activeTab === 'productosApple') && (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'imei_1')}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{renderTableCell(item, 'imei_2')}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${item.estado_imei === 'activo' ? 'bg-blue-100 text-blue-800' :
                                  item.estado_imei === 'bloqueado' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                                {item.estado_imei ? item.estado_imei.charAt(0).toUpperCase() + item.estado_imei.slice(1) : '-'}
                            </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={getColSpan()} className="text-center px-4 py-8 text-gray-400 italic">
                    <div className="flex flex-col items-center justify-center">
                        <i className="fas fa-box-open fa-2x mb-3"></i>
                        No se encontraron productos disponibles o que coincidan con su búsqueda.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {tabs[activeTab]?.links && tabs[activeTab]?.links.length > 1 && (
  <div className="flex justify-center mt-6 flex-wrap gap-2">
    {tabs[activeTab].links.map((link, i) => (
      <button
        key={i}
        disabled={!link.url}
        dangerouslySetInnerHTML={{ __html: link.label }}
        className={`px-3 py-1 rounded text-sm font-medium transition
          ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        onClick={() => {
          if (link.url) window.location.href = link.url;
        }}
      />
    ))}
  </div>
)}

        </div>
      </div>
    </VendedorLayout>
  );
}