import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    modelo: '',
    capacidad: '',
    bateria: '',
    color: '',
    numero_serie: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    tiene_imei: false,
    imei_1: '',
    imei_2: '',
    estado_imei: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.productos-apple.store'));
  };

  return (
    <AdminLayout>
      <Head title="Crear Producto Apple" />

      <div className="max-w-5xl mx-auto mt-6">
        <h1 className="text-3xl font-bold text-[#003366] mb-6">📱 Registrar Producto Apple</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow">
          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Modelo</label>
            <input
              type="text"
              value={data.modelo}
              onChange={e => setData('modelo', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.modelo && <p className="text-sm text-red-600 mt-1">{errors.modelo}</p>}
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacidad</label>
            <input
              type="text"
              value={data.capacidad}
              onChange={e => setData('capacidad', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.capacidad && <p className="text-sm text-red-600 mt-1">{errors.capacidad}</p>}
          </div>

          {/* Batería */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Batería</label>
            <input
              type="text"
              value={data.bateria}
              onChange={e => setData('bateria', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.bateria && <p className="text-sm text-red-600 mt-1">{errors.bateria}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="text"
              value={data.color}
              onChange={e => setData('color', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.color && <p className="text-sm text-red-600 mt-1">{errors.color}</p>}
          </div>

          {/* Serie */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de serie / IMEI general</label>
            <input
              type="text"
              value={data.numero_serie}
              onChange={e => setData('numero_serie', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.numero_serie && <p className="text-sm text-red-600 mt-1">{errors.numero_serie}</p>}
          </div>

          {/* Procedencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Procedencia</label>
            <input
              type="text"
              value={data.procedencia}
              onChange={e => setData('procedencia', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.procedencia && <p className="text-sm text-red-600 mt-1">{errors.procedencia}</p>}
          </div>

          {/* Precio costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio costo (Bs)</label>
            <input
              type="number"
              value={data.precio_costo}
              onChange={e => setData('precio_costo', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.precio_costo && <p className="text-sm text-red-600 mt-1">{errors.precio_costo}</p>}
          </div>

          {/* Precio venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio venta (Bs)</label>
            <input
              type="number"
              value={data.precio_venta}
              onChange={e => setData('precio_venta', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.precio_venta && <p className="text-sm text-red-600 mt-1">{errors.precio_venta}</p>}
          </div>

          {/* Tiene IMEI */}
          <div>
            <label className="block text-sm font-medium text-gray-700">¿Tiene IMEI?</label>
            <select
              value={data.tiene_imei}
              onChange={e => setData('tiene_imei', e.target.value === 'true')}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
            {errors.tiene_imei && <p className="text-sm text-red-600 mt-1">{errors.tiene_imei}</p>}
          </div>

          {/* Campos condicionales si tiene IMEI */}
          {data.tiene_imei && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">IMEI 1</label>
                <input
                  type="text"
                  value={data.imei_1}
                  onChange={e => setData('imei_1', e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                />
                {errors.imei_1 && <p className="text-sm text-red-600 mt-1">{errors.imei_1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IMEI 2</label>
                <input
                  type="text"
                  value={data.imei_2}
                  onChange={e => setData('imei_2', e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                />
                {errors.imei_2 && <p className="text-sm text-red-600 mt-1">{errors.imei_2}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Estado del IMEI</label>
                <select
                  value={data.estado_imei}
                  onChange={e => setData('estado_imei', e.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option>Libre</option>
                  <option>Registro seguro</option>
                  <option>IMEI 1 libre y IMEI 2 registrado</option>
                  <option>IMEI 2 libre y IMEI 1 registrado</option>
                </select>
                {errors.estado_imei && <p className="text-sm text-red-600 mt-1">{errors.estado_imei}</p>}
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-[#003366] text-white py-3 px-6 rounded-lg font-semibold shadow hover:bg-blue-900 transition disabled:opacity-50"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
