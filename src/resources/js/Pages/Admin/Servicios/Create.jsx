import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { route } from 'ziggy-js';

export default function CreateServicio() {
  const { data, setData, post, errors } = useForm({
    codigo_nota: '',
    cliente: '',
    telefono: '',
    equipo: '',
    detalle_servicio: '',
    precio_costo: '',
    precio_venta: '',
    tecnico: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const buscarCliente = async (valor) => {
    setData('cliente', valor);
    if (valor.length >= 2) {
      try {
        const res = await axios.get(route('admin.clientes.sugerencias', { q: valor }));
        setSugerencias(res.data);
        setMostrarSugerencias(true);
      } catch (err) {
        console.error('Error al obtener sugerencias:', err);
      }
    } else {
      setMostrarSugerencias(false);
    }
  };

  const seleccionarCliente = (cliente) => {
    setData((prev) => ({
      ...prev,
      cliente: cliente.nombre,
      telefono: cliente.telefono,
    }));
    setMostrarSugerencias(false);
    console.log('Cliente seleccionado:', cliente.nombre, cliente.telefono);

  };


  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.servicios.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Servicio Técnico" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🧰 Registrar Servicio Técnico</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 shadow rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                value={data.cliente}
                onChange={(e) => buscarCliente(e.target.value)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                onFocus={() => {
                  if (sugerencias.length > 0) setMostrarSugerencias(true);
                }}
                className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Buscar o escribir nombre"
              />
              {mostrarSugerencias && sugerencias.length > 0 && (
                <ul className="absolute z-10 bg-white dark:bg-gray-800 border rounded shadow max-h-40 overflow-y-auto mt-1 w-full">
                  {sugerencias.map((cliente, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => seleccionarCliente(cliente)}
                    >
                      {cliente.nombre} — {cliente.telefono}
                    </li>
                  ))}
                </ul>
              )}
              {errors.cliente && <p className="text-sm text-red-500 mt-1">{errors.cliente}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Teléfono</label>
              <input
                type="text"
                value={data.telefono}
                onChange={(e) => setData('telefono', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Código de Nota</label>
              <input
                type="text"
                value={data.codigo_nota}
                onChange={(e) => setData('codigo_nota', e.target.value)}
                className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.codigo_nota ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Ej: ST-0001"
              />
              {errors.codigo_nota && <p className="text-sm text-red-500 mt-1">{errors.codigo_nota}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Equipo</label>
              <input
                type="text"
                value={data.equipo}
                onChange={(e) => setData('equipo', e.target.value)}
                className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.equipo ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.equipo && <p className="text-sm text-red-500 mt-1">{errors.equipo}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Técnico Encargado</label>
              <input
                type="text"
                value={data.tecnico}
                onChange={(e) => setData('tecnico', e.target.value)}
                className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.tecnico ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.tecnico && <p className="text-sm text-red-500 mt-1">{errors.tecnico}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Detalle del Servicio</label>
            <textarea
              rows="4"
              value={data.detalle_servicio}
              onChange={(e) => setData('detalle_servicio', e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.detalle_servicio ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.detalle_servicio && <p className="text-sm text-red-500 mt-1">{errors.detalle_servicio}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Precio Costo (Bs)</label>
              <input
                type="number"
                step="0.01"
                value={data.precio_costo}
                onChange={(e) => setData('precio_costo', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Precio Venta (Bs)</label>
              <input
                type="number"
                step="0.01"
                value={data.precio_venta}
                onChange={(e) => setData('precio_venta', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Fecha</label>
              <input
                type="date"
                value={data.fecha}
                onChange={(e) => setData('fecha', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
            >
              💾 Guardar Servicio
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}