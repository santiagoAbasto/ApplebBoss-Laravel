import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import axios from 'axios';
import { Receipt, Search, PlusCircle } from 'lucide-react';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudCard,
  CrudSectionTitle,
  CrudGrid,
  CrudLabel,
  CrudInput,
  CrudActions,
  CrudButtonPrimary,
  CrudButtonSecondary,
} from '@/Components/CrudUI';

export default function Index({ ventas }) {
  const [codigoNota, setCodigoNota] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);

  const buscarNota = async (e) => {
    e.preventDefault();
    if (!codigoNota.trim()) return;

    try {
      const response = await axios.get(route('admin.ventas.buscarNota'), {
        params: { codigo_nota: codigoNota.trim() },
      });
      setResultadosBusqueda(response.data);
    } catch (error) {
      console.error('❌ Error al buscar nota:', error);
    }
  };

  /* ===============================
     DESGLOSE DE ITEMS (INTACTO)
  =============================== */
  const itemsDesglosados = ventas.flatMap((venta) => {
    if (venta.tipo_venta === 'servicio_tecnico') {
      const precioVenta = parseFloat(venta.precio_venta || 0);
      const descuento = parseFloat(venta.descuento || 0);
      const capital = parseFloat(venta.precio_invertido || 0);
      const ganancia = precioVenta - descuento - capital;

      return [{
        cliente: venta.nombre_cliente,
        producto: 'Servicio Técnico',
        codigoNota: venta.servicio_tecnico?.codigo_nota ?? venta.codigo_nota,
        id_venta: venta.id,
        tipo: 'servicio_tecnico',
        precioVenta,
        descuento,
        permuta: 0,
        capital,
        precioFinal: precioVenta - descuento,
        ganancia,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
      }];
    }

    return venta.items.map((item) => {
      const precioVenta = parseFloat(item.precio_venta || 0);
      const descuento = parseFloat(item.descuento || 0);
      const capital = parseFloat(item.precio_invertido || 0);
      const permuta = parseFloat(venta.valor_permuta || 0);
      const ganancia = precioVenta - descuento - permuta - capital;

      const nombre =
        item.tipo === 'celular'
          ? item.celular?.modelo
          : item.tipo === 'computadora'
          ? item.computadora?.nombre
          : item.tipo === 'producto_apple'
          ? item.producto_apple?.modelo
          : item.producto_general?.nombre;

      return {
        cliente: venta.nombre_cliente,
        producto: nombre,
        codigoNota: venta.codigo_nota,
        id_venta: venta.id,
        tipo: item.tipo,
        precioVenta,
        descuento,
        permuta,
        capital,
        precioFinal: precioVenta - descuento - permuta,
        ganancia,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
      };
    });
  });

  const gananciaTotal = itemsDesglosados.reduce(
    (acc, i) => (i.ganancia > 0 ? acc + i.ganancia : acc),
    0
  );

  return (
    <AdminLayout>
      <Head title="Ventas Desglosadas" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Receipt size={22} />
              Ventas Desglosadas
            </CrudTitle>
            <CrudSubtitle>
              Detalle completo de ventas, servicios y ganancias
            </CrudSubtitle>
          </div>

          <CrudButtonPrimary
            as={Link}
            href={route('admin.ventas.create')}
          >
            <PlusCircle size={18} />
            Nueva Venta
          </CrudButtonPrimary>
        </CrudHeader>

        {/* ================= BUSCADOR ================= */}
        <CrudCard style={{ marginBottom: 22 }}>
          <form onSubmit={buscarNota}>
            <CrudSectionTitle>
              <Search size={14} style={{ marginRight: 6 }} />
              Buscar nota
            </CrudSectionTitle>

            <CrudGrid>
              <div>
                <CrudLabel>Código o cliente</CrudLabel>
                <CrudInput
                  placeholder="Ej: V-2024-001"
                  value={codigoNota}
                  onChange={(e) => setCodigoNota(e.target.value)}
                />
              </div>
            </CrudGrid>

            <CrudActions>
              <CrudButtonPrimary type="submit">
                Buscar
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>

        {/* ================= RESULTADOS ================= */}
        {resultadosBusqueda.length > 0 && (
          <CrudCard style={{ marginBottom: 22 }}>
            <CrudSectionTitle>
              Resultados encontrados
            </CrudSectionTitle>

            {resultadosBusqueda.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {r.codigo_nota}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {r.nombre_cliente}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14 }}>
                  <a
                    href={
                      r.tipo === 'servicio_tecnico'
                        ? route('admin.servicios.boleta', r.id_real)
                        : route('admin.ventas.boleta', r.id_real)
                    }
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🧾 Normal
                  </a>

                  <a
                    href={
                      r.tipo === 'servicio_tecnico'
                        ? route('admin.servicios.recibo80mm', r.id_real)
                        : route('admin.ventas.boleta80', r.id_real)
                    }
                    target="_blank"
                    className="text-sm text-green-600 hover:underline"
                  >
                    🖨 Térmica
                  </a>
                </div>
              </div>
            ))}
          </CrudCard>
        )}

        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Detalle de movimientos</CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#2563eb', color: '#fff' }}>
                  {[
                    'Cliente',
                    'Código',
                    'Producto',
                    'Venta',
                    'Desc.',
                    'Permuta',
                    'Capital',
                    'Final',
                    'Ganancia',
                    'Vendedor',
                    'Fecha',
                    'Boleta',
                  ].map((h) => (
                    <th key={h} style={thWhite}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {itemsDesglosados.map((i, idx) => (
                  <tr
                    key={idx}
                    style={{ borderTop: '1px solid #e5e7eb' }}
                  >
                    <td style={td}>{i.cliente}</td>
                    <td style={{ ...td, fontFamily: 'monospace', color: '#1d4ed8' }}>
                      {i.codigoNota}
                    </td>
                    <td style={td}>{i.producto}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {i.precioVenta.toFixed(2)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#dc2626' }}>
                      -{i.descuento.toFixed(2)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#ca8a04' }}>
                      -{i.permuta.toFixed(2)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#2563eb' }}>
                      -{i.capital.toFixed(2)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                      {i.precioFinal.toFixed(2)}
                    </td>
                    <td
                      style={{
                        ...td,
                        textAlign: 'right',
                        fontWeight: 700,
                        color: i.ganancia < 0 ? '#dc2626' : '#16a34a',
                      }}
                    >
                      {i.ganancia < 0
                        ? `Se invirtió ${Math.abs(i.ganancia).toFixed(2)}`
                        : i.ganancia.toFixed(2)}
                    </td>
                    <td style={td}>{i.vendedor}</td>
                    <td style={{ ...td, fontSize: 12 }}>
                      {new Date(i.fecha).toLocaleDateString('es-BO')}
                      <br />
                      <span style={{ color: '#64748b' }}>
                        {new Date(i.fecha).toLocaleTimeString('es-BO')}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <a
                          href={route('admin.ventas.boleta', i.id_venta)}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          🧾 Normal
                        </a>
                        <a
                          href={route('admin.ventas.boleta80', i.id_venta)}
                          target="_blank"
                          className="text-xs text-green-600 hover:underline"
                        >
                          🖨 Térmica
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= RESUMEN ================= */}
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              padding: '18px',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Ganancia Total Positiva
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
                {gananciaTotal.toFixed(2)} Bs
              </div>
            </div>
          </div>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}

/* ===============================
   TABLE STYLES
=============================== */
const thWhite = {
  padding: '12px 14px',
  fontSize: 12,
  fontWeight: 800,
  textAlign: 'left',
};

const td = {
  padding: '12px 14px',
  fontSize: 14,
  color: '#334155',
};
