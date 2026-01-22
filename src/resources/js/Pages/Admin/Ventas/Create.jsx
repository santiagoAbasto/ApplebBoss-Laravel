import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import ModalPermutaComponent from '@/Components/ModalPermutaComponent';
import { useForm } from '@inertiajs/react';
import NeonInput from '@/Components/NeonInput';
import { NeonBox } from '@/Components/NeonBox';
import { NeonField } from '@/Components/NeonField';




export default function Create({ celulares, computadoras, productosGenerales }) {
  const { data, setData, post, processing, errors } = useForm({
    nombre_cliente: '',
    telefono_cliente: '',
    tipo_venta: 'producto',
    metodo_pago: 'efectivo',
    descuento: 0,
    notas_adicionales: '',
    inicio_tarjeta: '',
    fin_tarjeta: '',
  });

  const form = data;

  const [esPermuta, setEsPermuta] = useState(false);
  const [tipoPermuta, setTipoPermuta] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEntregado, setProductoEntregado] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState({
    tipo: '', codigo: '', cantidad: 1, descuento: 0, imei: '', producto: null
  });

  const [stocks, setStocks] = useState({ celulares: [], computadoras: [], productosGenerales: [], productosApple: [] });
  const [errores, setErrores] = useState({});
  const [items, setItems] = useState([]); // necesario para el manejo de los productos

  const fetchStock = async () => {
    const [c, comp, pg, apple] = await Promise.all([
      axios.get(route('api.stock.celulares')),
      axios.get(route('api.stock.computadoras')),
      axios.get(route('api.stock.productos_generales')),
      axios.get(route('api.stock.productos_apple')),
    ]);
    setStocks({
      celulares: c.data,
      computadoras: comp.data,
      productosGenerales: pg.data,
      productosApple: apple.data,
    });
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado({
      tipo: productoSeleccionado.tipo, // ✅ EL TIPO VIENE DEL SELECT
      codigo: producto.codigo || producto.imei_1 || producto.numero_serie,
      cantidad: 1,
      descuento: 0,
      imei: producto.imei_1 || '',
      producto,
    });

    setMostrarProductos(false);
  };

  useEffect(() => { fetchStock(); }, []);

  const buscarProductoPorCodigo = (tipo, codigo) => {
    if (!codigo) return null;

    if (tipo === 'celular') return stocks.celulares.find(p => p.imei_1 === codigo || p.imei_2 === codigo);
    if (tipo === 'computadora') return stocks.computadoras.find(p => p.numero_serie === codigo);
    if (tipo === 'producto_general') return stocks.productosGenerales.find(p => p.codigo === codigo);
    if (tipo === 'producto_apple') return stocks.productosApple.find(p => p.imei_1 === codigo || p.imei_2 === codigo || p.numero_serie === codigo);
    return null;
  };

  const agregarItem = () => {
    const { tipo, producto, cantidad, descuento, imei, codigo } = productoSeleccionado;
    if (!producto || !tipo || cantidad <= 0 || !codigo) return alert('Datos incompletos.');

    let disponibles = 1;
    if (tipo === 'producto_general') {
      disponibles = stocks.productosGenerales.filter(p => p.codigo === codigo).length;
      const yaAgregados = items.filter(i => i.tipo === 'producto_general' && i.detalles.codigo === codigo).reduce((acc, i) => acc + i.cantidad, 0);
      if (cantidad + yaAgregados > disponibles) return alert(`Solo hay ${disponibles} unidades disponibles de este producto.`);
    } else {
      if (cantidad > 1) return alert('Solo puedes vender una unidad a la vez.');
    }

    const yaExiste = items.some(i => i.tipo === tipo && i.producto_id === producto.id);
    if (yaExiste) return alert('Ya está en la lista.');

    const subtotal = (producto.precio_venta - descuento) * cantidad;
    const precio_invertido = producto.precio_costo * cantidad;

    setItems([...items, {
      tipo,
      producto_id: producto.id,
      cantidad,
      precio_venta: producto.precio_venta,
      precio_invertido,
      descuento,
      subtotal,
      nombre: producto.nombre || producto.modelo || '---',
      imei: tipo === 'celular' ? imei : null,
      detalles: producto,
    }]);

    setProductoSeleccionado({ tipo: '', codigo: '', cantidad: 1, descuento: 0, imei: '', producto: null });
    fetchStock();
  };

  const actualizarCampo = (index, campo, valor) => {
    const nuevosItems = [...items];
    const actual = nuevosItems[index];
    const disponible = actual.tipo === 'producto_general' ? actual.detalles.stock : 1;

    if (campo === 'cantidad' && Number(valor) > disponible) {
      alert('No puedes registrar más de lo que hay en stock.');
      return;
    }

    nuevosItems[index][campo] = Number(valor);
    nuevosItems[index].subtotal = (nuevosItems[index].precio_venta - nuevosItems[index].descuento) * nuevosItems[index].cantidad;
    setItems(nuevosItems);
  };

  const quitarItem = (index) => setItems(items.filter((_, i) => i !== index));

  const calcularTotal = () => {
    let total = 0;
    items.forEach((item) => {
      let subtotal = (item.precio_venta - item.descuento) * item.cantidad;
      if (esPermuta && productoEntregado) {
        subtotal -= productoEntregado.precio_costo;
      }
      total += subtotal;
    });
    return total - Number(form.descuento || 0);
  };

  const total = calcularTotal();

  // =======================
  // CLIENTES
  // =======================
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [mostrarClientes, setMostrarClientes] = useState(false);

  // =======================
  // PRODUCTOS
  // =======================
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);

  const buscarSugerencias = (texto) => {
    if (!productoSeleccionado.tipo || texto.length < 2) {
      setMostrarProductos(false);
      return;
    }

    const term = texto.toLowerCase();
    let fuente = [];

    // 🔹 Elegimos la fuente según tipo
    if (productoSeleccionado.tipo === 'celular') {
      fuente = stocks.celulares;
    }

    if (productoSeleccionado.tipo === 'computadora') {
      fuente = stocks.computadoras;
    }

    if (productoSeleccionado.tipo === 'producto_general') {
      fuente = stocks.productosGenerales;
    }

    if (productoSeleccionado.tipo === 'producto_apple') {
      fuente = stocks.productosApple;
    }

    // 🔹 Búsqueda FLEXIBLE por nombre, modelo, código, imei, serie
    const resultados = fuente.filter((p) => {
      return (
        p.nombre?.toLowerCase().includes(term) ||
        p.modelo?.toLowerCase().includes(term) ||
        p.codigo?.toLowerCase().includes(term) ||
        p.numero_serie?.toLowerCase().includes(term) ||
        p.imei_1?.includes(term) ||
        p.imei_2?.includes(term)
      );
    }).map(p => ({
      ...p,
      tipo: productoSeleccionado.tipo, // 🔥 CLAVE
    }));

    setSugerenciasProductos(resultados.slice(0, 10));
    setMostrarProductos(resultados.length > 0);
  };


  const registrarVenta = async () => {
    if (items.length === 0) return alert('Agrega al menos un producto.');
    if (esPermuta && !productoEntregado) return alert('Debes registrar el producto entregado.');

    const payload = {
      ...form,
      items,
      es_permuta: esPermuta,
      tipo_permuta: esPermuta ? tipoPermuta : null,
      producto_entregado: productoEntregado,
    };

    try {
      const response = await axios.post(route('admin.ventas.store'), payload);
      const ventaId = response.data.venta_id;
      if (ventaId) window.open(`/admin/ventas/${ventaId}/boleta`, '_blank');
      router.visit(route('admin.ventas.index'));
    } catch (error) {
      if (error.response?.status === 422) setErrores(error.response.data.errors);
      else console.error('Error al registrar venta:', error);
    }
  };

  return (
    <AdminLayout>
      <Head title="Registrar Venta" />

      {/* ===============================
    INFORMACIÓN DEL CLIENTE
=============================== */}
      <NeonBox className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Información del cliente
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ================= NOMBRE ================= */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente
            </label>

            <NeonInput
              value={data.nombre_cliente}
              placeholder="Nombre del Cliente"
              onChange={async (e) => {
                const nombre = e.target.value;
                setData('nombre_cliente', nombre);

                if (nombre.length >= 2) {
                  const res = await axios.get(
                    route('admin.clientes.sugerencias', { term: nombre })
                  );
                  setSugerenciasClientes(res.data);
                  setMostrarClientes(true);
                } else {
                  setMostrarClientes(false);
                }
              }}
              onBlur={() => setTimeout(() => setMostrarClientes(false), 150)}
            />

            {mostrarClientes && (
              <ul className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow text-sm border border-emerald-100">
                {sugerenciasClientes.map((c) => (
                  <li
                    key={c.id}
                    className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                    onClick={() => {
                      setData('nombre_cliente', c.nombre);
                      setData('telefono_cliente', c.telefono);
                      setMostrarClientes(false);
                    }}
                  >
                    <strong>{c.nombre}</strong>
                    <div className="text-xs text-gray-500">{c.telefono}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ================= TELÉFONO ================= */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>

            <NeonInput
              value={data.telefono_cliente}
              placeholder="Teléfono"
              onChange={(e) => setData('telefono_cliente', e.target.value)}
            />
          </div>

          {/* ================= MÉTODO DE PAGO ================= */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de pago
            </label>

            <NeonField>
              <select
                value={data.metodo_pago}
                onChange={(e) => setData('metodo_pago', e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </NeonField>
          </div>

          {/* ================= TARJETA (CONDICIONAL) ================= */}
          {data.metodo_pago === 'tarjeta' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inicio de tarjeta
                </label>

                <NeonInput
                  maxLength={4}
                  placeholder="Ej: 1234"
                  value={data.inicio_tarjeta}
                  onChange={(e) =>
                    setData('inicio_tarjeta', e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fin de tarjeta
                </label>

                <NeonInput
                  maxLength={4}
                  placeholder="Ej: 5678"
                  value={data.fin_tarjeta}
                  onChange={(e) =>
                    setData('fin_tarjeta', e.target.value)
                  }
                />
              </div>
            </>
          )}
        </div>
      </NeonBox>

      {/* ===============================
  BUSCAR PRODUCTO
=============================== */}
      <NeonBox
        className={`mb-6 relative overflow-visible ${mostrarProductos ? 'z-[9999]' : 'z-0'
          }`}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🛒 Buscar producto
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TIPO */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Tipo de producto
            </label>

            <NeonField>
              <select
                value={productoSeleccionado.tipo}
                onChange={(e) =>
                  setProductoSeleccionado({
                    ...productoSeleccionado,
                    tipo: e.target.value,
                    codigo: '',
                    producto: null,
                  })
                }
              >
                <option value="">Seleccionar tipo</option>
                <option value="celular">Celular</option>
                <option value="computadora">Computadora</option>
                <option value="producto_general">Producto General</option>
                <option value="producto_apple">Producto Apple</option>
              </select>
            </NeonField>
          </div>

          {/* BUSCADOR */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Código / IMEI / Nombre
            </label>

            <NeonInput
              placeholder="Buscar por código, IMEI o nombre"
              value={productoSeleccionado.codigo}
              onChange={(e) => {
                const v = e.target.value;
                setProductoSeleccionado((p) => ({ ...p, codigo: v }));
                buscarSugerencias(v);
              }}
            />

            {mostrarProductos && (
              <ul
                className="
            absolute left-0 right-0 top-full mt-2
            bg-white rounded-xl shadow-xl
            border border-emerald-100
            z-[99999]
            max-h-64 overflow-auto
          "
              >
                {sugerenciasProductos.map((p, i) => (
                  <li
                    key={i}
                    className="px-4 py-2 hover:bg-emerald-50 cursor-pointer transition"
                    onClick={() => seleccionarProducto(p)}
                  >
                    <div className="font-semibold">{p.nombre || p.modelo}</div>
                    <div className="text-xs text-gray-500">
                      {p.tipo?.toUpperCase()} — {p.codigo || p.imei_1 || p.numero_serie}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* PRODUCTO ENCONTRADO */}
        {productoSeleccionado.producto && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="font-semibold mb-2">Producto encontrado</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-medium">Producto:</span>{' '}
                {productoSeleccionado.producto.modelo || productoSeleccionado.producto.nombre}
              </div>
              <div>
                <span className="font-medium">Precio:</span> Bs {productoSeleccionado.producto.precio_venta}
              </div>
              <div>
                <span className="font-medium">Stock:</span> {productoSeleccionado.producto.stock ?? 1}
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURACIÓN */}
        {productoSeleccionado.producto && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Cantidad
              </label>
              <NeonInput
                type="number"
                min={1}
                value={productoSeleccionado.cantidad}
                onChange={(e) =>
                  setProductoSeleccionado({
                    ...productoSeleccionado,
                    cantidad: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Descuento (Bs)
              </label>
              <NeonInput
                type="number"
                min={0}
                value={productoSeleccionado.descuento}
                onChange={(e) =>
                  setProductoSeleccionado({
                    ...productoSeleccionado,
                    descuento: Number(e.target.value),
                  })
                }
              />
            </div>

            {productoSeleccionado.tipo === 'celular' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  IMEI único
                </label>
                <NeonInput
                  placeholder="IMEI"
                  value={productoSeleccionado.imei}
                  onChange={(e) =>
                    setProductoSeleccionado({
                      ...productoSeleccionado,
                      imei: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <button
              type="button"
              onClick={agregarItem}
              className="h-[46px] rounded-xl bg-emerald-600 text-white font-semibold px-6 hover:bg-emerald-700 active:scale-95 transition"
            >
              ➕ Agregar
            </button>
          </div>
        )}
      </NeonBox>

      {/* ===============================
      PRODUCTOS AÑADIDOS
  =============================== */}
      <NeonBox className="mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Productos añadidos</h2>

        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-800">
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Descuento</th>
              <th>Subtotal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-400">
                  No hay productos añadidos
                </td>
              </tr>
            )}

            {items.map((item, i) => (
              <tr key={i} className="border-t hover:bg-emerald-50">
                <td>{i + 1}</td>
                <td>{item.nombre}</td>
                <td>{item.cantidad}</td>
                <td>Bs {item.precio_venta}</td>
                <td>Bs {item.descuento}</td>
                <td className="font-semibold text-emerald-700">
                  Bs {item.subtotal.toFixed(2)}
                </td>
                <td>
                  <button
                    className="text-red-600 hover:scale-110 transition"
                    onClick={() => quitarItem(i)}
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeonBox>

      {/* ===============================
      PERMUTA
  =============================== */}
      <NeonBox className="mb-6 space-y-4">
        <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={esPermuta}
            onChange={(e) => setEsPermuta(e.target.checked)}
            className="w-4 h-4 accent-emerald-500"
          />
          ¿Venta con permuta?
        </label>

        {esPermuta && (
          <>
            <NeonField>
              <select
                value={tipoPermuta}
                onChange={(e) => setTipoPermuta(e.target.value)}
              >
                <option value="">Tipo de permuta</option>
                <option value="celular">Celular</option>
                <option value="computadora">Computadora</option>
                <option value="producto_general">Producto General</option>
                <option value="producto_apple">Producto Apple</option>
              </select>
            </NeonField>

            {tipoPermuta && (
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={() => setModalAbierto(true)}
              >
                ➕ Registrar producto entregado
              </button>
            )}
          </>
        )}
      </NeonBox>

      <ModalPermutaComponent
        show={modalAbierto}
        tipo={tipoPermuta}
        onClose={() => setModalAbierto(false)}
        onGuardar={(producto) => {
          setProductoEntregado(producto);
          setModalAbierto(false);
        }}
      />

      {/* ===============================
      TOTAL + REGISTRAR
  =============================== */}
      <NeonBox className="space-y-4">
        <div className="text-right text-lg font-bold text-emerald-700">
          Total a pagar: Bs {calcularTotal().toFixed(2)}
        </div>

        <NeonField>
          <textarea
            placeholder="Notas adicionales"
            value={data.notas_adicionales}
            onChange={(e) =>
              setData('notas_adicionales', e.target.value)
            }
          />
        </NeonField>

        <div className="text-center">
          <button
            className="btn btn-success px-8 py-2 text-lg"
            onClick={registrarVenta}
          >
            💾 Registrar Venta
          </button>
        </div>
      </NeonBox>
    </AdminLayout>

  );
}