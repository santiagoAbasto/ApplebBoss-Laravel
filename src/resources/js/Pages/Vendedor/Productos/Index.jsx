import VendedorLayout from "@/Layouts/VendedorLayout";
import InventoryTable from "@/Components/InventoryTable";
import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

export default function Index({
  celulares = [],
  computadoras = [],
  productosGenerales = [],
  productosApple = [],
}) {
  const [activeTab, setActiveTab] = useState("celulares");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const tabs = {
    celulares: {
      label: "Celulares",
      data: celulares?.data || [],
      links: celulares?.links || [],
      empty: "No se encontraron celulares con esa búsqueda.",
    },
    computadoras: {
      label: "Computadoras",
      data: computadoras?.data || [],
      links: computadoras?.links || [],
      empty: "No se encontraron computadoras con esa búsqueda.",
    },
    productosGenerales: {
      label: "Productos Generales",
      data: productosGenerales?.data || [],
      links: productosGenerales?.links || [],
      empty: "No se encontraron productos generales con esa búsqueda.",
    },
    productosApple: {
      label: "Productos Apple",
      data: productosApple?.data || [],
      links: productosApple?.links || [],
      empty: "No se encontraron productos Apple con esa búsqueda.",
    },
  };

  const filteredProducts = useMemo(() => {
    const currentData = tabs[activeTab]?.data || [];
    const term = debouncedSearchTerm.trim().toLowerCase();

    if (!term) return currentData;

    return currentData.filter((item) =>
      [
        item.modelo,
        item.nombre,
        item.procesador,
        item.numero_serie,
        item.codigo,
        item.tipo,
        item.capacidad,
        item.color,
        item.imei_1,
        item.imei_2,
        item.estado,
      ].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [debouncedSearchTerm, activeTab, tabs]);

  const formatPaginationLabel = (label) => {
    if (label.includes("previous")) return "Anterior";
    if (label.includes("next")) return "Siguiente";
    return label;
  };

  return (
    <VendedorLayout>
      <Head title="Inventario" />

      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Inventario
            </h1>
            <p className="text-sm text-slate-500">
              Productos ordenados por disponibilidad para consulta de ventas.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {Object.entries(tabs).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setSearchTerm("");
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === key
                    ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/30"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Buscar por modelo, IMEI, serie, código o estado..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              {tabs[activeTab].label}
            </h2>
          </div>

          <InventoryTable
            items={filteredProducts}
            type={activeTab}
            showIndex
            emptyMessage={tabs[activeTab].empty}
          />

          {tabs[activeTab]?.links?.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200 bg-white p-5">
              {tabs[activeTab].links.map((link, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={!link.url}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    link.active
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  } ${!link.url ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={() => {
                    if (link.url) window.location.href = link.url;
                  }}
                >
                  {formatPaginationLabel(link.label)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </VendedorLayout>
  );
}
