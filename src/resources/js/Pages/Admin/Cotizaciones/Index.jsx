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
    const numero = `${cot.codigo_pais || ''}${cot.codigo_area || ''}${cot.telefono_cliente || ''}`.replace(/\D/g, '');
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
  
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
    // Primero intentamos con app instalada (móvil o escritorio)
    const timeout = setTimeout(() => {
      // Si no abrió la app, abrimos WhatsApp Web como respaldo
      window.open(linkWeb, '_blank');
    }, 2000);
  
    // Abrir app
    window.location.href = linkApp;
  
    // Si la app se abrió, cancelamos el timeout
    window.addEventListener('blur', () => clearTimeout(timeout), { once: true });
  };  
  return (
    <AdminLayout>
      <Head title="Cotizaciones" />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-primary fw-bold">
          <i className="bi bi-file-earmark-text-fill me-2"></i> Cotizaciones Registradas
        </h1>
        <div className="d-flex gap-2">
          <Link href={route('admin.cotizaciones.create')} className="btn btn-success shadow-sm">
            <i className="bi bi-plus-circle me-1"></i> Nueva Cotización
          </Link>
          <button onClick={enviarLoteWhatsapp} className="btn btn-outline-success shadow-sm">
            <i className="bi bi-whatsapp me-1"></i> Enviar seleccionados por WhatsApp
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th></th>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Total (Bs)</th>
                  <th>Fecha</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      <i className="bi bi-emoji-frown me-2"></i> No hay cotizaciones registradas.
                    </td>
                  </tr>
                ) : (
                  cotizaciones.map((cot, index) => {
                    const paisCode = (cot.codigo_pais || '').replace('+', '').toLowerCase();
                    const telefonoCompleto = cot.codigo_pais && cot.codigo_area && cot.telefono_cliente
                      ? `${cot.codigo_pais} ${cot.codigo_area} ${cot.telefono_cliente}`
                      : cot.telefono_cliente || '-';

                    return (
                      <tr key={cot.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={seleccionados.includes(cot.id)}
                            onChange={() => toggleSeleccion(cot.id)}
                          />
                        </td>
                        <td className="text-muted">{index + 1}</td>
                        <td>{cot.nombre_cliente}</td>
                        <td>
                          {cot.codigo_pais && (
                            <span
                              className={`fi fi-${paisCode}`}
                              style={{ marginRight: '6px' }}
                            ></span>
                          )}
                          {telefonoCompleto}
                        </td>
                        <td>{cot.correo_cliente || '-'}</td>
                        <td><strong>Bs {parseFloat(cot.total || 0).toFixed(2)}</strong></td>
                        <td>{new Date(cot.fecha_cotizacion).toLocaleDateString()}</td>
                        <td className="text-center d-flex gap-1 justify-content-center flex-wrap">
                          {cot.drive_url ? (
                            <a href={cot.drive_url} className="btn btn-sm btn-outline-primary" target="_blank">
                              <i className="bi bi-cloud-arrow-down me-1"></i> Ver PDF
                            </a>
                          ) : (
                            <a href={route('admin.cotizaciones.pdf', cot.id)} className="btn btn-sm btn-outline-primary" target="_blank">
                              <i className="bi bi-file-earmark-pdf me-1"></i> Generar PDF
                            </a>
                          )}

                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => enviarWhatsApp(cot)}
                          >
                            <i className="bi bi-whatsapp me-1"></i> WhatsApp
                          </button>

                          {cot.correo_cliente && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => reenviarCorreo(cot.id)}>
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
