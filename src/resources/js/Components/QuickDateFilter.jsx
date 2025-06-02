import React from 'react';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';

export default function QuickDateFilter({ vendedorId = '' }) {
  const hoy = dayjs();
  const hoyStr = hoy.format('YYYY-MM-DD');

  const rangos = {
    hoy: { inicio: hoyStr, fin: hoyStr },
    semana: {
      inicio: hoy.startOf('week').format('YYYY-MM-DD'),
      fin: hoy.endOf('week').format('YYYY-MM-DD'),
    },
    mes: {
      inicio: hoy.startOf('month').format('YYYY-MM-DD'),
      fin: hoy.endOf('month').format('YYYY-MM-DD'),
    },
    anio: {
      inicio: hoy.startOf('year').format('YYYY-MM-DD'),
      fin: hoy.endOf('year').format('YYYY-MM-DD'),
    },
  };

  const aplicarFiltro = (rango) => {
    const fechas = rangos[rango];
    router.get(route('admin.dashboard'), {
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
      vendedor_id: vendedorId,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 px-4">
      <span className="text-sm text-gray-600 mr-2 font-medium">🔎 Rango rápido:</span>
      <button onClick={() => aplicarFiltro('hoy')} className="btn btn-sm bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold px-3 py-1 rounded">
        Hoy
      </button>
      <button onClick={() => aplicarFiltro('semana')} className="btn btn-sm bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold px-3 py-1 rounded">
        Semana
      </button>
      <button onClick={() => aplicarFiltro('mes')} className="btn btn-sm bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold px-3 py-1 rounded">
        Mes
      </button>
      <button onClick={() => aplicarFiltro('anio')} className="btn btn-sm bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold px-3 py-1 rounded">
        Año
      </button>
    </div>
  );
}
