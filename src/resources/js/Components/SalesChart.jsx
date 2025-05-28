import React from 'react';
import Chart from 'react-apexcharts';

export default function SalesChart({ resumen_total = {} }) {
  const totalCosto = resumen_total.total_costo || 0;
  const totalDescuento = resumen_total.total_descuento || 0;
  const gananciaNeta = resumen_total.ganancia_neta || 0;

  const series = [totalCosto, totalDescuento, gananciaNeta];
  const labels = [
    'Inversión (Costo + Permuta)',
    'Descuento Aplicado',
    'Ganancia Neta',
  ];

  const options = {
    chart: {
      type: 'donut',
      height: 350,
    },
    labels,
    colors: ['#f59e0b', '#ef4444', '#10b981'], // Amarillo, rojo, verde
    dataLabels: {
      style: {
        fontSize: '14px',
      },
    },
    legend: {
      position: 'bottom',
    },
    tooltip: {
      y: {
        formatter: (val) => `Bs ${val.toLocaleString()}`,
      },
    },
  };

  const totalSum = series.reduce((acc, val) => acc + val, 0);

  return (
    <div className="card p-4 bg-white rounded-xl shadow">
      <h4 className="mb-3 font-semibold text-lg text-gray-800">📊 Distribución Económica</h4>
      {totalSum > 0 ? (
        <Chart options={options} series={series} type="donut" height={350} />
      ) : (
        <p className="text-sm text-gray-500">No hay datos disponibles para mostrar el gráfico.</p>
      )}
    </div>
  );
}
