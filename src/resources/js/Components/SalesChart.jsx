import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

export default function SalesChart({
  distribucion_economica = [],
  resumen_total = {},
  title = 'Utilidad por Categoría',
}) {

  const { series, labels, totalUtilidad } = useMemo(() => {

    const s = distribucion_economica.map(i =>
      Math.round(Number(i?.valor || 0))
    );

    const l = distribucion_economica.map(i =>
      String(i?.label ?? '')
    );

    const total = Math.round(
      Number(resumen_total?.ganancia_neta || 0)
    );

    return {
      series: s,
      labels: l,
      totalUtilidad: total,
    };

  }, [distribucion_economica, resumen_total]);


  const options = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 420,
      toolbar: { show: false },
      parentHeightOffset: 0,
    },

    labels,

    colors: [
      '#3b82f6', // Celulares
      '#10b981', // Computadoras
      '#f59e0b', // Productos Generales
      '#8b5cf6', // Productos Apple
      '#ec4899', // Servicios Técnicos
    ],

    stroke: { width: 0 },

    dataLabels: {
      enabled: true,
      formatter: (percent) => `${Math.round(percent)}%`,
      style: {
        fontSize: '14px',
        fontWeight: 600,
      },
    },

    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '70%',
          labels: {
            show: true,

            total: {
              show: true,
              label: 'Utilidad Total',
              fontSize: '16px',
              fontWeight: 600,
              formatter: () =>
                totalUtilidad < 0
                  ? `Se invirtió Bs ${Math.abs(totalUtilidad).toLocaleString('es-BO')}`
                  : `Bs ${totalUtilidad.toLocaleString('es-BO')}`,
            },
          },
        },
      },
    },

    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,

      offsetY: 50, // 👈 AQUI la separas hacia abajo

      formatter: (seriesName) =>
        `<span style="white-space: nowrap;">${seriesName}</span>`,

      itemMargin: {
        horizontal: 18,
        vertical: 0,
      },

      markers: {
        width: 12,
        height: 12,
        radius: 12,
      },
    },


    tooltip: {
      y: {
        formatter: (val) =>
          `Bs ${Math.round(val).toLocaleString('es-BO')}`,
      },
    },

  }), [labels, totalUtilidad]);


  return (
    <div className="w-full">

      <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
        {title}
      </h2>

      <div className="flex justify-center">
        <div className="w-full max-w-[850px]">
          <Chart
            options={options}
            series={series}
            type="donut"
            height={420}
          />
        </div>
      </div>

    </div>
  );
}
