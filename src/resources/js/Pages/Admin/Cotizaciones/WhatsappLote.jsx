import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function WhatsappLote({ links }) {
  const [copiado, setCopiado] = useState(null);

  const copiarMensaje = (item, index) => {
    const mensaje = `Hola ${item.nombre}, gracias por confiar en *AppleBoss* 😊\n\n` +
      `📝 *Cotización AppleBoss*\n` +
      `👤 Cliente: ${item.nombre}\n` +
      `📄 Cotización N.º: ${item.cotizacion_id}\n` +
      `💰 Total: Bs ${item.total}\n` +
      `🔗 Ver PDF: ${item.pdf}`;

    navigator.clipboard.writeText(mensaje).then(() => {
      setCopiado(index);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  const enviarWhatsApp = (item) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Móvil: redirige directamente al link generado
      window.location.href = item.link;
    } else {
      // Escritorio: intenta abrir WhatsApp Desktop primero
      const numero = item.telefono.replace(/[^0-9]/g, '');
      const mensajeEncoded = item.link.split('text=')[1];
      const linkDesktop = `whatsapp://send?phone=${numero}&text=${mensajeEncoded}`;

      window.location.href = linkDesktop;

      const fallback = setTimeout(() => {
        window.open(item.link, '_blank');
      }, 2000);

      window.addEventListener('blur', () => clearTimeout(fallback));
    }
  };

  return (
    <AdminLayout>
      <Head title="Envío por WhatsApp" />
      <div className="container py-4">
        <h2 className="h4 text-success fw-bold mb-3">📤 Enlaces generados para envío por WhatsApp</h2>
        <p className="text-muted mb-4">
          Cada cliente recibirá su cotización. Puedes copiar el mensaje o enviarlo directamente por WhatsApp:
        </p>

        <div className="row">
          {links.map((item, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="card-title text-primary fw-semibold mb-3">👤 {item.nombre}</h5>

                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">
                        Mensaje de WhatsApp:
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="6"
                        value={`Hola ${item.nombre}, gracias por confiar en *AppleBoss* 😊\n\n📝 *Cotización AppleBoss*\n👤 Cliente: ${item.nombre}\n📄 Cotización N.º: ${item.cotizacion_id}\n💰 Total: Bs ${item.total}\n🔗 Ver PDF: ${item.pdf}`}
                        readOnly
                      ></textarea>
                      <button
                        className="btn btn-outline-secondary btn-sm mt-2"
                        onClick={() => copiarMensaje(item, index)}
                      >
                        <i className="bi bi-clipboard me-1"></i>
                        Copiar mensaje
                      </button>
                      {copiado === index && (
                        <div className="text-success small mt-1">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Mensaje copiado
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => enviarWhatsApp(item)}
                    className="btn btn-success w-100 mt-auto"
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    Enviar por WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {links.length === 0 && (
          <div className="alert alert-warning mt-4">
            No se generaron enlaces. Verifica los datos de los clientes seleccionados.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
