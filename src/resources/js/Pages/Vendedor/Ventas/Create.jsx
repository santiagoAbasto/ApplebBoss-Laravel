import VendedorLayout from '@/Layouts/VendedorLayout'; // ✅ Esta es la correcta
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import ModalPermutaComponent from '@/Components/ModalPermutaComponent';

export default function Create({ celulares, computadoras, productosGenerales, productosApple }) {
    const [items, setItems] = useState([]);
    const [sugerencias, setSugerencias] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

    const [form, setForm] = useState({
        nombre_cliente: '',
        telefono_cliente: '',
        tipo_venta: 'producto',
        metodo_pago: 'efectivo',
        descuento: 0,
        notas_adicionales: '',
        inicio_tarjeta: '',
        fin_tarjeta: ''
    });

    const [esPermuta, setEsPermuta] = useState(false);
    const [tipoPermuta, setTipoPermuta] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEntregado, setProductoEntregado] = useState(null);
    const [productoSeleccionado, setProductoSeleccionado] = useState({
        tipo: '', codigo: '', cantidad: 1, descuento: 0, imei: '', producto: null
    });

    const [stocks, setStocks] = useState({ celulares: [], computadoras: [], productosGenerales: [], productosApple: [] });
    const [errores, setErrores] = useState({});

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
            if (esPermuta && productoEntregado && (item.tipo === 'celular' || item.tipo === 'computadora')) {
                subtotal -= productoEntregado.precio_costo;
            }
            total += subtotal;
        });
        return total - Number(form.descuento || 0);
    };

    const total = calcularTotal();

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
            const response = await axios.post(route('vendedor.ventas.store'), payload);
            const ventaId = response.data.venta_id;
            if (ventaId) window.open(route('vendedor.ventas.boleta', ventaId), '_blank');
            router.visit(route('vendedor.ventas.index'));
        } catch (error) {
            if (error.response?.status === 422) setErrores(error.response.data.errors);
            else console.error('Error al registrar venta:', error);
        }
    };

    return (
        <VendedorLayout>
            <Head title="Registrar Venta" />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* Sección: Información del cliente */}
                <div className="bg-white p-5 rounded shadow relative">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">🧍‍♂️ Información del cliente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Campo con autocompletado por nombre */}
                        <div className="relative">
                            <input
                                className="input w-full"
                                placeholder="Nombre del Cliente"
                                value={form.nombre_cliente}
                                onChange={async (e) => {
                                    const nombre = e.target.value;
                                    setForm({ ...form, nombre_cliente: nombre });

                                    if (nombre.length >= 2) {
                                        try {
                                            const res = await axios.get(route('vendedor.clientes.sugerencias', { term: nombre }));
                                            setSugerencias(res.data);
                                            setMostrarSugerencias(true);
                                        } catch (err) {
                                            console.error('Error al obtener sugerencias:', err);
                                        }
                                    } else {
                                        setMostrarSugerencias(false);
                                    }
                                }}
                                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                                onFocus={() => {
                                    if (sugerencias.length > 0) setMostrarSugerencias(true);
                                }}
                            />
                            {mostrarSugerencias && sugerencias.length > 0 && (
                                <ul className="absolute bg-white border rounded w-full z-10 max-h-40 overflow-y-auto shadow text-sm mt-1">
                                    {sugerencias.map((cliente) => (
                                        <li
                                            key={cliente.id}
                                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                                            onClick={() => {
                                                setForm({
                                                    ...form,
                                                    nombre_cliente: cliente.nombre,
                                                    telefono_cliente: cliente.telefono
                                                });
                                                setMostrarSugerencias(false);
                                            }}
                                        >
                                            {cliente.nombre} — {cliente.telefono}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Teléfono del cliente */}
                        <input
                            className="input"
                            placeholder="Teléfono"
                            value={form.telefono_cliente}
                            onChange={e => setForm({ ...form, telefono_cliente: e.target.value })}
                        />

                        {/* Método de pago */}
                        <select
                            className="input"
                            value={form.metodo_pago}
                            onChange={e => setForm({ ...form, metodo_pago: e.target.value })}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="qr">QR</option>
                            <option value="tarjeta">Tarjeta</option>
                        </select>

                        {/* Campos de tarjeta si corresponde */}
                        {form.metodo_pago === 'tarjeta' && (
                            <>
                                <input
                                    className="input"
                                    placeholder="Inicio tarjeta (4 dígitos)"
                                    maxLength={4}
                                    value={form.inicio_tarjeta}
                                    onChange={e => setForm({ ...form, inicio_tarjeta: e.target.value })}
                                />
                                <input
                                    className="input"
                                    placeholder="Fin tarjeta (4 dígitos)"
                                    maxLength={4}
                                    value={form.fin_tarjeta}
                                    onChange={e => setForm({ ...form, fin_tarjeta: e.target.value })}
                                />
                            </>
                        )}

                        {/* Descuento total */}
                        <input
                            type="number"
                            className="input"
                            placeholder="Descuento total Bs"
                            value={form.descuento}
                            onChange={e => setForm({ ...form, descuento: e.target.value })}
                        />
                    </div>
                </div>
                {/* Sección: Buscar y agregar productos */}
                <div className="bg-white p-5 rounded shadow">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">🛒 Buscar producto por código</h2>
                    <div className="flex flex-wrap gap-3 items-end">
                        <select className="input" value={productoSeleccionado.tipo} onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, tipo: e.target.value, codigo: '', producto: null })}>
                            <option value="">Tipo de producto</option>
                            <option value="celular">Celular</option>
                            <option value="computadora">Computadora</option>
                            <option value="producto_general">Producto General</option>
                            <option value="producto_apple">Producto Apple</option>
                        </select>

                        <input
                            className="input w-72"
                            placeholder="Código / IMEI / Serie"
                            value={productoSeleccionado.codigo}
                            onChange={(e) => {
                                const val = e.target.value;
                                setProductoSeleccionado((prev) => {
                                    const producto = buscarProductoPorCodigo(prev.tipo, val);
                                    return { ...prev, codigo: val, producto };
                                });
                            }}
                        />


                        {productoSeleccionado.producto && (
                            <>
                                <input type="number" className="input w-20" placeholder="Cantidad" min={1} value={productoSeleccionado.cantidad} onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, cantidad: Number(e.target.value) })} />
                                <input type="number" className="input w-24" placeholder="Descuento" min={0} value={productoSeleccionado.descuento} onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, descuento: Number(e.target.value) })} />
                                {productoSeleccionado.tipo === 'celular' && (
                                    <input type="text" className="input w-56" placeholder="IMEI único" value={productoSeleccionado.imei} onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, imei: e.target.value })} />
                                )}
                                <button onClick={agregarItem} className="btn btn-primary">➕ Agregar</button>
                            </>
                        )}
                    </div>

                    {productoSeleccionado.producto && (
                        <div className="mt-4 p-3 rounded border border-blue-300 bg-blue-50 text-blue-800 text-sm shadow-inner">
                            <strong>Producto encontrado:</strong> {productoSeleccionado.producto.modelo || productoSeleccionado.producto.nombre} — <strong>Precio:</strong> Bs {productoSeleccionado.producto.precio_venta} — <strong>Stock:</strong> {productoSeleccionado.producto.stock ?? 1}
                        </div>
                    )}
                </div>

                {/* Sección: Permuta */}
                <div className="bg-white p-5 rounded shadow">
                    <label className="inline-flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={esPermuta} onChange={e => setEsPermuta(e.target.checked)} />
                        ¿Venta con permuta?
                    </label>
                    {esPermuta && (
                        <div className="space-y-2">
                            <select className="input" value={tipoPermuta} onChange={e => setTipoPermuta(e.target.value)}>
                                <option value="">Selecciona tipo de producto entregado</option>
                                <option value="celular">Celular entregado</option>
                                <option value="computadora">Computadora entregada</option>
                                <option value="producto_general">Producto General entregado</option>
                            </select>
                            {tipoPermuta && (
                                <button className="btn btn-secondary" onClick={() => setModalAbierto(true)}>➕ Registrar producto entregado</button>
                            )}
                        </div>
                    )}
                </div>

                <ModalPermutaComponent
                    show={modalAbierto}
                    tipo={tipoPermuta}
                    onClose={() => setModalAbierto(false)}
                    onGuardar={(producto) => {
                        setProductoEntregado(producto);
                        setModalAbierto(false);
                    }}
                />

                {/* Tabla de productos añadidos */}
                <div className="bg-white p-5 rounded shadow overflow-x-auto">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">🧾 Productos añadidos</h2>
                    <table className="table-auto w-full text-sm border">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="px-2 py-1">#</th>
                                <th className="px-2 py-1">Tipo</th>
                                <th className="px-2 py-1">Producto</th>
                                <th className="px-2 py-1">Cantidad</th>
                                <th className="px-2 py-1">Precio</th>
                                <th className="px-2 py-1">Descuento</th>
                                <th className="px-2 py-1">Subtotal</th>
                                <th className="px-2 py-1"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-2 py-1">{i + 1}</td>
                                    <td className="px-2 py-1 capitalize">{item.tipo}</td>
                                    <td className="px-2 py-1">{item.nombre}</td>
                                    <td className="px-2 py-1"><input type="number" className="input w-20" value={item.cantidad} onChange={e => actualizarCampo(i, 'cantidad', e.target.value)} /></td>
                                    <td className="px-2 py-1"><input type="number" className="input w-24" value={item.precio_venta} onChange={e => actualizarCampo(i, 'precio_venta', e.target.value)} /></td>
                                    <td className="px-2 py-1"><input type="number" className="input w-24" value={item.descuento} onChange={e => actualizarCampo(i, 'descuento', e.target.value)} /></td>
                                    <td className="px-2 py-1 font-semibold">Bs {item.subtotal.toFixed(2)}</td>
                                    <td className="px-2 py-1"><button className="text-red-600" onClick={() => quitarItem(i)}>✖</button></td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center text-gray-500 py-4">No hay productos añadidos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Total y notas */}
                <div className="bg-white p-5 rounded shadow space-y-4">
                    <div className="text-right text-lg font-bold text-green-700">Total a pagar: Bs {calcularTotal().toFixed(2)}</div>
                    <textarea className="input w-full" rows="3" placeholder="Notas adicionales..." value={form.notas_adicionales} onChange={e => setForm({ ...form, notas_adicionales: e.target.value })} />
                    <div className="text-center">
                        <button className="btn btn-success px-8 py-2 text-lg" onClick={registrarVenta}>💾 Registrar Venta</button>
                    </div>
                </div>
            </div>
        </VendedorLayout>
    );
}