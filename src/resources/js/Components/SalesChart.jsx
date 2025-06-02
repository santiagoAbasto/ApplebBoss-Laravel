import React from 'react';
import Chart from 'react-apexcharts';

export default function SalesChart({ resumen_total = {} }) {
  const inversionTotal = (resumen_total.total_costo || 0) + (resumen_total.total_permuta || 0);
  const descuentoTotal = resumen_total.total_descuento || 0;
  const gananciaCelularesComputadoras = resumen_total.ganancia_productos || 0;
  const gananciaProductosGenerales = resumen_total.ganancia_productos_generales || 0;
  const gananciaServicios = resumen_total.ganancia_servicios || 0;

  const series = [
    inversionTotal,
    descuentoTotal,
    gananciaCelularesComputadoras,
    gananciaProductosGenerales,
    gananciaServicios,
  ];

  const totalSum = series.reduce((acc, val) => acc + val, 0);

  const labels = [
    '🟡 Inversión (Costo + Permuta por ítem)',
    '🔴 Descuento Total Aplicado',
    '🟢 Ganancia: Celulares / Computadoras',
    '🟣 Ganancia: Productos Generales',
    '🔧 Ganancia: Servicios Técnicos',
  ];

  const colors = ['#facc15', '#f87171', '#22c55e', '#8b5cf6', '#3b82f6'];

  const options = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
    },
    labels,
    colors,
    dataLabels: {
      enabled: true,
      style: { fontSize: '13px', fontWeight: 'bold' },
      formatter: (val, opts) => {
        const value = opts.w.config.series[opts.seriesIndex];
        return `${val.toFixed(1)}%`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 'bold',
            },
            value: {
              show: true,
              fontSize: '12px',
              formatter: (val) => `Bs ${parseFloat(val).toLocaleString('es-BO')}`,
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
              formatter: () => `Bs ${totalSum.toLocaleString('es-BO')}`,
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: '#444' },
    },
    tooltip: {
      y: {
        formatter: val => `Bs ${val.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#fff'],
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 280 },
          legend: { fontSize: '11px' },
        },
      },
    ],
  };

  return (
    <div className="card bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        📊 Análisis Económico por Categoría
      </h2>
      {totalSum > 0 ? (
        <Chart options={options} series={series} type="donut" height={370} />
      ) : (
        <div className="text-gray-500 text-center py-8">
          No hay datos disponibles para mostrar el gráfico.
        </div>
      )}
    </div>
  );
}
