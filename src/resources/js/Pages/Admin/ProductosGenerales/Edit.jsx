import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ producto }) {
  const { data, setData, put, processing, errors } = useForm({
    codigo: producto.codigo,
    tipo: producto.tipo,
    nombre: producto.nombre,
    procedencia: producto.procedencia,
    precio_costo: producto.precio_costo,
    precio_venta: producto.precio_venta,
    estado: producto.estado,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.productos-generales.update', producto.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Producto General" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">✏️ Editar Producto</h1>
        <Link
          href={route('admin.productos-generales.index')}
          className="text-sm text-gray-600 hover:text-blue-600 underline"
        >
          ← Volver al listado
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.codigo}
              onChange={(e) => setData('codigo', e.target.value)}
              disabled={processing}
            />
            {errors.codigo && <p className="text-sm text-red-600 mt-1">{errors.codigo}</p>}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <input
              type="text"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.tipo}
              onChange={(e) => setData('tipo', e.target.value)}
              disabled={processing}
            />
            {errors.tipo && <p className="text-sm text-red-600 mt-1">{errors.tipo}</p>}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              disabled={processing}
            />
            {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
          </div>

          {/* Procedencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Procedencia</label>
            <input
              type="text"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.procedencia}
              onChange={(e) => setData('procedencia', e.target.value)}
              disabled={processing}
            />
            {errors.procedencia && <p className="text-sm text-red-600 mt-1">{errors.procedencia}</p>}
          </div>

          {/* Precio Costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio de Costo (Bs)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.precio_costo}
              onChange={(e) => setData('precio_costo', e.target.value)}
              disabled={processing}
            />
            {errors.precio_costo && <p className="text-sm text-red-600 mt-1">{errors.precio_costo}</p>}
          </div>

          {/* Precio Venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio de Venta (Bs)</label>
            <input
              type="number"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.precio_venta}
              onChange={(e) => setData('precio_venta', e.target.value)}
              disabled={processing}
            />
            {errors.precio_venta && <p className="text-sm text-red-600 mt-1">{errors.precio_venta}</p>}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
              disabled={processing}
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
            {errors.estado && <p className="text-sm text-red-600 mt-1">{errors.estado}</p>}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Link
            href={route('admin.productos-generales.index')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-sm font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={processing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            Actualizar
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
