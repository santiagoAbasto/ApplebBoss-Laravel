import React, { useState } from 'react';
import { Link, Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ cotizaciones = [] }) {
  const [seleccionados, setSeleccionados] = useState([]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSeleccionTodos = () => {
    if (seleccionados.length === cotizaciones.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(cotizaciones.map(c => c.id));
    }
  };

  const reenviarCorreo = (id) => {
    if (confirm('¿Deseas reenviar la cotización por correo?')) {
      router.post(route('admin.cotizaciones.reenviar', id), {}, {
        onSuccess: () => alert('Correo reenviado exitosamente.')
      });
    }
  };

  const enviarLoteWhatsapp = () => {
    if (seleccionados.length === 0) {
      alert('Selecciona al menos una cotización.');
      return;
    }
    router.post(route('admin.cotizaciones.enviar-lote'), { ids: seleccionados });
  };

  const enviarWhatsApp = (cot) => {
    const numero = `${cot.telefono || ''}`.replace(/\D/g, '');
    if (!numero || numero.length < 8) return alert('Número inválido');

    const nombre = cot.nombre_cliente;
    const total = parseFloat(cot.total || 0).toFixed(2);
    const pdf = cot.drive_url || 'https://appleboss.bo/pdf-no-disponible';

    const mensaje =
      `Hola ${nombre}, gracias por confiar en *AppleBoss* 😊\n\n` +
      `📝 *Cotización AppleBoss*\n` +
      `👤 Cliente: ${nombre}\n` +
      `📄 Cotización N.º: ${cot.id}\n` +
      `💰 Total: Bs ${total}\n` +
      `🔗 Ver PDF: ${pdf}`;

    const encoded = encodeURIComponent(mensaje);
    const linkApp = `whatsapp://send?phone=${numero}&text=${encoded}`;
    const linkWeb = `https://web.whatsapp.com/send?phone=${numero}&text=${encoded}`;

    const timeout = setTimeout(() => {
      window.open(linkWeb, '_blank');
    }, 2000);

    window.location.href = linkApp;
    window.addEventListener('blur', () => clearTimeout(timeout), { once: true });
  };

  const calcularTotal = (campo, soloSeleccionados = false) => {
    return cotizaciones.reduce((acc, cot) => {
      const descuento = parseFloat(cot.descuento || 0);
      if (soloSeleccionados && !seleccionados.includes(cot.id)) return acc;
      if (!Array.isArray(cot.items)) return acc;

      const subtotal = cot.items.reduce((sum, item) => {
        const valor = parseFloat(item[campo]) || 0;
        return sum + valor * (item.cantidad || 1);
      }, 0);

      return acc + Math.max(0, subtotal - descuento);
    }, 0);
  };

  return (
    <AdminLayout>
      <Head title="Cotizaciones" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <i className="bi bi-file-earmark-text-fill"></i> Cotizaciones Registradas
        </h1>
        <div className="flex gap-2">
          <Link
            href={route('admin.cotizaciones.create')}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            <i className="bi bi-plus-circle mr-1"></i> Nueva Cotización
          </Link>
          <button
            onClick={enviarLoteWhatsapp}
            className="border border-green-600 text-green-700 px-4 py-2 rounded hover:bg-green-50 transition"
          >
            <i className="bi bi-whatsapp mr-1"></i> Enviar seleccionados
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seleccionados.length === cotizaciones.length && cotizaciones.length > 0}
                    onChange={toggleSeleccionTodos}
                    className="form-checkbox rounded text-blue-600"
                  />
                  <span className="text-xs">Todos</span>
                </label>
              </th>
              <th className="px-2 py-3">#</th>
              <th className="px-2 py-3">Cliente</th>
              <th className="px-2 py-3">Teléfono</th>
              <th className="px-2 py-3">Correo</th>
              <th className="px-2 py-3 text-green-700 font-bold">TOTAL C/FACTURA</th>
              <th className="px-2 py-3 text-blue-700 font-bold">TOTAL S/FACTURA</th>
              <th className="px-2 py-3">Fecha</th>
              <th className="px-2 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  <i className="bi bi-emoji-frown mr-2"></i> No hay cotizaciones registradas.
                </td>
              </tr>
            ) : (
              cotizaciones.map((cot, index) => {
                let totalSinFactura = 0;
                let totalConFactura = 0;
                const descuento = parseFloat(cot.descuento || 0);

                if (Array.isArray(cot.items)) {
                  cot.items.forEach(item => {
                    totalSinFactura += (item.precio_sin_factura || 0) * (item.cantidad || 1);
                    totalConFactura += (item.precio_con_factura || 0) * (item.cantidad || 1);
                  });
                }

                return (
                  <tr key={cot.id} className={`border-b hover:bg-blue-50 ${seleccionados.includes(cot.id) ? 'bg-blue-50 ring-1 ring-blue-100' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="form-checkbox text-blue-600"
                        checked={seleccionados.includes(cot.id)}
                        onChange={() => toggleSeleccion(cot.id)}
                      />
                    </td>
                    <td className="px-2 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-2 py-3">{cot.nombre_cliente}</td>
                    <td className="px-2 py-3">{cot.telefono || '-'}</td>
                    <td className="px-2 py-3">{cot.correo_cliente || '-'}</td>
                    <td className="px-2 py-3 text-green-700 font-semibold">
                      Bs {(Math.max(0, totalConFactura - descuento)).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-blue-700 font-semibold">
                      Bs {(Math.max(0, totalSinFactura - descuento)).toFixed(2)}
                    </td>
                    <td className="px-2 py-3">{new Date(cot.fecha_cotizacion).toLocaleDateString()}</td>
                    <td className="px-2 py-3 text-center space-x-1 flex flex-wrap justify-center">
                      {cot.drive_url ? (
                        <a href={cot.drive_url} target="_blank" className="border text-blue-600 border-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                          <i className="bi bi-cloud-arrow-down me-1"></i> Ver PDF
                        </a>
                      ) : (
                        <a href={route('admin.cotizaciones.pdf', cot.id)} target="_blank" className="border text-blue-600 border-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                          <i className="bi bi-file-earmark-pdf me-1"></i> Generar PDF
                        </a>
                      )}

                      <button onClick={() => enviarWhatsApp(cot)} className="border border-green-600 text-green-700 px-2 py-1 rounded hover:bg-green-50">
                        <i className="bi bi-whatsapp me-1"></i> WhatsApp
                      </button>

                      {cot.correo_cliente && (
                        <button onClick={() => reenviarCorreo(cot.id)} className="border border-gray-400 text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                          <i className="bi bi-envelope-fill me-1"></i> Reenviar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="bg-gray-50 px-6 py-4 border-t text-right text-sm font-medium flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-6">
          <div className="text-green-700">
            Total Global C/Factura:{' '}
            <span className="font-bold">Bs {calcularTotal('precio_con_factura').toFixed(2)}</span>
          </div>
          <div className="text-blue-700">
            Total Global S/Factura:{' '}
            <span className="font-bold">Bs {calcularTotal('precio_sin_factura').toFixed(2)}</span>
          </div>

          {seleccionados.length > 0 && (
            <>
              <div className="text-green-700">
                Total Seleccionados C/Factura:{' '}
                <span className="font-bold">Bs {calcularTotal('precio_con_factura', true).toFixed(2)}</span>
              </div>
              <div className="text-blue-700">
                Total Seleccionados S/Factura:{' '}
                <span className="font-bold">Bs {calcularTotal('precio_sin_factura', true).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}