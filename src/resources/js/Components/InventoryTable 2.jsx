const money = (value) => `Bs ${Number(value || 0).toFixed(2)}`;

const clean = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

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

function FieldLine({ label, value, money: isMoney = false, mono = false }) {
  const display = clean(value);

  return (
    <div className="flex min-w-0 items-baseline gap-1 leading-4">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className={`min-w-0 truncate text-slate-700 ${mono ? "font-mono text-[11px]" : ""}`}>
        {display ? (isMoney ? money(display) : display) : emptyCell}
      </span>
    </div>
  );
}

function MoneyStack({ item }) {
  return (
    <div className="space-y-1">
      <FieldLine label="Costo" value={item.precio_costo} money />
      <FieldLine label="Venta" value={item.precio_venta} money />
    </div>
  );
}

const columnsByType = {
  celulares: [
    {
      key: "producto",
      label: "Producto",
      width: "18%",
      strong: true,
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <div className="truncate font-semibold text-slate-900">{clean(item.modelo) || emptyCell}</div>
          <FieldLine label="Cap." value={item.capacidad} />
          <FieldLine label="Color" value={item.color} />
        </div>
      ),
    },
    {
      key: "imei",
      label: "IMEI",
      width: "20%",
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <FieldLine label="1" value={item.imei_1} mono />
          <FieldLine label="2" value={item.imei_2} mono />
          <FieldLine label="Estado" value={item.estado_imei} />
        </div>
      ),
    },
    {
      key: "detalle",
      label: "Detalle",
      width: "14%",
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <FieldLine label="Bat." value={item.bateria} />
          <FieldLine label="Proc." value={item.procedencia} />
        </div>
      ),
    },
    { key: "precios", label: "Precios", width: "15%", render: (item) => <MoneyStack item={item} /> },
    { key: "estado", label: "Estado", width: "11%", status: true },
  ],
  computadoras: [
    {
      key: "equipo",
      label: "Equipo",
      width: "25%",
      strong: true,
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <div className="truncate font-semibold text-slate-900">{clean(item.nombre) || emptyCell}</div>
          <FieldLine label="CPU" value={item.procesador} />
        </div>
      ),
    },
    {
      key: "serie",
      label: "Serie",
      width: "18%",
      render: (item) => <span className="block truncate font-mono text-[11px] text-slate-700">{clean(item.numero_serie) || emptyCell}</span>,
    },
    {
      key: "specs",
      label: "Specs",
      width: "18%",
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <FieldLine label="RAM" value={item.ram} />
          <FieldLine label="Bat." value={item.bateria} />
          <FieldLine label="SSD" value={item.almacenamiento} />
        </div>
      ),
    },
    { key: "precios", label: "Precios", width: "16%", render: (item) => <MoneyStack item={item} /> },
    { key: "estado", label: "Estado", width: "11%", status: true },
  ],
  productosApple: [
    {
      key: "producto",
      label: "Producto",
      width: "20%",
      strong: true,
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <div className="truncate font-semibold text-slate-900">{clean(item.modelo) || emptyCell}</div>
          <FieldLine label="Cap." value={item.capacidad} />
          <FieldLine label="Color" value={item.color} />
          <FieldLine label="Bat." value={item.bateria} />
        </div>
      ),
    },
    {
      key: "codigos",
      label: "Codigos",
      width: "24%",
      render: (item) => (
        <div className="min-w-0 space-y-0.5">
          <FieldLine label="IMEI 1" value={item.imei_1} mono />
          <FieldLine label="IMEI 2" value={item.imei_2} mono />
          <FieldLine label="Serie" value={item.numero_serie} mono />
          <FieldLine label="Estado" value={item.estado_imei} />
        </div>
      ),
    },
    {
      key: "detalle",
      label: "Detalle",
      width: "12%",
      render: (item) => <FieldLine label="Proc." value={item.procedencia} />,
    },
    { key: "precios", label: "Precios", width: "15%", render: (item) => <MoneyStack item={item} /> },
    { key: "estado", label: "Estado", width: "11%", status: true },
  ],
  productosGenerales: [
    { key: "codigo", label: "Codigo", width: "16%", mono: true, strong: true },
    { key: "tipo", label: "Tipo", width: "14%", humanize: true },
    { key: "nombre", label: "Nombre", width: "24%", strong: true },
    { key: "procedencia", label: "Procedencia", width: "14%" },
    { key: "precios", label: "Precios", width: "16%", render: (item) => <MoneyStack item={item} /> },
    { key: "estado", label: "Estado", width: "10%", status: true },
  ],
};

function StatusBadge({ value }) {
  const normalized = clean(value).toLowerCase();
  const classes = statusStyles[normalized] || "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-extrabold capitalize ring-1 ${classes}`}>
      {normalized || "-"}
    </span>
  );
}

function renderValue(item, column) {
  if (column.render) return column.render(item);

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

  return (
    <div className="w-full overflow-hidden">
      <style>{`
        .inventory-actions button,
        .inventory-actions a {
          min-height: 34px !important;
          height: 34px !important;
          padding: 0 12px !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          white-space: nowrap !important;
        }
      `}</style>
      <table
        className="w-full table-fixed border-collapse text-left"
      >
        <colgroup>
          {showIndex && <col style={{ width: "42px" }} />}
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width || "auto" }} />
          ))}
          {actionsRenderer && <col style={{ width: "156px" }} />}
        </colgroup>
        <thead>
          <tr className="bg-slate-100">
            {showIndex && (
              <th className="px-2 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-600 align-middle">
                #
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-2 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-600 align-middle sm:px-3 ${column.center ? "text-center" : ""}`}
              >
                {column.label}
              </th>
            ))}
            {actionsRenderer && (
              <th className="bg-slate-100 px-2 py-3 text-center text-[11px] font-extrabold uppercase tracking-wide text-slate-600 align-middle sm:px-3">
                Acciones
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item.id} className="group transition-colors hover:bg-slate-50">
                {showIndex && (
                  <td className="whitespace-nowrap px-2 py-3 text-xs font-semibold text-slate-500 align-middle">
                    {index + 1}
                  </td>
                )}
                {columns.map((column) => {
                  const value = renderValue(item, column);
                  const isEmpty = value === emptyCell;

                  return (
                    <td
                      key={column.key}
                      className={`min-w-0 px-2 py-3 text-[13px] text-slate-700 align-middle sm:px-3 ${column.strong ? "font-semibold text-slate-900" : ""} ${column.mono ? "truncate font-mono text-[11px]" : ""} ${column.center || (isEmpty && column.centerEmpty) ? "text-center" : ""}`}
                    >
                      {value}
                    </td>
                  );
                })}
                {actionsRenderer && (
                  <td className="bg-white px-2 py-3 text-center align-middle sm:px-3">
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
