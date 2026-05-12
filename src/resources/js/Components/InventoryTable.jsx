const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const money = (value) => `Bs ${Number(value || 0).toFixed(2)}`;

const humanize = (value) => clean(value).replace(/_/g, " ");

const emptyCell = (
  <span className="inline-flex justify-center rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-400">
    -
  </span>
);

const statusStyles = {
  disponible: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  vendido: "bg-rose-50 text-rose-700 ring-rose-200",
  permuta: "bg-blue-50 text-blue-700 ring-blue-200",
};

const columnsByType = {
  celulares: [
    { key: "modelo", label: "Producto", width: "12%", strong: true },
    { key: "capacidad", label: "Cap.", width: "6%", strong: true },
    { key: "color", label: "Color", width: "8%" },
    { key: "imei_1", label: "IMEI 1", width: "11%", mono: true },
    { key: "imei_2", label: "IMEI 2", width: "9%", mono: true },
    { key: "estado_imei", label: "IMEI Estado", width: "8%" },
    { key: "bateria", label: "Bat.", width: "5%", center: true },
    { key: "procedencia", label: "Proc.", width: "9%" },
    { key: "precio_costo", label: "Costo", width: "7%", money: true },
    { key: "precio_venta", label: "Venta", width: "7%", money: true, strong: true },
    { key: "estado", label: "Estado", width: "8%", status: true },
  ],
  computadoras: [
    { key: "nombre", label: "Equipo", width: "13%", strong: true },
    { key: "procesador", label: "Procesador", width: "18%" },
    { key: "numero_serie", label: "Serie", width: "13%", mono: true },
    { key: "ram", label: "RAM", width: "5%", center: true },
    { key: "bateria", label: "Bat.", width: "7%", center: true },
    { key: "almacenamiento", label: "Almac.", width: "8%" },
    { key: "precio_costo", label: "Costo", width: "7%", money: true },
    { key: "precio_venta", label: "Venta", width: "7%", money: true, strong: true },
    { key: "estado", label: "Estado", width: "8%", status: true },
  ],
  productosApple: [
    { key: "modelo", label: "Producto", width: "12%", strong: true },
    { key: "capacidad", label: "Cap.", width: "6%" },
    { key: "color", label: "Color", width: "7%" },
    { key: "bateria", label: "Bat.", width: "5%", center: true },
    { key: "imei_1", label: "IMEI 1", width: "10%", mono: true },
    { key: "imei_2", label: "IMEI 2", width: "9%", mono: true },
    { key: "numero_serie", label: "Serie", width: "10%", mono: true },
    { key: "estado_imei", label: "IMEI Estado", width: "9%" },
    { key: "procedencia", label: "Proc.", width: "7%" },
    { key: "precio_costo", label: "Costo", width: "6%", money: true },
    { key: "precio_venta", label: "Venta", width: "6%", money: true, strong: true },
    { key: "estado", label: "Estado", width: "7%", status: true },
  ],
  productosGenerales: [
    { key: "codigo", label: "Codigo", width: "13%", mono: true, strong: true },
    { key: "tipo", label: "Tipo", width: "11%", humanize: true },
    { key: "nombre", label: "Nombre", width: "23%", strong: true },
    { key: "procedencia", label: "Proc.", width: "10%" },
    { key: "precio_costo", label: "Costo", width: "9%", money: true },
    { key: "precio_venta", label: "Venta", width: "9%", money: true, strong: true },
    { key: "estado", label: "Estado", width: "8%", status: true },
  ],
};

function StatusBadge({ value }) {
  const normalized = clean(value).toLowerCase();
  const classes = statusStyles[normalized] || "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize leading-none ring-1 ${classes}`}
    >
      {normalized || "-"}
    </span>
  );
}

function CellValue({ item, column }) {
  const rawValue = item[column.key];
  const value = column.humanize ? humanize(rawValue) : clean(rawValue);

  if (column.status) return <StatusBadge value={value} />;
  if (!value || value === "-") return emptyCell;
  if (column.money) return money(value);

  return value;
}

export default function InventoryTable({
  items = [],
  type,
  actionsRenderer,
  emptyMessage = "No se encontraron productos.",
  showIndex = false,
}) {
  const columns = columnsByType[type] || [];
  const totalColumns = columns.length + (showIndex ? 1 : 0) + (actionsRenderer ? 1 : 0);
  const actionWidth = actionsRenderer ? (type === "productosGenerales" ? "17%" : "10%") : null;

  return (
    <div className="w-full overflow-hidden">
      <style>{`
        .inventory-actions button,
        .inventory-actions a {
          height: 36px !important;
          min-height: 36px !important;
          padding: 0 10px !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          white-space: nowrap !important;
        }
      `}</style>

      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          {showIndex && <col style={{ width: "3%" }} />}
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
          {actionsRenderer && <col style={{ width: actionWidth }} />}
        </colgroup>

        <thead>
          <tr className="border-y border-slate-200 bg-slate-100/90">
            {showIndex && (
              <th className="px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 align-middle">
                #
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 align-middle ${column.center ? "text-center" : ""}`}
              >
                {column.label}
              </th>
            ))}
            {actionsRenderer && (
              <th className="px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-wide text-slate-500 align-middle">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item.id} className="transition-colors even:bg-slate-50/45 hover:bg-blue-50/40">
                {showIndex && (
                  <td className="px-3 py-4 text-xs font-semibold text-slate-500 align-middle">
                    {index + 1}
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-4 text-[13px] text-slate-700 align-middle ${column.center ? "text-center" : ""}`}
                  >
                    <div
                      className={`min-w-0 truncate ${column.strong ? "font-semibold text-slate-900" : ""} ${column.mono ? "font-mono text-[11px]" : ""}`}
                      title={clean(item[column.key])}
                    >
                      <CellValue item={item} column={column} />
                    </div>
                  </td>
                ))}
                {actionsRenderer && (
                  <td className="px-3 py-4 text-center align-middle">
                    <div className="inventory-actions flex items-center justify-center gap-2">
                      {actionsRenderer(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={totalColumns} className="px-5 py-12 text-center text-sm font-medium text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
