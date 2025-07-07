import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { FaSave } from 'react-icons/fa';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    concepto: '',
    precio_invertido: '',
    tipo_gasto: 'servicio_basico',
    frecuencia: '',
    cuotas_pendientes: '',
    comentario: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.egresos.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Egreso" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-blue-900">📤 Registrar nuevo egreso</h1>

        <form onSubmit={submit} className="space-y-6 bg-white p-6 rounded shadow">

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
            <input
              type="text"
              value={data.concepto}
              onChange={(e) => setData('concepto', e.target.value)}
              className="input w-full"
              placeholder="Ej. Luz Tienda, Alquiler, etc."
            />
            {errors.concepto && <p className="text-red-600 text-sm mt-1">{errors.concepto}</p>}
          </div>

          {/* Precio Invertido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio invertido (Bs) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.precio_invertido}
              onChange={(e) => setData('precio_invertido', e.target.value)}
              className="input w-full"
              placeholder="Ej. 250.00"
            />
            {errors.precio_invertido && <p className="text-red-600 text-sm mt-1">{errors.precio_invertido}</p>}
          </div>

          {/* Tipo de Gasto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de gasto *</label>
            <select
              value={data.tipo_gasto}
              onChange={(e) => setData('tipo_gasto', e.target.value)}
              className="input w-full"
            >
              <option value="servicio_basico">Servicio básico</option>
              <option value="cuota_bancaria">Cuota bancaria</option>
              <option value="gasto_personal">Gasto personal</option>
              <option value="sueldos">Sueldos</option>
            </select>
            {errors.tipo_gasto && <p className="text-red-600 text-sm mt-1">{errors.tipo_gasto}</p>}
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
            <input
              type="text"
              value={data.frecuencia}
              onChange={(e) => setData('frecuencia', e.target.value)}
              className="input w-full"
              placeholder="Ej. Mensual, único, trimestral..."
            />
            {errors.frecuencia && <p className="text-red-600 text-sm mt-1">{errors.frecuencia}</p>}
          </div>

          {/* Cuotas pendientes (solo si cuota_bancaria) */}
          {data.tipo_gasto === 'cuota_bancaria' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas pendientes</label>
              <input
                type="number"
                min="0"
                value={data.cuotas_pendientes}
                onChange={(e) => setData('cuotas_pendientes', e.target.value)}
                className="input w-full"
                placeholder="Ej. 3"
              />
              {errors.cuotas_pendientes && (
                <p className="text-red-600 text-sm mt-1">{errors.cuotas_pendientes}</p>
              )}
            </div>
          )}

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario adicional</label>
            <textarea
              rows="3"
              value={data.comentario}
              onChange={(e) => setData('comentario', e.target.value)}
              className="input w-full"
              placeholder="Ej. Vencimiento el 15 de cada mes..."
            />
            {errors.comentario && <p className="text-red-600 text-sm mt-1">{errors.comentario}</p>}
          </div>

          {/* Botón */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition"
            >
              <FaSave /> Guardar egreso
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
