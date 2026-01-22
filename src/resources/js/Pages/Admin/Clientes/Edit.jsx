import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import FancyButton from '@/Components/FancyButton';
import { route } from 'ziggy-js';

export default function Edit({ cliente }) {
  const { data, setData, put, processing, errors } = useForm({
    nombre: cliente.nombre || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.clientes.update', cliente.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Cliente" />

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        {/* ===============================
           HEADER
        =============================== */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-emerald-700">
            Editar Cliente
          </h1>
          <p className="text-sm text-gray-500">
            Actualiza la información del cliente
          </p>
        </div>

        {/* ===============================
           FORMULARIO
        =============================== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NOMBRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              className="input w-full"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              required
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">
                {errors.nombre}
              </p>
            )}
          </div>

          {/* TELÉFONO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              className="input w-full"
              value={data.telefono}
              onChange={(e) => setData('telefono', e.target.value)}
              required
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm mt-1">
                {errors.telefono}
              </p>
            )}
          </div>

          {/* CORREO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo (opcional)
            </label>
            <input
              type="email"
              className="input w-full"
              value={data.correo}
              onChange={(e) => setData('correo', e.target.value)}
            />
            {errors.correo && (
              <p className="text-red-500 text-sm mt-1">
                {errors.correo}
              </p>
            )}
          </div>

          {/* ===============================
             ACCIONES
          =============================== */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <FancyButton
              type="submit"
              variant="success"
              size="sm"
              disabled={processing}
            >
              {processing ? 'Guardando…' : 'Guardar cambios'}
            </FancyButton>

            <Link href={route('admin.clientes.index')}>
              <FancyButton
                type="button"
                variant="dark"
                size="sm"
              >
                Cancelar
              </FancyButton>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
