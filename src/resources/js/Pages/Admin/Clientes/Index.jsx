import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import FancyButton from '@/Components/FancyButton';
import { route } from 'ziggy-js';

export default function Index({ clientes }) {
  const [enviando, setEnviando] = useState(false);

  const mensaje = encodeURIComponent(
    `🎉 ¡Hola! En AppleBoss tenemos promociones especiales para ti. 💥 No te las pierdas. Visítanos o escríbenos ahora mismo 📱`
  );

  /* ===============================
     LIMPIAR NÚMERO WHATSAPP
  =============================== */
  const limpiarNumero = (tel) => {
    const soloNumeros = tel.replace(/\D/g, '');

    if (soloNumeros.startsWith('591')) return soloNumeros;
    if (soloNumeros.length === 8) return `591${soloNumeros}`;
    if (soloNumeros.length >= 11) return soloNumeros;

    return soloNumeros;
  };

  /* ===============================
     ENVIAR PROMOCIÓN
  =============================== */
  const handleEnviarPromocion = () => {
    if (!confirm('¿Enviar promoción a todos estos clientes por WhatsApp?')) return;

    setEnviando(true);

    clientes.forEach((cliente, index) => {
      setTimeout(() => {
        const numeroFinal = limpiarNumero(cliente.telefono);

        if (numeroFinal.length >= 11) {
          const enlaceWeb = `https://wa.me/${numeroFinal}?text=${mensaje}`;
          const enlaceApp = `whatsapp://send?phone=${numeroFinal}&text=${mensaje}`;

          const esCelular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

          if (esCelular) {
            window.open(enlaceApp, '_blank');
          } else {
            const win = window.open(enlaceApp, '_blank');
            setTimeout(() => {
              if (!win || win.closed) {
                window.open(enlaceWeb, '_blank');
              }
            }, 800);
          }
        } else {
          console.warn(`❌ Número inválido omitido: ${cliente.telefono}`);
        }

        if (index === clientes.length - 1) {
          setTimeout(() => setEnviando(false), 1000);
        }
      }, index * 1000);
    });
  };

  return (
    <AdminLayout>
      <Head title="Mis Clientes" />

      {/* ===============================
         HEADER
      =============================== */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">
            Mis Clientes
          </h1>
          <p className="text-sm text-gray-500">
            Lista de clientes registrados por ti
          </p>
        </div>

        <FancyButton
          variant="success"
          size="sm"
          disabled={enviando}
          onClick={handleEnviarPromocion}
        >
          {enviando ? 'Enviando…' : 'Enviar promoción'}
        </FancyButton>
      </div>

      {/* ===============================
         TABLA
      =============================== */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="w-full text-sm text-center">
          <thead className="bg-emerald-600 text-white text-xs uppercase">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2">Teléfono</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-gray-500">
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              clientes.map((c, index) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-emerald-50 transition"
                >
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2 text-left font-medium">
                    {c.nombre}
                  </td>
                  <td className="px-3 py-2">{c.telefono}</td>
                  <td className="px-3 py-2">{c.correo || '—'}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={route('admin.clientes.edit', c.id)}
                      className="inline-block"
                    >
                      <FancyButton variant="primary" size="sm">
                        Editar
                      </FancyButton>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
