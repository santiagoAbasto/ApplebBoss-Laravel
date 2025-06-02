import React from 'react';
import Chart from 'react-apexcharts';

export default function SalesChart({ resumen_total = {} }) {
  const totalCosto = resumen_total.total_costo || 0;
  const totalPermuta = resumen_total.total_permuta || 0;
  const totalDescuento = resumen_total.total_descuento || 0;
  const gananciaCelularesComputadoras = resumen_total.ganancia_productos || 0;
  const gananciaProductosGenerales = resumen_total.ganancia_productos_generales || 0;

  const inversionTotal = totalCosto + totalPermuta;

  const series = [
    inversionTotal,
    totalDescuento,
    gananciaCelularesComputadoras,
    gananciaProductosGenerales,
  ];

  const labels = [
    '🟡 Inversión Total (Costo + Permuta)',
    '🔴 Descuento Total Aplicado',
    '🟢 Ganancia: Celulares / Computadoras',
    '🟣 Ganancia: Productos Generales',
  ];

  const options = {
    chart: {
      type: 'donut',
      height: 350,
      toolbar: { show: false },
    },
    labels,
    colors: ['#fde047', '#f87171', '#34d399', '#8b5cf6'],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '13px',
        colors: ['#111'],
      },
      formatter: (val, opts) => {
        const valNumber = opts.w.config.series[opts.seriesIndex];
        return `Bs ${valNumber.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: {
        colors: '#444',
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `Bs ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
          chart: {
            height: 300,
          },
          legend: {
            fontSize: '11px',
          },
        },
      },
    ],
  };

  const totalSum = series.reduce((acc, val) => acc + val, 0);

  return (
    <div className="card bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        📊 Análisis Económico por Categoría
      </h2>
      {totalSum > 0 ? (
        <Chart options={options} series={series} type="donut" height={350} />
      ) : (
        <div className="text-gray-500 text-center py-8">
          No hay datos disponibles para mostrar el gráfico.
        </div>
      )}
    </div>
  );
}
