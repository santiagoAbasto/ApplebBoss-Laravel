import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { PieChart } from 'lucide-react';

export default function SalesChart({
  distribucion_economica = [],
  resumen_total = {},
  title = 'Utilidad por Categoría',
}) {

  const { series, labels, totalUtilidad, chartItems, hasData } = useMemo(() => {
    const items = distribucion_economica
      .map((item, index) => ({
        label: String(item?.label ?? ''),
        value: Math.round(Number(item?.valor || 0)),
        color: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
        ][index],
      }))
      .filter((item) => item.label);

    const positiveItems = items
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const visibleItems = positiveItems.length ? positiveItems : items;
    const total = Math.round(Number(resumen_total?.ganancia_neta || 0));

    return {
      series: visibleItems.map((item) => item.value),
      labels: visibleItems.map((item) => item.label),
      totalUtilidad: total,
      chartItems: visibleItems,
      hasData: positiveItems.length > 0,
    };
  }, [distribucion_economica, resumen_total]);


  const options = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 460,
      toolbar: { show: false },
      parentHeightOffset: 0,
    },

    labels,

    colors: chartItems.map((item) => item.color),

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
          size: '68%',
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 20,
              fontSize: '14px',
            },
            value: {
              show: true,
              offsetY: -14,
              fontSize: '24px',
              fontWeight: 700,
              formatter: (value) => `Bs ${Math.round(value).toLocaleString('es-BO')}`,
            },

            total: {
              show: true,
              label: 'Utilidad Total',
              fontSize: '15px',
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
      offsetY: 16,

      formatter: (seriesName) =>
        `<span style="white-space: nowrap;">${seriesName}</span>`,

      itemMargin: {
        horizontal: 14,
        vertical: 6,
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

  }), [chartItems, labels, totalUtilidad]);


  return (
    <div className="w-full">

      <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
        {title}
      </h2>

      {!hasData ? (
        <div className="mx-auto flex min-h-[360px] max-w-[920px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
            <PieChart size={28} className="text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            Bs {totalUtilidad.toLocaleString('es-BO')}
          </div>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Aun no hay utilidad distribuida por categoria en el periodo seleccionado.
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-[920px]">
            <Chart
              options={options}
              series={series}
              type="donut"
              height={460}
            />
          </div>
        </div>
      )}

    </div>
  );
}
