import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { Loader2 } from 'lucide-react';

export default function CreateCelular() {
  const { data, setData, post, processing, errors, reset } = useForm({
    modelo: '',
    capacidad: '',
    color: '',
    bateria: '',
    imei_1: '',
    imei_2: '',
    estado_imei: 'libre',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleImei = (field, value) => {
    const onlyDigits = value.replace(/\D/g, '').slice(0, 15);
    setData(field, onlyDigits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.celulares.store'), {
      onSuccess: () => {
        showSuccess('✅ Celular registrado con éxito');
        reset();
      },
      onError: () => showError('❌ Error al registrar el celular'),
    });
  };

  return (
    <AdminLayout>
      <Head title="Registrar Celular" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📱 Registrar nuevo celular
        </h1>
        <Link href={route('admin.celulares.index')} className="text-sm text-gray-600 hover:underline">
          ← Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Modelo', field: 'modelo' },
            { label: 'Capacidad', field: 'capacidad' },
            { label: 'Color', field: 'color' },
            { label: 'Batería (opcional)', field: 'bateria' },
            { label: 'IMEI 1', field: 'imei_1', type: 'imei' },
            { label: 'IMEI 2 (opcional)', field: 'imei_2', type: 'imei' },
            { label: 'Procedencia', field: 'procedencia' },
            { label: 'Precio de Costo', field: 'precio_costo', type: 'number' },
            { label: 'Precio de Venta', field: 'precio_venta', type: 'number' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <input
                type={type === 'number' ? 'number' : 'text'}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-400"
                value={data[field]}
                onChange={(e) =>
                  type === 'imei'
                    ? handleImei(field, e.target.value)
                    : setData(field, e.target.value)
                }
                maxLength={type === 'imei' ? 15 : undefined}
              />
              {errors[field] && <div className="text-sm text-red-500 mt-1">{errors[field]}</div>}
            </div>
          ))}

          {/* Estado IMEI */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado IMEI</label>
            <select
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={data.estado_imei}
              onChange={(e) => setData('estado_imei', e.target.value)}
            >
              <option value="libre">Libre</option>
              <option value="registrado">Registrado</option>
              <option value="imei1_libre_imei2_registrado">IMEI 1 libre, IMEI 2 registrado</option>
              <option value="imei1_registrado_imei2_libre">IMEI 1 registrado, IMEI 2 libre</option>
            </select>
            {errors.estado_imei && <div className="text-sm text-red-500 mt-1">{errors.estado_imei}</div>}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
            <select
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
            {errors.estado && <div className="text-sm text-red-500 mt-1">{errors.estado}</div>}
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-4">
          <Link
            href={route('admin.celulares.index')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={processing}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            {processing && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>

      <ToastContainer />
    </AdminLayout>
  );
}
