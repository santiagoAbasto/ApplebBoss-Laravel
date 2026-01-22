import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FaFilter, FaFilePdf, FaPlus } from 'react-icons/fa';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudCard,
  CrudSectionTitle,
  CrudGrid,
  CrudLabel,
  CrudInput,
  CrudActions,
  CrudButtonPrimary,
  CrudButtonSecondary,
} from '@/Components/CrudUI';

export default function Index({ egresos = [], filtros }) {
  const { data, setData, get } = useForm({
    fecha_inicio: filtros?.fecha_inicio || '',
    fecha_fin: filtros?.fecha_fin || '',
  });

  const handleFiltrar = () => {
    get(route('admin.egresos.index'), {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleExportarPDF = () => {
    const query = new URLSearchParams({
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
    }).toString();

    window.open(
      route('admin.egresos.exportar-pdf') + '?' + query,
      '_blank'
    );
  };

  return (
    <AdminLayout>
      <Head title="Egresos" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>💸 Listado de Egresos</CrudTitle>
            <CrudSubtitle>
              Control de gastos y egresos del negocio
            </CrudSubtitle>
          </div>

          <Link href={route('admin.egresos.create')}>
            <CrudButtonPrimary>
              <FaPlus /> Nuevo Egreso
            </CrudButtonPrimary>
          </Link>
        </CrudHeader>

        {/* ================= FILTROS ================= */}
        <CrudCard>
          <CrudSectionTitle>Filtros</CrudSectionTitle>

          <CrudGrid>
            <div>
              <CrudLabel>Desde</CrudLabel>
              <CrudInput
                type="date"
                value={data.fecha_inicio}
                onChange={(e) =>
                  setData('fecha_inicio', e.target.value)
                }
              />
            </div>

            <div>
              <CrudLabel>Hasta</CrudLabel>
              <CrudInput
                type="date"
                value={data.fecha_fin}
                onChange={(e) =>
                  setData('fecha_fin', e.target.value)
                }
              />
            </div>
          </CrudGrid>

          <CrudActions>
            <CrudButtonSecondary type="button" onClick={handleFiltrar}>
              <FaFilter /> Filtrar
            </CrudButtonSecondary>

            <CrudButtonPrimary type="button" onClick={handleExportarPDF}>
              <FaFilePdf /> Exportar PDF
            </CrudButtonPrimary>
          </CrudActions>
        </CrudCard>

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Detalle de egresos</CrudSectionTitle>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3">Precio (Bs)</th>
                  <th className="px-4 py-3">Tipo de gasto</th>
                  <th className="px-4 py-3">Frecuencia</th>
                  <th className="px-4 py-3">Cuotas</th>
                  <th className="px-4 py-3">Comentario</th>
                  <th className="px-4 py-3">Registrado por</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {egresos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center py-6 text-gray-500"
                    >
                      No hay egresos registrados.
                    </td>
                  </tr>
                ) : (
                  egresos.map((e, i) => (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-2 text-center">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {e.concepto}
                      </td>
                      <td className="px-4 py-2 text-red-600 font-semibold">
                        Bs {Number(e.precio_invertido).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {e.tipo_gasto.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-2">
                        {e.frecuencia || '—'}
                      </td>
                      <td className="px-4 py-2">
                        {e.tipo_gasto === 'cuota_bancaria'
                          ? `${e.cuotas_pendientes ?? 0} cuotas`
                          : 'No aplica'}
                      </td>
                      <td className="px-4 py-2">
                        {e.comentario || '—'}
                      </td>
                      <td className="px-4 py-2">
                        {e.user?.name || '—'}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(e.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
