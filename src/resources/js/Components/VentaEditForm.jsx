import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Plus, Save, Search, Trash2 } from 'lucide-react';
import CardPaymentFields from '@/Components/CardPaymentFields';

const money = (value) => Number(value || 0);

const productTypes = [
  { value: 'celular', label: 'Celular' },
  { value: 'computadora', label: 'Computadora' },
  { value: 'producto_general', label: 'Producto general' },
  { value: 'producto_apple', label: 'Producto Apple' },
];

const productoNombre = (item) => {
  if (item.nombre_producto) return item.nombre_producto;
  if (item.celular?.modelo) return item.celular.modelo;
  if (item.computadora?.nombre) return item.computadora.nombre;
  if (item.producto_apple?.modelo) return item.producto_apple.modelo;
  if (item.producto_general?.nombre) return item.producto_general.nombre;
  return 'Producto';
};

const productoRelacion = (item) => (
  item.celular || item.computadora || item.producto_apple || item.producto_general || null
);

const productTitle = (product) => (
  product?.nombre || product?.modelo || product?.codigo || product?.numero_serie || 'Producto'
);

const productCode = (product) => (
  product?.codigo || product?.imei_1 || product?.imei_2 || product?.numero_serie || ''
);

const productSubtitle = (product, tipo) => {
  const parts = [
    productCode(product),
    product?.capacidad,
    product?.color,
    product?.bateria ? `Bateria ${product.bateria}` : null,
    product?.procesador,
    product?.ram,
    product?.almacenamiento,
    product?.estado && product.estado !== 'disponible' ? product.estado : null,
  ].filter(Boolean);

  return `${productTypes.find((type) => type.value === tipo)?.label || 'Producto'}${parts.length ? ` - ${parts.join(' - ')}` : ''}`;
};

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const searchText = (product) => normalizeText([
  product?.codigo,
  product?.imei_1,
  product?.imei_2,
  product?.numero_serie,
  product?.nombre,
  product?.modelo,
  product?.tipo,
  product?.capacidad,
  product?.color,
  product?.bateria,
  product?.procesador,
  product?.ram,
  product?.almacenamiento,
].filter(Boolean).join(' '));

const productSearchScore = (product, terms) => {
  const title = normalizeText(productTitle(product));
  const code = normalizeText(productCode(product));
  const imeiOne = normalizeText(product?.imei_1);
  const imeiTwo = normalizeText(product?.imei_2);
  const serie = normalizeText(product?.numero_serie);
  const searchable = searchText(product);

  return terms.reduce((score, term) => {
    if (code === term || imeiOne === term || imeiTwo === term || serie === term) return score + 100;
    if (code.startsWith(term) || imeiOne.startsWith(term) || imeiTwo.startsWith(term) || serie.startsWith(term)) return score + 70;
    if (title.startsWith(term)) return score + 50;
    if (title.includes(term)) return score + 30;
    if (searchable.includes(term)) return score + 10;
    return score;
  }, 0);
};

const displaySearchValue = (tipo, product, fallback = '') => {
  if (!product) return fallback;
  const code = productCode(product);
  return `${productTitle(product)}${code ? ` - ${code}` : ''}`;
};

const productId = (value) => Number(value || 0);

