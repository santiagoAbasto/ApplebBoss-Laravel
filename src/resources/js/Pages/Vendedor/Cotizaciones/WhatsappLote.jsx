import React, { useState } from 'react';
import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head } from '@inertiajs/react';
import FancyButton from '@/Components/FancyButton';

export default function WhatsappLote({ links }) {
  const [copiado, setCopiado] = useState(null);

  /* ===============================
     COPIAR MENSAJE
  =============================== */
  const copiarMensaje = (item, index) => {
    const mensaje =
      `Hola ${item.nombre}, gracias por confiar en *Apple Boss* 😊\n\n` +
      `📝 *Cotización Apple Boss *\n` +
      `👤 Cliente: ${item.nombre}\n` +
      `📄 Cotización N.º: ${item.cotizacion_id}\n` +
      `💰 Total: Bs ${item.total}\n` +
      `🔗 Ver PDF: ${item.pdf}`;

    navigator.clipboard.writeText(mensaje).then(() => {
      setCopiado(index);
      setTimeout(() => setCopiado(null), 2000);
    });
  };

  /* ===============================
     ENVIAR WHATSAPP
  =============================== */
  const enviarWhatsApp = (item) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = item.link;
    } else {
      const numero = item.telefono.replace(/[^0-9]/g, '');
      const mensajeEncoded = item.link.split('text=')[1];
      const linkDesktop = `whatsapp://send?phone=${numero}&text=${mensajeEncoded}`;

      window.location.href = linkDesktop;

      setTimeout(() => {
        window.open(item.link, '_blank');
      }, 2000);
    }
  };

  return (
    <VendedorLayout>
      <Head title="Envío por WhatsApp" />

      <div className="container py-4">
        <h2 className="h4 fw-bold mb-4 text-success">
          Envío de Cotizaciones por WhatsApp
        </h2>

        <div className="row">
          {links.map((item, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              {/* CARD 3D */}
              <div className="card card-3d h-100">
                <div className="card-body d-flex flex-column justify-content-between">

                  {/* INFO */}
                  <div>
                    <h5 className="fw-semibold text-success mb-2">
                      👤 {item.nombre}
                    </h5>

                    <textarea
                      className="form-control form-control-sm mb-2 mensaje-preview"
                      rows="6"
                      readOnly
                      value={`Hola ${item.nombre}, gracias por confiar en *Apple Boss* 😊

                        📝 Cotización Apple Boss
                        👤 Cliente: ${item.nombre}
                        📄 Cotización N.º: ${item.cotizacion_id}
                        💰 Total: Bs ${item.total}
                        🔗 Ver PDF: ${item.pdf}`}
                    />

                    {copiado === index && (
                      <div className="text-success small text-center mt-1">
                        ✔ Mensaje copiado
                      </div>
                    )}
                  </div>

                  {/* BOTONES */}
                  <div className="d-flex gap-2 mt-3 justify-content-between">
                    <FancyButton
                      variant="success"
                      size="sm"
                      icon="arrow"
                      onClick={() => copiarMensaje(item, index)}
                      className="btn-soft"
                    >
                      Copiar
                    </FancyButton>

                    <FancyButton
                      variant="success"
                      size="sm"
                      icon="arrow"
                      onClick={() => enviarWhatsApp(item)}
                      className="btn-soft"
                    >
                      WhatsApp
                    </FancyButton>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {links.length === 0 && (
          <div className="alert alert-warning text-center mt-4">
            No se generaron enlaces de WhatsApp.
          </div>
        )}
      </div>

      {/* ===============================
         ESTILOS FINALES (PRODUCCIÓN)
      =============================== */}
      <style>{`
        /* CARD 3D SUAVE */
        .card-3d {
          background: #ffffff;
          border-radius: 16px;
          border: 1.5px solid #a7f3d0; /* verde agua claro */
          box-shadow:
            0 6px 14px rgba(0, 0, 0, 0.06),
            0 2px 4px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .card-3d:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 28px rgba(0, 0, 0, 0.10),
            0 6px 12px rgba(0, 0, 0, 0.06);
        }

        /* TEXTAREA PREVIEW */
        .mensaje-preview {
          background: #f8fafc;
          border-radius: 10px;
          font-size: 0.8rem;
          line-height: 1.35;
        }

        /* BOTONES MÁS AMIGABLES */
        .btn-soft {
          border-width: 2px !important;
          padding: 6px 14px !important;
        }
      `}</style>
    </VendedorLayout>
  );
}
