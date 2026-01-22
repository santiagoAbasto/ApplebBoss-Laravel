import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import { route } from 'ziggy-js';
import { BarChart3, FileText, Filter } from 'lucide-react';

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
  CrudSelect,
  CrudActions,
  CrudButtonPrimary,
  CrudButtonSecondary,
} from '@/Components/CrudUI';

export default function ReporteIndex({
  ventas = [],
  resumen,
  resumen_grafico,
  filtros,
  vendedores,
}) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');

  /* ===============================
     ACTIONS (INTACTAS)
  =============================== */
  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.reportes.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    });
  };

  const handleExportarPDF = () => {
    const queryParams = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }).toString();

    window.open(
      route('admin.reportes.exportar') + '?' + queryParams,
      '_blank'
    );
  };

  /* ===============================
     CHART (INTACTO)
  =============================== */
  const chartData = {
    series: [
      resumen.ganancias_por_tipo?.celulares ?? 0,
      resumen.ganancias_por_tipo?.computadoras ?? 0,
      resumen.ganancias_por_tipo?.generales ?? 0,
      resumen.ganancias_por_tipo?.productos_apple ?? 0,
      resumen.ganancias_por_tipo?.servicio_tecnico ?? 0,
      resumen.total_inversion ?? 0,
    ],
    options: {
      chart: { type: 'donut' },
      labels: [
        'Celulares',
        'Computadoras',
        'Productos Generales',
        'Productos Apple',
        'Servicio Técnico',
        'Inversión Total',
      ],
      colors: [
        '#2563eb',
        '#16a34a',
        '#f59e0b',
        '#6366f1',
        '#06b6d4',
        '#dc2626',
      ],
      legend: { position: 'bottom' },
    },
  };

  return (
    <AdminLayout>
      <Head title="Reportes de Ventas" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <BarChart3 size={22} />
              Reportes de Ventas
            </CrudTitle>
            <CrudSubtitle>
              Análisis detallado de ventas, ganancias e inversión
            </CrudSubtitle>
          </div>
        </CrudHeader>

        {/* ================= FILTROS ================= */}
        <CrudCard style={{ marginBottom: 24 }}>
          <form onSubmit={handleFiltrar}>
            <CrudSectionTitle>
              <Filter size={14} style={{ marginRight: 6 }} />
              Filtros
            </CrudSectionTitle>

            <CrudGrid>
              <div>
                <CrudLabel>Fecha inicio</CrudLabel>
                <CrudInput
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div>
                <CrudLabel>Fecha fin</CrudLabel>
                <CrudInput
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              <div>
                <CrudLabel>Vendedor</CrudLabel>
                <CrudSelect
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                >
                  <option value="">— Todos —</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </CrudSelect>
              </div>
            </CrudGrid>

            <CrudActions>
              <CrudButtonPrimary type="submit">
                🔍 Filtrar
              </CrudButtonPrimary>

              <CrudButtonSecondary
                type="button"
                onClick={handleExportarPDF}
              >
                <FileText size={16} />
                Exportar PDF
              </CrudButtonSecondary>
            </CrudActions>
          </form>
        </CrudCard>

        {/* ================= GRÁFICO ================= */}
        <CrudCard style={{ marginBottom: 24 }}>
          <CrudSectionTitle>
            📊 Ganancias por Categoría
          </CrudSectionTitle>

          <Chart
            options={chartData.options}
            series={chartData.series}
            type="donut"
            height={350}
          />
        </CrudCard>

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>
            📄 Detalle de Movimientos
          </CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {[
                    'Fecha',
                    'Producto',
                    'Tipo',
                    'Capital',
                    'Descuento',
                    'Permuta',
                    'Subtotal',
                    'Ganancia',
                    'Vendedor',
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {ventas.length ? (
                  ventas.map((i, idx) => (
                    <tr
                      key={idx}
                      style={{ borderTop: '1px solid #e5e7eb' }}
                    >
                      <td style={td}>
                        {dayjs(i.fecha).format('DD/MM/YYYY')}
                      </td>
                      <td style={td}>{i.producto}</td>
                      <td style={td}>{i.tipo}</td>
                      <td style={{ ...td, color: '#ea580c' }}>
                        {Number(i.capital).toFixed(2)} Bs
                      </td>
                      <td style={{ ...td, color: '#dc2626' }}>
                        - {Number(i.descuento).toFixed(2)} Bs
                      </td>
                      <td style={{ ...td, color: '#ca8a04' }}>
                        - {Number(i.permuta).toFixed(2)} Bs
                      </td>
                      <td style={{ ...td, fontWeight: 600 }}>
                        {Number(i.subtotal).toFixed(2)} Bs
                      </td>
                      <td
                        style={{
                          ...td,
                          fontWeight: 700,
                          color:
                            i.ganancia < 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {i.ganancia < 0
                          ? `Se invirtió ${Math.abs(i.ganancia).toFixed(
                            2
                          )} Bs`
                          : `${i.ganancia.toFixed(2)} Bs`}
                      </td>
                      <td style={td}>{i.vendedor}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        color: '#64748b',
                      }}
                    >
                      No hay resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}

/* ===============================
   TABLE STYLES
=============================== */
const th = {
  padding: '12px 14px',
  fontSize: 13,
  fontWeight: 800,
  color: '#0f172a',
  textAlign: 'left',
};

const td = {
  padding: '12px 14px',
  fontSize: 14,
  color: '#334155',
};