export default function VentaEditForm({
  venta,
  productosGenerales = [],
  inventarioEdicion = {},
  routePrefix,
  accent = 'emerald',
}) {
  const servicio = venta.servicio_tecnico || {};
  const esServicio = venta.tipo_venta === 'servicio_tecnico' && Boolean(servicio.id);
  const [selectorActivo, setSelectorActivo] = useState(null);
  const [selectorErrores, setSelectorErrores] = useState({});
  const [nuevoProducto, setNuevoProducto] = useState({
    tipo: 'producto_general',
    busqueda: '',
    producto: null,
  });

  const inventario = useMemo(() => ({
    celular: inventarioEdicion.celulares || [],
    computadora: inventarioEdicion.computadoras || [],
    producto_general: inventarioEdicion.productosGenerales?.length
      ? inventarioEdicion.productosGenerales
      : productosGenerales,
    producto_apple: inventarioEdicion.productosApple || [],
  }), [inventarioEdicion, productosGenerales]);

  const findProduct = (tipo, id) => (
    (inventario[tipo] || []).find((product) => productId(product.id) === productId(id)) || null
  );

  const initialItems = (venta.items || []).map((item) => {
    const product = productoRelacion(item);
    const tipo = item.tipo || '';
    const nombreActual = productoNombre(item);
    const productoActualId = item.producto_id || product?.id || '';

    return {
      id: item.id,
      local_id: item.id ? null : `item-${Date.now()}-${Math.random()}`,
      tipo,
      producto_id: productoActualId,
      nombre: nombreActual,
      original_tipo: tipo,
      original_producto_id: productoActualId,
      original_nombre: nombreActual,
      original_detalle: product ? productSubtitle(product, tipo) : tipo,
      original_precio_venta: money(item.precio_venta),
      original_precio_invertido: money(item.precio_invertido),
      original_cantidad: item.cantidad || 1,
      replace_tipo: tipo,
      replace_busqueda: '',
      cantidad: item.cantidad || 1,
      precio_venta: money(item.precio_venta),
      precio_invertido: money(item.precio_invertido),
      descuento: money(item.descuento),
    };
  });

  const { data, setData, put, processing, errors } = useForm({
    nombre_cliente: venta.nombre_cliente || '',
    telefono_cliente: venta.telefono_cliente || '',
    metodo_pago: venta.metodo_pago || 'efectivo',
    inicio_tarjeta: venta.inicio_tarjeta || '',
    fin_tarjeta: venta.fin_tarjeta || '',
    notas_adicionales: venta.notas_adicionales || servicio.notas_adicionales || '',
    descuento: money(venta.descuento),
    valor_permuta: money(venta.valor_permuta),
    items: initialItems,
    servicio_tecnico: {
      equipo: servicio.equipo || '',
      detalle_servicio: servicio.detalle_servicio || '',
      tecnico: servicio.tecnico || '',
      precio_costo: money(servicio.precio_costo ?? venta.precio_invertido),
      precio_venta: money(servicio.precio_venta ?? venta.precio_venta),
    },
  });

  const hasDuplicate = (tipo, id, currentIndex = null) => data.items.some((item, index) => (
    index !== currentIndex && item.tipo === tipo && productId(item.producto_id) === productId(id)
  ));

  const clearSelectorError = (key) => {
    setSelectorErrores((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const setSelectorError = (key, message) => {
    setSelectorErrores((current) => ({ ...current, [key]: message }));
  };

  const filteredProducts = (tipo, query, limit = 8) => {
    const products = inventario[tipo] || [];
    const terms = normalizeText(query).trim().split(/\s+/).filter(Boolean);

    if (!terms.length) {
      return products.slice(0, limit);
    }

    return products
      .map((product) => ({
        product,
        score: productSearchScore(product, terms),
      }))
      .filter(({ product, score }) => {
        const searchable = searchText(product);
        return score > 0 && terms.every((term) => searchable.includes(term));
      })
      .sort((first, second) => second.score - first.score)
      .map(({ product }) => product)
      .slice(0, limit);
  };

  const patchItem = (index, patch) => {
    setData('items', data.items.map((item, i) => (
      i === index ? { ...item, ...patch } : item
    )));
  };

  const selectProductForItem = (index, product) => {
    const item = data.items[index];
    if (!item || !product) return;
    const tipoReemplazo = item.replace_tipo || item.tipo;

    if (hasDuplicate(tipoReemplazo, product.id, index)) {
      setSelectorError(`item-${index}`, 'Ese producto ya esta en otra linea de la venta.');
      return;
    }

    const cantidad = tipoReemplazo === 'producto_general' ? Math.max(1, Number(item.cantidad || 1)) : 1;

    patchItem(index, {
      tipo: tipoReemplazo,
      producto_id: product.id,
      nombre: productTitle(product),
      replace_busqueda: displaySearchValue(tipoReemplazo, product),
      cantidad,
      precio_venta: money(product.precio_venta),
      precio_invertido: money(product.precio_costo) * cantidad,
    });
    clearSelectorError(`item-${index}`);
    setSelectorActivo(null);
  };

  const updateItem = (index, field, value) => {
    const item = data.items[index];
    if (!item) return;

    if (field === 'replace_tipo') {
      patchItem(index, {
        replace_tipo: value,
        replace_busqueda: '',
      });
      clearSelectorError(`item-${index}`);
      return;
    }

    if (field === 'replace_busqueda') {
      patchItem(index, {
        replace_busqueda: value,
      });
      clearSelectorError(`item-${index}`);
      setSelectorActivo(`item-${index}`);
      return;
    }

    if (field === 'cantidad') {
      const cantidad = Math.max(1, Number(value || 1));
      const selectedProduct = findProduct(item.tipo, item.producto_id);
      patchItem(index, {
        cantidad,
        precio_invertido: selectedProduct ? money(selectedProduct.precio_costo) * cantidad : item.precio_invertido,
      });
      return;
    }

    patchItem(index, { [field]: value });
  };

  const keepOriginalItem = (index) => {
    const item = data.items[index];
    if (!item) return;

    patchItem(index, {
      tipo: item.original_tipo,
      producto_id: item.original_producto_id,
      nombre: item.original_nombre,
      replace_tipo: item.original_tipo,
      replace_busqueda: '',
      cantidad: item.original_cantidad || 1,
      precio_venta: item.original_precio_venta,
      precio_invertido: item.original_precio_invertido,
    });
    clearSelectorError(`item-${index}`);
    setSelectorActivo(null);
  };

  const removeNewItem = (index) => {
    setData('items', data.items.filter((_, i) => i !== index));
  };

  const updateServicio = (field, value) => {
    setData('servicio_tecnico', {
      ...data.servicio_tecnico,
      [field]: value,
    });
  };

  const selectNewProduct = (product) => {
    if (!product) return;
    if (hasDuplicate(nuevoProducto.tipo, product.id)) {
      setSelectorError('new', 'Ese producto ya esta en la venta.');
      return;
    }

    setNuevoProducto({
      ...nuevoProducto,
      busqueda: displaySearchValue(nuevoProducto.tipo, product),
      producto: product,
    });
    clearSelectorError('new');
    setSelectorActivo(null);
  };

  const addSelectedProduct = () => {
    const product = nuevoProducto.producto;
    if (!product) {
      setSelectorError('new', 'Selecciona un producto de la lista.');
      return;
    }

    if (hasDuplicate(nuevoProducto.tipo, product.id)) {
      setSelectorError('new', 'Ese producto ya esta en la venta.');
      return;
    }

    setData('items', [
      ...data.items,
      {
        id: null,
        local_id: `new-${nuevoProducto.tipo}-${product.id}-${Date.now()}`,
        tipo: nuevoProducto.tipo,
        producto_id: product.id,
        nombre: productTitle(product),
        original_tipo: nuevoProducto.tipo,
        original_producto_id: product.id,
        original_nombre: productTitle(product),
        original_detalle: productSubtitle(product, nuevoProducto.tipo),
        original_precio_venta: money(product.precio_venta),
        original_precio_invertido: money(product.precio_costo),
        original_cantidad: 1,
        replace_tipo: nuevoProducto.tipo,
        replace_busqueda: '',
        cantidad: 1,
        precio_venta: money(product.precio_venta),
        precio_invertido: money(product.precio_costo),
        descuento: 0,
      },
    ]);

    setNuevoProducto({
      tipo: 'producto_general',
      busqueda: '',
      producto: null,
    });
    clearSelectorError('new');
  };

  const subtotalProductos = data.items.reduce((total, item) => (
    total + Math.max(0, (money(item.precio_venta) - money(item.descuento)) * Number(item.cantidad || 1))
  ), 0);

  const capitalProductos = data.items.reduce((total, item) => total + money(item.precio_invertido), 0);
  const totalProductos = Math.max(0, subtotalProductos - money(data.descuento) - money(data.valor_permuta));
  const reservaAplicada = money(venta.monto_reserva_aplicado);
  const totalProductosACobrar = Math.max(0, totalProductos - reservaAplicada);
  const gananciaProductos = subtotalProductos - money(data.descuento) - money(data.valor_permuta) - capitalProductos;

  const subtotalServicio = Math.max(0, money(data.servicio_tecnico.precio_venta) - money(data.descuento));
  const gananciaServicio = subtotalServicio - money(data.servicio_tecnico.precio_costo);

  const submit = (e) => {
    e.preventDefault();
    put(route(`${routePrefix}.ventas.update`, venta.id), {
      preserveScroll: true,
    });
  };

  const accentClasses = {
    blue: {
      input: 'focus:border-blue-500 focus:ring-blue-500',
      searchShell: 'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700',
      tint: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    emerald: {
      input: 'focus:border-emerald-500 focus:ring-emerald-500',
      searchShell: 'focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      tint: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
  };
  const theme = accentClasses[accent] || accentClasses.emerald;
  const inputClass = `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ${theme.input}`;
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1';

  const renderSearchBox = ({
    value,
    placeholder,
    onFocus,
    onChange,
    onKeyDown,
    onBlur,
  }) => (
    <div className={`flex overflow-hidden rounded-lg border border-slate-200 bg-white ${theme.searchShell}`}>
      <div className="flex w-10 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-slate-400">
        <Search size={16} />
      </div>
      <input
        className="min-w-0 flex-1 border-0 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        value={value}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    </div>
  );

  const renderSuggestions = (key, tipo, query, onPick) => {
    if (selectorActivo !== key) return null;

    const suggestions = filteredProducts(tipo, query, 6);

    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {suggestions.length ? suggestions.map((product) => (
          <button
            key={`${tipo}-${product.id}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(product);
            }}
            className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-800">{productTitle(product)}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${product.estado === 'disponible' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                {product.estado || 'disponible'}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{productSubtitle(product, tipo)}</div>
            <div className="mt-1 text-xs font-semibold text-slate-700">
              Venta Bs {money(product.precio_venta).toFixed(2)} · Costo Bs {money(product.precio_costo).toFixed(2)}
            </div>
          </button>
        )) : (
          <div className="px-3 py-3 text-sm text-slate-500">Sin resultados disponibles para esa busqueda.</div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head title={`Editar venta ${venta.codigo_nota}`} />

      <form onSubmit={submit} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Editar venta</h1>
            <p className="text-sm text-slate-500">
              {venta.codigo_nota} · Cambia productos, montos y datos; la venta se recalcula al guardar.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={route(`${routePrefix}.ventas.index`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
            <button
              type="submit"
              disabled={processing}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${theme.button}`}
            >
              <Save size={16} />
              Guardar
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Datos del cliente</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={data.nombre_cliente}
                onChange={(e) => setData('nombre_cliente', e.target.value)}
              />
              {errors.nombre_cliente && <p className="mt-1 text-xs text-rose-600">{errors.nombre_cliente}</p>}
            </div>
            <div>
              <label className={labelClass}>Telefono</label>
              <input
                className={inputClass}
                value={data.telefono_cliente}
                onChange={(e) => setData('telefono_cliente', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Metodo de pago</label>
              <select
                className={inputClass}
                value={data.metodo_pago}
                onChange={(e) => setData('metodo_pago', e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            {data.metodo_pago === 'tarjeta' && (
              <CardPaymentFields
                inicio={data.inicio_tarjeta}
                fin={data.fin_tarjeta}
                errors={errors}
                onChangeInicio={(value) => setData('inicio_tarjeta', value)}
                onChangeFin={(value) => setData('fin_tarjeta', value)}
              />
            )}
          </div>
        </section>

        {esServicio ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Servicio tecnico</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Equipo</label>
                <input className={inputClass} value={data.servicio_tecnico.equipo} onChange={(e) => updateServicio('equipo', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tecnico</label>
                <input className={inputClass} value={data.servicio_tecnico.tecnico} onChange={(e) => updateServicio('tecnico', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Costo</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={data.servicio_tecnico.precio_costo} onChange={(e) => updateServicio('precio_costo', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Venta</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={data.servicio_tecnico.precio_venta} onChange={(e) => updateServicio('precio_venta', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Detalle</label>
                <textarea className={inputClass} rows="3" value={data.servicio_tecnico.detalle_servicio} onChange={(e) => updateServicio('detalle_servicio', e.target.value)} />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Productos de la venta</h2>
                <p className="text-sm text-slate-500">
                  Busca por nombre, codigo, IMEI o serie en cada linea y reemplaza el producto correcto.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${theme.tint}`}>
                <CheckCircle2 size={15} />
                Recalculo automatico al guardar
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Actual vendido</th>
                    <th className="px-3 py-2 text-left">Reemplazar por</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Venta</th>
                    <th className="px-3 py-2 text-right">Descuento</th>
                    <th className="px-3 py-2 text-right">Capital</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((item, index) => {
                    const subtotal = Math.max(0, (money(item.precio_venta) - money(item.descuento)) * Number(item.cantidad || 1));
                    const selectorKey = `item-${index}`;
                    const replacementType = item.replace_tipo || item.tipo;
                    const isReplacing = item.original_producto_id && (
                      item.tipo !== item.original_tipo ||
                      productId(item.producto_id) !== productId(item.original_producto_id)
                    );
                    return (
                      <tr key={item.id || item.local_id}>
                        <td className="px-3 py-3 align-top">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Producto actual
                            </div>
                            <div className="font-semibold leading-snug text-slate-800">
                              {item.original_nombre || item.nombre || 'Producto'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.original_detalle || productTypes.find((type) => type.value === item.original_tipo)?.label}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400">
                              <span>Linea #{item.id || 'nueva'}</span>
                              {item.original_producto_id && <span>Producto #{item.original_producto_id}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="min-w-[390px] space-y-3">
                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                1. Tipo
                              </label>
                              <select
                                className={inputClass}
                                value={replacementType}
                                onChange={(e) => updateItem(index, 'replace_tipo', e.target.value)}
                              >
                                {productTypes.map((type) => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                2. Buscar por nombre, codigo, IMEI o serie
                              </label>
                              {renderSearchBox({
                                value: item.replace_busqueda,
                                placeholder: 'Ej: IPHONE 17, 357679999, VIDRIO',
                                onFocus: () => setSelectorActivo(selectorKey),
                                onChange: (e) => updateItem(index, 'replace_busqueda', e.target.value),
                                onKeyDown: (e) => {
                                  if (e.key !== 'Enter') return;
                                  const firstProduct = filteredProducts(replacementType, item.replace_busqueda, 1)[0];
                                  if (!firstProduct) return;
                                  e.preventDefault();
                                  selectProductForItem(index, firstProduct);
                                },
                                onBlur: () => {
                                  setTimeout(() => {
                                    setSelectorActivo((current) => (current === selectorKey ? null : current));
                                  }, 120);
                                },
                              })}
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                3. Elegir resultado
                              </label>
                              {selectorActivo === selectorKey ? (
                                renderSuggestions(selectorKey, replacementType, item.replace_busqueda, (product) => selectProductForItem(index, product))
                              ) : isReplacing ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                  <div className="font-semibold">Reemplazo seleccionado</div>
                                  <div>{item.nombre} · Producto #{item.producto_id}</div>
                                  <button
                                    type="button"
                                    onClick={() => keepOriginalItem(index)}
                                    className="mt-2 text-xs font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2"
                                  >
                                    Mantener producto actual
                                  </button>
                                </div>
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                                  Sin reemplazo seleccionado. Se mantiene el producto actual.
                                </div>
                              )}
                            </div>
                          </div>
                          {selectorErrores[selectorKey] && (
                            <p className="mt-1 text-xs text-rose-600">{selectorErrores[selectorKey]}</p>
                          )}
                          {(errors[`items.${index}.producto_id`] || errors[`items.${index}.tipo`]) && (
                            <p className="mt-1 text-xs text-rose-600">{errors[`items.${index}.producto_id`] || errors[`items.${index}.tipo`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <input
                            type="number"
                            min="1"
                            className={`${inputClass} text-right`}
                            value={item.cantidad}
                            onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                            disabled={item.tipo !== 'producto_general'}
                          />
                          {errors[`items.${index}.cantidad`] && <p className="mt-1 text-xs text-rose-600">{errors[`items.${index}.cantidad`]}</p>}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} value={item.precio_venta} onChange={(e) => updateItem(index, 'precio_venta', e.target.value)} />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} value={item.descuento} onChange={(e) => updateItem(index, 'descuento', e.target.value)} />
                          {errors[`items.${index}.descuento`] && <p className="mt-1 text-xs text-rose-600">{errors[`items.${index}.descuento`]}</p>}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} value={item.precio_invertido} onChange={(e) => updateItem(index, 'precio_invertido', e.target.value)} />
                        </td>
                        <td className="px-3 py-3 text-right align-top font-semibold text-slate-700">
                          {subtotal.toFixed(2)} Bs
                        </td>
                        <td className="px-3 py-3 text-right align-top">
                          {!item.id && (
                            <button
                              type="button"
                              onClick={() => removeNewItem(index)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Quitar producto"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {errors.items && <p className="mt-3 text-sm text-rose-600">{errors.items}</p>}

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Agregar otro producto</h3>
                  <p className="text-xs text-slate-500">Selecciona tipo y busca sin depender de codigo exacto.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[190px_1fr_auto]">
                <select
                  className={inputClass}
                  value={nuevoProducto.tipo}
                  onChange={(e) => {
                    setNuevoProducto({ tipo: e.target.value, busqueda: '', producto: null });
                    clearSelectorError('new');
                  }}
                >
                  {productTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <div>
                  {renderSearchBox({
                    value: nuevoProducto.busqueda,
                    placeholder: 'Buscar por nombre, codigo, IMEI o serie',
                    onFocus: () => setSelectorActivo('new'),
                    onChange: (e) => {
                      setNuevoProducto({ ...nuevoProducto, busqueda: e.target.value, producto: null });
                      clearSelectorError('new');
                      setSelectorActivo('new');
                    },
                    onKeyDown: (e) => {
                      if (e.key !== 'Enter') return;
                      const firstProduct = filteredProducts(nuevoProducto.tipo, nuevoProducto.busqueda, 1)[0];
                      if (!firstProduct) return;
                      e.preventDefault();
                      selectNewProduct(firstProduct);
                    },
                    onBlur: () => {
                      setTimeout(() => {
                        setSelectorActivo((current) => (current === 'new' ? null : current));
                      }, 120);
                    },
                  })}
                  {renderSuggestions('new', nuevoProducto.tipo, nuevoProducto.busqueda, selectNewProduct)}
                </div>

                <button
                  type="button"
                  onClick={addSelectedProduct}
                  disabled={!nuevoProducto.producto}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${theme.button}`}
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
              {nuevoProducto.producto && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {displaySearchValue(nuevoProducto.tipo, nuevoProducto.producto)} · Bs {money(nuevoProducto.producto.precio_venta).toFixed(2)}
                </div>
              )}
              {selectorErrores.new && (
                <p className="mt-2 text-sm text-rose-600">{selectorErrores.new}</p>
              )}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Descuento general</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={data.descuento} onChange={(e) => setData('descuento', e.target.value)} />
            </div>
            {!esServicio && venta.es_permuta && (
              <div>
                <label className={labelClass}>Valor permuta</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={data.valor_permuta} onChange={(e) => setData('valor_permuta', e.target.value)} />
              </div>
            )}
            <div className="md:col-span-3">
              <label className={labelClass}>Notas adicionales</label>
              <textarea className={inputClass} rows="3" value={data.notas_adicionales} onChange={(e) => setData('notas_adicionales', e.target.value)} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-right md:grid-cols-3">
            <div>
              <div className="text-xs uppercase text-slate-500">Total a pagar</div>
              <div className="text-xl font-bold text-slate-800">
                {(esServicio ? subtotalServicio : totalProductosACobrar).toFixed(2)} Bs
              </div>
              {!esServicio && reservaAplicada > 0 && (
                <div className="text-xs font-semibold text-blue-600">
                  Reserva aplicada: -{reservaAplicada.toFixed(2)} Bs
                </div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Capital</div>
              <div className="text-xl font-bold text-blue-600">
                {(esServicio ? money(data.servicio_tecnico.precio_costo) : capitalProductos).toFixed(2)} Bs
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Ganancia recalculada</div>
              <div className={`text-xl font-bold ${(esServicio ? gananciaServicio : gananciaProductos) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {(esServicio ? gananciaServicio : gananciaProductos).toFixed(2)} Bs
              </div>
            </div>
          </div>
        </section>
      </form>
    </>
  );
}
