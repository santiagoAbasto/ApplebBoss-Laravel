import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CreateProductoGeneral() {
  const { data, setData, post, processing, errors } = useForm({
    codigo: '',
    tipo: '',
    nombre: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.productos-generales.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Producto General" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📦 Registrar Producto General</h1>
        <Link
          href={route('admin.productos-generales.index')}
          className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm font-semibold rounded-md"
        >
          ← Volver
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Código */}
          <div>
            <label className="block font-medium text-sm text-gray-700">Código</label>
            <input
              type="text"
              value={data.codigo}
              onChange={(e) => setData('codigo', e.target.value)}
              disabled={processing}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.codigo && <div className="text-red-600 text-sm mt-1">{errors.codigo}</div>}
          </div>

          {/* Tipo */}
          <div>
            <label className="block font-medium text-sm text-gray-700">Tipo</label>
            <select
              value={data.tipo}
              onChange={(e) => setData('tipo', e.target.value)}
              disabled={processing}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Selecciona --</option>
              <option value="vidrio_templado">Vidrio Templado</option>
              <option value="vidrio_camara">Vidrio de Cámara</option>
              <option value="funda">Funda</option>
              <option value="accesorio">Accesorio</option>
              <option value="cargador_5w">Cargador 5W</option>
              <option value="cargador_20w">Cargador 20W</option>
              <option value="otro">Otro</option>
            </select>
            {errors.tipo && <div className="text-red-600 text-sm mt-1">{errors.tipo}</div>}
          </div>

          {/* Nombre */}
          <div>
            <label className="block font-medium text-sm text-gray-700">Nombre (opcional)</label>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              disabled={processing}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Procedencia */}
          <div>
            <label className="block font-medium text-sm text-gray-700">Procedencia</label>
            <input
              type="text"
              value={data.procedencia}
              onChange={(e) => setData('procedencia', e.target.value)}
              disabled={processing}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.procedencia && <div className="text-red-600 text-sm mt-1">{errors.procedencia}</div>}
          </div>

          {/* Precio Costo */}
          <div>
            <label className="block font-medium text-sm text-gray-700">Precio de Costo</label>
            <input
              type="number"
              value={data.precio_costo}
              onChange={(e) => setData('precio_costo', e.target.value)}
              disabled={processing}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.precio_costo && <div className="text-red-600 text-sm mt-1">{errors.precio_costo}</div>}
          </div>

          {/* Precio Venta */}
          <div>
            <label className="block font-medium text-sm text-gray-700">Precio de Venta</label>
            <input
              type="number"
              value={data.precio_venta}
              onChange={(e) => setData('precio_venta', e.target.value)}
              disabled={processing}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.precio_venta && <div className="text-red-600 text-sm mt-1">{errors.precio_venta}</div>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={route('admin.productos-generales.index')}
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-md"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md"
          >
            Guardar
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
