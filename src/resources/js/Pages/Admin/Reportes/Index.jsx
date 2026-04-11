import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import { route } from 'ziggy-js';
import { BarChart3, FileText, Filter, PieChart } from 'lucide-react';

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
  const gananciasCategorias = useMemo(() => {
    const base = [
      {
        label: 'Celulares',
        value: Number(resumen.ganancias_por_tipo?.celulares ?? 0),
        color: '#2563eb',
      },
      {
        label: 'Computadoras',
        value: Number(resumen.ganancias_por_tipo?.computadoras ?? 0),
        color: '#16a34a',
      },
      {
        label: 'Productos Generales',
        value: Number(resumen.ganancias_por_tipo?.generales ?? 0),
        color: '#f59e0b',
      },
      {
        label: 'Productos Apple',
        value: Number(resumen.ganancias_por_tipo?.productos_apple ?? 0),
        color: '#6366f1',
      },
      {
        label: 'Servicio Técnico',
        value: Number(resumen.ganancias_por_tipo?.servicio_tecnico ?? 0),
        color: '#06b6d4',
      },
    ];

    const positivas = base
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return positivas.length ? positivas : base;
  }, [resumen]);

  const totalGananciaCategorias = gananciasCategorias.reduce(
    (acc, item) => acc + item.value,
    0
  );

  const chartData = useMemo(
    () => ({
      series: gananciasCategorias.map((item) => item.value),
      options: {
        chart: {
          type: 'donut',
          toolbar: { show: false },
          parentHeightOffset: 0,
        },
        labels: gananciasCategorias.map((item) => item.label),
        colors: gananciasCategorias.map((item) => item.color),
        stroke: {
          width: 0,
        },
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: true,
          formatter: (value) => `${Math.round(value)}%`,
          style: {
            fontSize: '12px',
            fontWeight: 700,
          },
          dropShadow: {
            enabled: false,
          },
        },
        tooltip: {
          y: {
            formatter: (value) => `${Number(value).toFixed(2)} Bs`,
          },
        },
        plotOptions: {
          pie: {
            expandOnClick: false,
            donut: {
              size: '72%',
              labels: {
                show: true,
                name: {
                  show: true,
                  offsetY: 18,
                  fontSize: '13px',
                },
                value: {
                  show: true,
                  offsetY: -12,
                  fontSize: '20px',
                  fontWeight: 800,
                  formatter: (value) => `${Number(value).toFixed(0)} Bs`,
                },
                total: {
                  show: true,
                  showAlways: true,
                  label: 'Ganancia total',
                  fontSize: '13px',
                  fontWeight: 700,
                  formatter: () =>
                    `${Number(totalGananciaCategorias).toFixed(2)} Bs`,
                },
              },
            },
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 320,
              },
              dataLabels: {
                enabled: false,
              },
            },
          },
        ],
      },
    }),
    [gananciasCategorias, totalGananciaCategorias]
  );

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
                <Filter size={16} />
                Filtrar
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
            <PieChart size={16} style={{ marginRight: 6 }} />
            Ganancias por categoría
          </CrudSectionTitle>

          <div style={{ marginBottom: 18, color: '#64748b', fontSize: 14 }}>
            El gráfico muestra únicamente la ganancia total acumulada por categoría.
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)] lg:items-center">
            <div style={{ minWidth: 0 }}>
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="donut"
                height={380}
              />
            </div>

            <div className="grid gap-3">
              {gananciasCategorias.map((item) => {
                const porcentaje =
                  totalGananciaCategorias > 0
                    ? (item.value / totalGananciaCategorias) * 100
                    : 0;

                return (
                  <div
                    key={item.label}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 14,
                      padding: '14px 16px',
                      background: '#f8fafc',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            background: item.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: '#0f172a',
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      <span
                        style={{
                          color: '#64748b',
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>

                    <div
                      style={{
                        color: '#0f172a',
                        fontSize: 18,
                        fontWeight: 800,
                      }}
                    >
                      {item.value.toFixed(2)} Bs
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CrudCard>

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>
            <FileText size={16} style={{ marginRight: 6 }} />
            Detalle de movimientos
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
