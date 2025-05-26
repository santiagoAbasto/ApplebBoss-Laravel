import React from 'react';
import { Link, Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ cotizaciones = [] }) {
  return (
    <AdminLayout>
      <Head title="Cotizaciones" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-primary fw-bold">
          <i className="bi bi-file-earmark-text-fill me-2"></i>
          Cotizaciones Registradas
        </h1>
        <Link href={route('admin.cotizaciones.create')} className="btn btn-success shadow-sm">
          <i className="bi bi-plus-circle me-1"></i>
          Nueva Cotización
        </Link>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '20%' }}>Cliente</th>
                  <th style={{ width: '15%' }}>Teléfono</th>
                  <th style={{ width: '20%' }}>Correo</th>
                  <th style={{ width: '12%' }}>Total (Bs)</th>
                  <th style={{ width: '13%' }}>Fecha</th>
                  <th style={{ width: '10%' }} className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      <i className="bi bi-emoji-frown me-2"></i>
                      No hay cotizaciones registradas.
                    </td>
                  </tr>
                ) : (
                  cotizaciones.map((cot, index) => (
                    <tr key={cot.id}>
                      <td className="text-muted">{index + 1}</td>
                      <td>{cot.nombre_cliente}</td>
                      <td>{cot.telefono_cliente || '-'}</td>
                      <td>{cot.correo_cliente || '-'}</td>
                      <td><strong>Bs {parseFloat(cot.total || 0).toFixed(2)}</strong></td>
                      <td>{new Date(cot.fecha_cotizacion).toLocaleDateString()}</td>
                      <td className="text-center">
                        <a
                          href={route('admin.cotizaciones.pdf', cot.id)}
                          className="btn btn-sm btn-outline-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
