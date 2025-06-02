import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Phone } from 'lucide-react';
import ToastNotification from '@/Components/ToastNotification';
import { useState } from 'react';
import { route } from 'ziggy-js'; // ✅ CORRECTO



export default function Edit({ celular }) {
  const { data, setData, put, errors } = useForm({
    modelo: celular.modelo || '',
    capacidad: celular.capacidad || '',
    color: celular.color || '',
    bateria: celular.bateria || '',
    imei_1: celular.imei_1 || '',
    imei_2: celular.imei_2 || '',
    estado_imei: celular.estado_imei || 'libre',
    procedencia: celular.procedencia || '',
    precio_costo: celular.precio_costo || '',
    precio_venta: celular.precio_venta || '',
    estado: celular.estado || 'disponible',
  });

  const [toastVisible, setToastVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.celulares.update', celular.id), {
      onSuccess: () => {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
      }
    });
  };

  const handleImeiInput = (field, value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 15);
    setData(field, numericValue);
  };

  const handleImeiKeyDown = (e) => {
    const validKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];
    if (!/[0-9]/.test(e.key) && !validKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <>
      <AdminLayout>
        <Head title="Editar Celular" />
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Phone className="w-6 h-6 text-blue-600" /> Editar Celular
          </h1>
          <Link href={route('admin.celulares.index')} className="text-sm text-gray-500 hover:underline">
            ← Volver al listado
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo */}
            {[
              ['Modelo', 'modelo'],
              ['Capacidad', 'capacidad'],
              ['Color', 'color'],
              ['Batería (opcional)', 'bateria'],
              ['Procedencia', 'procedencia'],
              ['Precio de Costo', 'precio_costo', 'number'],
              ['Precio de Venta', 'precio_venta', 'number'],
            ].map(([label, name, type = 'text']) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  className="w-full border border-gray-300 rounded-md px-4 py-2"
                  value={data[name]}
                  onChange={(e) => setData(name, e.target.value)}
                />
                {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
              </div>
            ))}

            {/* IMEI 1 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">IMEI 1</label>
              <input
                type="text"
                maxLength={15}
                pattern="\d{15}"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
                value={data.imei_1}
                onChange={(e) => handleImeiInput('imei_1', e.target.value)}
                onKeyDown={handleImeiKeyDown}
              />
              {errors.imei_1 && <p className="text-red-500 text-sm mt-1">{errors.imei_1}</p>}
            </div>

            {/* IMEI 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">IMEI 2 (opcional)</label>
              <input
                type="text"
                maxLength={15}
                pattern="\d{15}"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
                value={data.imei_2}
                onChange={(e) => handleImeiInput('imei_2', e.target.value)}
                onKeyDown={handleImeiKeyDown}
              />
              {errors.imei_2 && <p className="text-red-500 text-sm mt-1">{errors.imei_2}</p>}
            </div>

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
                <option value="imei1_libre_imei2_registrado">IMEI1 Libre / IMEI2 Registrado</option>
                <option value="imei1_registrado_imei2_libre">IMEI1 Registrado / IMEI2 Libre</option>
              </select>
              {errors.estado_imei && <p className="text-red-500 text-sm mt-1">{errors.estado_imei}</p>}
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
              {errors.estado && <p className="text-red-500 text-sm mt-1">{errors.estado}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link
              href={route('admin.celulares.index')}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
            >
              💾 Actualizar
            </button>
          </div>
        </form>

        <ToastNotification
          show={toastVisible}
          type="success"
          message="✅ Celular actualizado con éxito"
        />
      </AdminLayout>
    </>
  );
}
