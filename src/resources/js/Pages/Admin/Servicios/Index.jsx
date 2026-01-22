import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';
import axios from 'axios';
import { Wrench, Search, FileText, PlusCircle, Printer } from 'lucide-react';

/* =======================
   CRUD UI
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
  CrudSelect,
} from '@/Components/CrudUI';

export default function ServiciosIndex({ servicios = [], filtros = {}, vendedores = [] }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');
  const [buscar, setBuscar] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.servicios.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    });
  };

  const handleExportarFiltrado = () => {
    const queryParams = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }).toString();

    window.open(
      route('admin.servicios.exportarFiltrado') + '?' + queryParams,
      '_blank'
    );
  };

  const buscarServicio = async (e) => {
    e.preventDefault();
    if (!buscar.trim()) return;

    try {
      const response = await axios.get(route('admin.servicios.index'), {
        params: { buscar: buscar.trim() },
      });
      setResultadosBusqueda(response.data.servicios || []);
    } catch (error) {
      console.error('Error al buscar servicio técnico:', error);
      setResultadosBusqueda([]);
    }
  };

  const listaFinal =
    resultadosBusqueda !== null ? resultadosBusqueda : servicios;

  return (
    <AdminLayout>
      <Head title="Servicios Técnicos" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Wrench size={22} />
              Servicios Técnicos
            </CrudTitle>
            <CrudSubtitle>
              Gestión, filtrado y exportación de servicios técnicos
            </CrudSubtitle>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <CrudButtonPrimary
              as={Link}
              href={route('admin.servicios.create')}
            >
              <PlusCircle size={18} />
              Registrar Servicio
            </CrudButtonPrimary>

            <CrudButtonSecondary
              type="button"
              onClick={handleExportarFiltrado}
            >
              <FileText size={16} />
              Exportar PDF
            </CrudButtonSecondary>
          </div>
        </CrudHeader>

        {/* ================= BUSCADOR ================= */}
        <CrudCard style={{ marginBottom: 22 }}>
          <form onSubmit={buscarServicio}>
            <CrudSectionTitle>
              <Search size={14} style={{ marginRight: 6 }} />
              Buscar servicio
            </CrudSectionTitle>

            <CrudGrid>
              <div>
                <CrudLabel>Código de nota o cliente</CrudLabel>
                <CrudInput
                  placeholder="Ej: ST-2024-015"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
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

        {/* ================= FILTROS ================= */}
        <CrudCard style={{ marginBottom: 22 }}>
          <CrudSectionTitle>Filtros avanzados</CrudSectionTitle>

          <form onSubmit={handleFiltrar} className="space-y-6">

            {/* ================= FILA 1: FECHAS + BOTÓN ================= */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end">

              {/* FECHA INICIO */}
              <div className="md:col-span-2">
                <CrudLabel>Fecha inicio</CrudLabel>
                <CrudInput
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              {/* FECHA FIN */}
              <div className="md:col-span-2">
                <CrudLabel>Fecha fin</CrudLabel>
                <CrudInput
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              {/* BOTÓN FILTRAR */}
              <div className="md:col-span-1">
                <CrudButtonPrimary
                  type="submit"
                  style={{ width: '100%', height: 42 }}
                >
                  Filtrar
                </CrudButtonPrimary>
              </div>
            </div>

            {/* ================= FILA 2: VENDEDOR ================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <div className="md:col-span-1">
                <CrudLabel>Vendedor</CrudLabel>

                <div style={{ position: 'relative' }}>
                  <CrudSelect
                    value={vendedorId}
                    onChange={(e) => setVendedorId(e.target.value)}
                  >
                    <option value="">— Todos —</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </CrudSelect>

                  {/* Flecha custom */}
                  <span
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      fontSize: 12,
                      color: '#64748b',
                    }}
                  >
                    ▼
                  </span>
                </div>
              </div>

            </div>
          </form>
        </CrudCard>


        {/* ================= TABLA ================= */}
        <CrudCard>
          <CrudSectionTitle>Listado de servicios</CrudSectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e40af', color: '#fff' }}>
                  {[
                    'Cliente',
                    'Código',
                    'Equipo',
                    'Técnico',
                    'Costo',
                    'Venta',
                    'Ganancia',
                    'Fecha',
                    'Registrado por',
                    'Acciones',
                  ].map((h) => (
                    <th key={h} style={thWhite}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {listaFinal.length > 0 ? (
                  listaFinal.map((s) => {
                    const costo = parseFloat(s.precio_costo || 0);
                    const venta = parseFloat(s.precio_venta || 0);
                    const ganancia = venta - costo;

                    return (
                      <tr
                        key={s.id}
                        style={{ borderTop: '1px solid #e5e7eb' }}
                      >
                        <td style={td}>{s.cliente}</td>
                        <td style={{ ...td, fontFamily: 'monospace', color: '#1d4ed8' }}>
                          {s.codigo_nota || '—'}
                        </td>
                        <td style={td}>{s.equipo}</td>
                        <td style={td}>{s.tecnico}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          {costo.toFixed(2)} Bs
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          {venta.toFixed(2)} Bs
                        </td>
                        <td
                          style={{
                            ...td,
                            textAlign: 'right',
                            fontWeight: 700,
                            color: '#16a34a',
                          }}
                        >
                          {ganancia.toFixed(2)} Bs
                        </td>
                        <td style={td}>
                          {dayjs(s.fecha).format('DD/MM/YYYY')}
                        </td>
                        <td style={td}>{s.vendedor?.name || '—'}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <a
                              href={route('admin.servicios.boleta', { servicio: s.id })}
                              target="_blank"
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              <FileText size={12} />
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  route('admin.servicios.recibo80mm', { servicio: s.id }),
                                  '_blank'
                                )
                              }
                              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              <Printer size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      style={{
                        padding: 20,
                        textAlign: 'center',
                        color: '#64748b',
                      }}
                    >
                      No hay servicios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
