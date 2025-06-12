import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Edit({ productoApple }) {
  const { data, setData, put, processing, errors } = useForm({
    modelo: productoApple.modelo || '',
    capacidad: productoApple.capacidad || '',
    bateria: productoApple.bateria || '',
    color: productoApple.color || '',
    numero_serie: productoApple.numero_serie || '',
    procedencia: productoApple.procedencia || '',
    precio_costo: productoApple.precio_costo || '',
    precio_venta: productoApple.precio_venta || '',
    tiene_imei: productoApple.tiene_imei || false,
    imei_1: productoApple.imei_1 || '',
    imei_2: productoApple.imei_2 || '',
    estado_imei: productoApple.estado_imei || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.productos-apple.update', productoApple.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Producto Apple" />

      <div className="max-w-5xl mx-auto mt-6">
        <h1 className="text-3xl font-bold text-[#003366] mb-6">✏️ Editar Producto Apple</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow">
          {[
            { name: 'modelo', label: 'Modelo' },
            { name: 'capacidad', label: 'Capacidad' },
            { name: 'bateria', label: 'Batería' },
            { name: 'color', label: 'Color' },
            { name: 'numero_serie', label: 'Número de serie / IMEI general' },
            { name: 'procedencia', label: 'Procedencia' },
            { name: 'precio_costo', label: 'Precio costo', type: 'number' },
            { name: 'precio_venta', label: 'Precio venta', type: 'number' },
          ].map(({ name, label, type = 'text' }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type={type}
                value={data[name]}
                onChange={e => setData(name, e.target.value)}
                className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
              />
              {errors[name] && <p className="text-sm text-red-600 mt-1">{errors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700">¿Tiene IMEI?</label>
            <select
              value={data.tiene_imei ? 'true' : 'false'}
              onChange={e => setData('tiene_imei', e.target.value === 'true')}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
            {errors.tiene_imei && <p className="text-sm text-red-600 mt-1">{errors.tiene_imei}</p>}
          </div>

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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
