import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function CreateServicio() {
  const { data, setData, post, errors } = useForm({
    cliente: '',
    telefono: '',
    equipo: '',
    detalle_servicio: '',
    precio_costo: '',
    precio_venta: '',
    tecnico: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('vendedor.servicios.store'));
  };

  return (
    <VendedorLayout>
      <Head title="Registrar Servicio Técnico" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-700">🧰 Registrar Servicio Técnico</h1>
        <p className="text-sm text-gray-500">Completa los siguientes campos para guardar un nuevo servicio.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-6">
        {/* Grupo 1: Cliente y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Nombre del Cliente</label>
            <input
              type="text"
              value={data.cliente}
              onChange={e => setData('cliente', e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                errors.cliente ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cliente && <p className="text-sm text-red-500 mt-1">{errors.cliente}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Teléfono</label>
            <input
              type="text"
              value={data.telefono}
              onChange={e => setData('telefono', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Grupo 2: Equipo y Técnico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Equipo</label>
            <input
              type="text"
              value={data.equipo}
              onChange={e => setData('equipo', e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                errors.equipo ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.equipo && <p className="text-sm text-red-500 mt-1">{errors.equipo}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Técnico Encargado</label>
            <input
              type="text"
              value={data.tecnico}
              onChange={e => setData('tecnico', e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                errors.tecnico ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.tecnico && <p className="text-sm text-red-500 mt-1">{errors.tecnico}</p>}
          </div>
        </div>

        {/* Detalle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Detalle del Servicio</label>
          <textarea
            rows="4"
            value={data.detalle_servicio}
            onChange={e => setData('detalle_servicio', e.target.value)}
            className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
              errors.detalle_servicio ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.detalle_servicio && <p className="text-sm text-red-500 mt-1">{errors.detalle_servicio}</p>}
        </div>

        {/* Grupo 3: Precio costo, precio venta y fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Precio Costo (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={data.precio_costo}
              onChange={e => setData('precio_costo', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Precio Venta (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={data.precio_venta}
              onChange={e => setData('precio_venta', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Fecha</label>
            <input
              type="date"
              value={data.fecha}
              onChange={e => setData('fecha', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Botón */}
        <div className="text-right">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-md transition duration-150"
          >
            💾 Guardar Servicio
          </button>
        </div>
      </form>
    </VendedorLayout>
  );
}
