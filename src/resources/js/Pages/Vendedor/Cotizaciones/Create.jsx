import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import VendedorLayout from '@/Layouts/VendedorLayout';
import { Trash2, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Toast from '@/Components/Toast';
import FancyButton from '@/Components/FancyButton';
import axios from 'axios';

export default function Create({
  celulares,
  computadoras,
  productosGenerales,
  productosApple,
  fechaHoy,
}) {
  /* ===============================
     FORM
  =============================== */
  const { data, setData, post, reset } = useForm({
    nombre_cliente: '',
    telefono_completo: '',
    correo_cliente: '',
    fecha_cotizacion: fechaHoy,
    items: [],
    total: 0,
    notas_adicionales: '',
  });

  const [nuevoItem, setNuevoItem] = useState({
    nombre: '',
    cantidad: 1,
    precio: 0,
    descuento: 0, // 👈 NUEVO
  });


  const [tipoItem, setTipoItem] = useState('producto');

  /* ===============================
     TELÉFONO (SOLUCIÓN DEFINITIVA)
  =============================== */
  // SOLO E.164 o undefined
  const [numeroCompleto, setNumeroCompleto] = useState(undefined);

  // Teléfono local guardado (ej: 75904313)
  const [telefonoLocal, setTelefonoLocal] = useState('');

  const [telefonoInvalido, setTelefonoInvalido] = useState(false);

  useEffect(() => {
    setData('telefono_completo', numeroCompleto || '');

    if (!numeroCompleto) {
      setTelefonoInvalido(false);
      return;
    }

    const soloNumeros = numeroCompleto.replace(/\D/g, '');
    setTelefonoInvalido(soloNumeros.length < 10);
  }, [numeroCompleto]);

  /* ===============================
     AUTOCOMPLETE CLIENTES
  =============================== */
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);

  const buscarClientes = async (valor) => {
    if (!valor || valor.length < 2) {
      setSugerencias([]);
      setMostrandoSugerencias(false);
      return;
    }

    try {
      const res = await axios.get(
        route('vendedor.clientes.sugerencias'),
        { params: { term: valor } }
      );

      setSugerencias(res.data);
      setMostrandoSugerencias(true);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  };

  const seleccionarCliente = (cliente) => {
    setData('nombre_cliente', cliente.nombre);
    setData('correo_cliente', cliente.correo || '');

    const tel = (cliente.telefono || '').toString().trim();

    // Si ya es E.164 válido
    if (tel.startsWith('+') && /^\+\d{8,15}$/.test(tel)) {
      setNumeroCompleto(tel);
      setTelefonoLocal('');
    } else {
      // Teléfono local → NO pasarlo al PhoneInput
      setNumeroCompleto(undefined);
      setTelefonoLocal(tel);
    }

    setSugerencias([]);
    setMostrandoSugerencias(false);
  };

  /* ===============================
     CÁLCULOS
  =============================== */
  const calcularTotales = (items) => {
    return items.reduce(
      (acc, item) => {
        acc.subtotalSinFactura += item.cantidad * item.precio_sin_factura;
        acc.descuentos += item.descuento;
        acc.iva += item.iva;
        acc.it += item.it;
        acc.total += item.total;
        return acc;
      },
      {
        subtotalSinFactura: 0,
        descuentos: 0,
        iva: 0,
        it: 0,
        total: 0,
      }
    );
  };

  const resumen = calcularTotales(data.items);

  /* ===============================
     ITEMS
  =============================== */
  const agregarItem = () => {
    if (
      !nuevoItem.nombre ||
      nuevoItem.cantidad <= 0 ||
      nuevoItem.precio <= 0
    ) return;

    const base = nuevoItem.precio * nuevoItem.cantidad;
    const descuento = Math.min(nuevoItem.descuento || 0, base);

    const baseConDescuento = base - descuento;

    const iva = parseFloat((baseConDescuento * 0.13).toFixed(2));
    const it = parseFloat((baseConDescuento * 0.03).toFixed(2));

    const total = parseFloat(
      (baseConDescuento + iva + it).toFixed(2)
    );

    const item = {
      nombre: nuevoItem.nombre,
      cantidad: nuevoItem.cantidad,
      precio_sin_factura: nuevoItem.precio,
      descuento,
      iva,
      it,
      precio_con_factura: baseConDescuento + iva + it,
      total,
    };

    const nuevosItems = [...data.items, item];
    setData('items', nuevosItems);
    setData('total', calcularTotales(nuevosItems).total);

    setNuevoItem({
      nombre: '',
      cantidad: 1,
      precio: 0,
      descuento: 0,
    });
  };

  const eliminarItem = (index) => {
    const nuevosItems = data.items.filter((_, i) => i !== index);
    setData('items', nuevosItems);
    setData('total', calcularTotales(nuevosItems).total);
  };


  const handleProductoSeleccionado = (tipo, id) => {
    if (!id) return;
    let p = null;

    if (tipo === 'celular') p = celulares.find(c => c.id == id);
    if (tipo === 'computadora') p = computadoras.find(c => c.id == id);
    if (tipo === 'producto_general') p = productosGenerales.find(p => p.id == id);
    if (tipo === 'producto_apple') p = productosApple.find(p => p.id == id);

    if (p) {
      setNuevoItem({
        nombre: p.modelo || p.nombre,
        cantidad: 1,
        precio: parseFloat(p.precio_venta || 0),
        descuento: 0,
      });
    }
  };


  /* ===============================
     SUBMIT
  =============================== */
  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('vendedor.cotizaciones.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setNumeroCompleto(undefined);
        setTelefonoLocal('');
        setSugerencias([]);
        setMostrandoSugerencias(false);
      },
    });
  };

  return (
    <VendedorLayout>
      <Head title="Nueva Cotización" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          Nueva Cotización
        </h1>
        <Link
          href={route('vendedor.cotizaciones.index')}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Volver al listado
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow">
        {/* ===============================
           DATOS DEL CLIENTE
        =============================== */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Información del cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* NOMBRE */}
            <div className="relative">
              <label className="label">Nombre del Cliente</label>
              <input
                type="text"
                className="input"
                value={data.nombre_cliente}
                onChange={(e) => {
                  setData('nombre_cliente', e.target.value);
                  buscarClientes(e.target.value);
                }}
                onFocus={() => setMostrandoSugerencias(true)}
                autoComplete="off"
              />

              {mostrandoSugerencias && sugerencias.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border rounded-md shadow-md mt-1 max-h-48 overflow-auto">
                  {sugerencias.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => seleccionarCliente(c)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    >
                      <strong>{c.nombre}</strong>
                      <div className="text-xs text-gray-500">{c.telefono}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* TELÉFONO */}
            <div>
              <label className="label">Teléfono</label>
              <PhoneInput
                international
                defaultCountry="BO"
                value={numeroCompleto}
                onChange={setNumeroCompleto}
                className="input"
                placeholder="+591 7XXXXXXX"
              />

              {telefonoLocal && (
                <p className="text-xs text-gray-500 mt-1">
                  Número guardado: {telefonoLocal} (elige el país)
                </p>
              )}

              {telefonoInvalido && (
                <p className="text-xs text-red-500 mt-1">
                  Número inválido o incompleto
                </p>
              )}
            </div>

            {/* CORREO */}
            <div>
              <label className="label">Correo</label>
              <input
                type="email"
                className="input"
                value={data.correo_cliente}
                onChange={(e) => setData('correo_cliente', e.target.value)}
              />
            </div>

            {/* FECHA */}
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={data.fecha_cotizacion}
                onChange={(e) => setData('fecha_cotizacion', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ===============================
           TIPO DE ÍTEM
        =============================== */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Tipo de cotización
          </h2>

          <select
            className="input max-w-md"
            value={tipoItem}
            onChange={(e) => setTipoItem(e.target.value)}
          >
            <option value="producto">Producto del Inventario</option>
            <option value="servicio">Producto Externo (manual)</option>
          </select>

          {tipoItem === 'producto' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select className="input" onChange={(e) => handleProductoSeleccionado('celular', e.target.value)}>
                <option value="">-- Celulares --</option>
                {celulares.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.modelo} (IMEI {c.imei_1})
                  </option>
                ))}
              </select>

              <select className="input" onChange={(e) => handleProductoSeleccionado('computadora', e.target.value)}>
                <option value="">-- Computadoras --</option>
                {computadoras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.numero_serie})
                  </option>
                ))}
              </select>

              <select className="input" onChange={(e) => handleProductoSeleccionado('producto_general', e.target.value)}>
                <option value="">-- Productos Generales --</option>
                {productosGenerales.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <select className="input" onChange={(e) => handleProductoSeleccionado('producto_apple', e.target.value)}>
                <option value="">-- Productos Apple --</option>
                {productosApple.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.modelo} {p.capacidad}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ===============================
   NUEVO ÍTEM
=============================== */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Agregar ítem
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* DESCRIPCIÓN */}
            <input
              className="input"
              placeholder="Descripción del producto o servicio"
              value={nuevoItem.nombre}
              onChange={(e) =>
                setNuevoItem({ ...nuevoItem, nombre: e.target.value })
              }
            />

            {/* CANTIDAD */}
            <input
              type="number"
              min="1"
              className="input"
              placeholder="Cantidad"
              value={nuevoItem.cantidad}
              onChange={(e) =>
                setNuevoItem({
                  ...nuevoItem,
                  cantidad: Number(e.target.value) || 1,
                })
              }
            />

            {/* PRECIO BASE */}
            <input
              type="number"
              min="0"
              className="input"
              placeholder="Precio sin factura"
              value={nuevoItem.precio}
              onChange={(e) =>
                setNuevoItem({
                  ...nuevoItem,
                  precio: Number(e.target.value) || 0,
                })
              }
            />

            {/* DESCUENTO POR ÍTEM */}
            <input
              type="number"
              min="0"
              className="input"
              placeholder="Descuento"
              value={nuevoItem.descuento}
              onChange={(e) =>
                setNuevoItem({
                  ...nuevoItem,
                  descuento: Number(e.target.value) || 0,
                })
              }
            />

            {/* BOTÓN */}
            <FancyButton type="button" onClick={agregarItem}>
              Agregar
            </FancyButton>
          </div>
        </div>

        {/* ===============================
   TABLA + TOTALES (CORREGIDO)
=============================== */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-center">Cant.</th>
                  <th className="px-3 py-2 text-right">Precio Base</th>
                  <th className="px-3 py-2 text-right">Descuento</th>
                  <th className="px-3 py-2 text-right">IVA 13%</th>
                  <th className="px-3 py-2 text-right">IT 3%</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-6 text-gray-400"
                    >
                      No hay ítems agregados
                    </td>
                  </tr>
                )}

                {data.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{item.nombre}</td>
                    <td className="px-3 py-2 text-center">
                      {item.cantidad}
                    </td>

                    <td className="px-3 py-2 text-right">
                      Bs {(item.precio_sin_factura * item.cantidad).toFixed(2)}
                    </td>

                    <td className="px-3 py-2 text-right text-red-600">
                      - Bs {item.descuento.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      Bs {item.iva.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      Bs {item.it.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 text-right font-semibold">
                      Bs {item.total.toFixed(2)}
                    </td>

                    <td className="px-2 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarItem(i)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===============================
     RESUMEN GENERAL
  =============================== */}
          <div className="flex flex-col md:flex-row justify-end gap-6 mt-4">
            <div className="text-right space-y-1 text-sm">
              <p>
                Subtotal sin factura:{' '}
                <strong>
                  Bs {resumen.subtotalSinFactura.toFixed(2)}
                </strong>
              </p>

              <p>
                Descuentos aplicados:{' '}
                <strong className="text-red-600">
                  - Bs {resumen.descuentos.toFixed(2)}
                </strong>
              </p>

              <p>
                IVA 13%:{' '}
                <strong>
                  Bs {resumen.iva.toFixed(2)}
                </strong>
              </p>

              <p>
                IT 3%:{' '}
                <strong>
                  Bs {resumen.it.toFixed(2)}
                </strong>
              </p>

              <p className="text-lg font-bold mt-2">
                TOTAL A PAGAR: Bs {resumen.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* ===============================
           NOTAS + ACCIONES
        =============================== */}
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <label className="label">Notas adicionales</label>
            <textarea
              className="input"
              rows={3}
              value={data.notas_adicionales}
              onChange={(e) => setData('notas_adicionales', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <FancyButton type="submit" variant="success" size="sm">
              Guardar Cotización
            </FancyButton>
            <Link href={route('vendedor.cotizaciones.index')}>
              <FancyButton type="button" variant="dark" size="sm">
                Cancelar
              </FancyButton>
            </Link>
          </div>
        </div>
      </form>

      <Toast
        show={false}
        type="success"
        message="Cotización creada"
      />
    </VendedorLayout>
  );
}
