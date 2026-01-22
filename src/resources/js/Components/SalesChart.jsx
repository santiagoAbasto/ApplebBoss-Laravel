// resources/js/Components/SalesChart.jsx
import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

export default function SalesChart({
  distribucion_economica = [],
  resumen_total = {},
  title = '📊 Distribución Económica (con egresos)',
}) {
  const fromBackend =
    Array.isArray(distribucion_economica) && distribucion_economica.length > 0;

  const {
    series,
    labels,
    egresosTotal,
    gananciaNeta,
    utilidadDespuesEgresos,
    totalVentas,
  } = useMemo(() => {
    const gnFallback =
      Number(resumen_total.ganancia_productos || 0) +
      Number(resumen_total.ganancia_productos_generales || 0) +
      Number(resumen_total.ganancia_servicios || 0);

    const gNeta =
      typeof resumen_total.ganancia_neta === 'number'
        ? Number(resumen_total.ganancia_neta)
        : gnFallback;

    const totalVentasCentro =
      resumen_total.total_ventas !== undefined
        ? Number(resumen_total.total_ventas || 0)
        : Number(resumen_total.total_costo || 0) + gNeta;

    if (fromBackend) {
      const s = distribucion_economica.map(i => Number(i?.valor || 0));
      const l = distribucion_economica.map(i => String(i?.label ?? ''));

      const idxUtilidad = l.findIndex(x =>
        x.toLowerCase().includes('utilidad'),
      );
      const utilidad = idxUtilidad >= 0 ? Number(s[idxUtilidad]) : 0;

      const idxEgresos = l.findIndex(x => x.toLowerCase() === 'egresos');
      const egresos =
        idxEgresos >= 0
          ? Number(s[idxEgresos])
          : Number(resumen_total.egresos_total || 0);

      return {
        series: s,
        labels: l,
        egresosTotal: egresos,
        gananciaNeta: gNeta,
        utilidadDespuesEgresos: utilidad,
        totalVentas: totalVentasCentro,
      };
    }

    const totalCosto = Number(resumen_total.total_costo || 0);
    const totalPermuta = Number(resumen_total.total_permuta || 0);
    const totalDescuento = Number(resumen_total.total_descuento || 0);
    const egresosTotalFB = Number(resumen_total.egresos_total || 0);

    const gananciaNetaFB = gNeta;
    const inversionTotal = totalCosto + totalPermuta;
    const utilidadReal = gananciaNetaFB - egresosTotalFB;

    return {
      series: [
        inversionTotal,
        totalDescuento,
        egresosTotalFB,
        Math.max(utilidadReal, 0),
      ],
      labels: [
        'Inversión (Costo + Permuta)',
        'Descuento',
        'Egresos',
        'Utilidad (después de egresos)',
      ],
      egresosTotal: egresosTotalFB,
      gananciaNeta: gananciaNetaFB,
      utilidadDespuesEgresos: utilidadReal,
      totalVentas: totalVentasCentro,
    };
  }, [fromBackend, distribucion_economica, resumen_total]);

  const options = useMemo(
    () => ({
      chart: {
        type: 'donut',
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 350,
        },
      },

      labels,

      // 🎨 COLORES REALES (estos son los que aparecen al hacer hover)
      colors: ['#facc15', '#f87171', '#f43f5e', '#22c55e'],

      stroke: {
        show: true,
        width: 2,
        colors: ['#e5e7eb'],
      },

      dataLabels: {
        enabled: true,
        formatter: (percent) => `${percent.toFixed(0)}%`,
        style: {
          fontSize: '12px',
          fontWeight: 700,
          colors: ['#374151'],
        },
        dropShadow: { enabled: false },
      },

      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: { show: true, fontSize: '13px', fontWeight: 700 },
              value: {
                show: true,
                fontSize: '12px',
                formatter: (val) =>
                  `Bs ${Number(val).toLocaleString('es-BO')}`,
              },
              total: {
                show: true,
                label: 'Total Ventas',
                fontSize: '15px',
                fontWeight: 700,
                formatter: () =>
                  `Bs ${Number(totalVentas || 0).toLocaleString('es-BO')}`,
              },
            },
          },
        },
      },

      legend: {
        position: 'bottom',
        fontSize: '13px',
        labels: { colors: '#374151' },
      },

      tooltip: {
        y: {
          formatter: (val) =>
            `Bs ${Number(val).toLocaleString('es-BO', {
              minimumFractionDigits: 2,
            })}`,
        },
      },
    }),
    [labels, totalVentas],
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-700">
        <span>
          Egresos:{' '}
          <strong className="text-rose-600">
            Bs {Number(egresosTotal || 0).toLocaleString('es-BO')}
          </strong>
        </span>

        {typeof gananciaNeta === 'number' && (
          <span>
            Ganancia neta:{' '}
            <strong className="text-green-600">
              Bs {Number(gananciaNeta || 0).toLocaleString('es-BO')}
            </strong>
          </span>
        )}

        <span>
          Utilidad después de egresos:{' '}
          <strong
            className={
              (utilidadDespuesEgresos || 0) < 0
                ? 'text-rose-600'
                : 'text-green-600'
            }
          >
            Bs {Number(utilidadDespuesEgresos || 0).toLocaleString('es-BO')}
          </strong>
        </span>
      </div>

      <Chart options={options} series={series} type="donut" height={420} />

      {(utilidadDespuesEgresos || 0) < 0 && (
        <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <strong>Se invirtió:</strong> la utilidad después de egresos es negativa
          por Bs{' '}
          {Math.abs(Number(utilidadDespuesEgresos || 0)).toLocaleString('es-BO')}.
        </div>
      )}
    </div>
  );
}
