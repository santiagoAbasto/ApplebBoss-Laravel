import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import { Laptop } from 'lucide-react';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudBackLink,
  CrudInfoBox,
  CrudCard,
  CrudSectionTitle,
  CrudGrid,
  CrudLabel,
  CrudInput,
  CrudSelect,
  CrudActions,
  CrudButtonPrimary,
  CrudButtonSecondary,
} from '@/Components/CrudUI';

export default function EditComputadora({ computadora }) {
  const { data, setData, put, processing, errors } = useForm({
    nombre: computadora.nombre,
    procesador: computadora.procesador || '',
    numero_serie: computadora.numero_serie,
    color: computadora.color,
    bateria: computadora.bateria,
    ram: computadora.ram,
    almacenamiento: computadora.almacenamiento,
    procedencia: computadora.procedencia,
    precio_costo: computadora.precio_costo,
    precio_venta: computadora.precio_venta,
    estado: computadora.estado,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.computadoras.update', computadora.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Computadora" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Laptop size={22} />
              Editar computadora
            </CrudTitle>
            <CrudSubtitle>
              Modificando: <strong>{computadora.nombre}</strong>
            </CrudSubtitle>
          </div>

          <CrudBackLink as="button" onClick={() => window.history.back()}>
            ← Volver
          </CrudBackLink>
        </CrudHeader>

        {/* ================= INFO ================= */}
        <CrudInfoBox>
          Estás editando una computadora existente. Los cambios se reflejarán
          inmediatamente en el inventario, reportes y ventas.
        </CrudInfoBox>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            <CrudSectionTitle>Información del equipo</CrudSectionTitle>

            <CrudGrid>
              {/* NOMBRE */}
              <div>
                <CrudLabel>Nombre</CrudLabel>
                <CrudInput
                  value={data.nombre}
                  onChange={(e) => setData('nombre', e.target.value)}
                />
                {errors.nombre && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.nombre}
                  </small>
                )}
              </div>

              {/* PROCESADOR */}
              <div>
                <CrudLabel>Procesador</CrudLabel>
                <CrudInput
                  value={data.procesador}
                  onChange={(e) => setData('procesador', e.target.value)}
                />
                {errors.procesador && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.procesador}
                  </small>
                )}
              </div>

              {[
                { label: 'Número de serie', key: 'numero_serie' },
                { label: 'Color', key: 'color' },
                { label: 'Batería (opcional)', key: 'bateria' },
                { label: 'RAM', key: 'ram' },
                { label: 'Almacenamiento', key: 'almacenamiento' },
                { label: 'Procedencia', key: 'procedencia' },
                { label: 'Precio costo (Bs)', key: 'precio_costo', type: 'number' },
                { label: 'Precio venta (Bs)', key: 'precio_venta', type: 'number' },
              ].map(({ label, key, type = 'text' }) => (
                <div key={key}>
                  <CrudLabel>{label}</CrudLabel>
                  <CrudInput
                    type={type}
                    value={data[key]}
                    onChange={(e) => setData(key, e.target.value)}
                  />
                  {errors[key] && (
                    <small style={{ color: '#dc2626' }}>
                      {errors[key]}
                    </small>
                  )}
                </div>
              ))}

              {/* ESTADO */}
              <div>
                <CrudLabel>Estado</CrudLabel>
                <CrudSelect
                  value={data.estado}
                  onChange={(e) => setData('estado', e.target.value)}
                >
                  <option value="disponible">Disponible</option>
                  <option value="vendido">Vendido</option>
                  <option value="permuta">Permuta</option>
                </CrudSelect>
              </div>
            </CrudGrid>

            {/* ================= ACTIONS ================= */}
            <CrudActions>
              <CrudButtonSecondary
                type="button"
                onClick={() => window.history.back()}
              >
                Cancelar
              </CrudButtonSecondary>

              <CrudButtonPrimary type="submit" disabled={processing}>
                Actualizar computadora
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
