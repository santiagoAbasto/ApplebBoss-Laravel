import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import { Package } from 'lucide-react';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudBackLink,
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

export default function Edit({ producto }) {
  const { data, setData, put, processing, errors } = useForm({
    codigo: producto.codigo,
    tipo: producto.tipo,
    nombre: producto.nombre,
    procedencia: producto.procedencia,
    precio_costo: producto.precio_costo,
    precio_venta: producto.precio_venta,
    estado: producto.estado,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.productos-generales.update', producto.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Producto General" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Package size={22} />
              Editar Producto General
            </CrudTitle>
            <CrudSubtitle>
              Modificación de información del producto
            </CrudSubtitle>
          </div>

          <CrudBackLink
            as={Link}
            href={route('admin.productos-generales.index')}
          >
            ← Volver al listado
          </CrudBackLink>
        </CrudHeader>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            <CrudSectionTitle>Datos del producto</CrudSectionTitle>

            <CrudGrid>
              {/* CÓDIGO */}
              <div>
                <CrudLabel>Código</CrudLabel>
                <CrudInput
                  value={data.codigo}
                  onChange={(e) => setData('codigo', e.target.value)}
                  disabled={processing}
                />
                {errors.codigo && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.codigo}
                  </small>
                )}
              </div>

              {/* TIPO */}
              <div>
                <CrudLabel>Tipo</CrudLabel>
                <CrudInput
                  value={data.tipo}
                  onChange={(e) => setData('tipo', e.target.value)}
                  disabled={processing}
                />
                {errors.tipo && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.tipo}
                  </small>
                )}
              </div>

              {/* NOMBRE */}
              <div>
                <CrudLabel>Nombre</CrudLabel>
                <CrudInput
                  value={data.nombre}
                  onChange={(e) => setData('nombre', e.target.value)}
                  disabled={processing}
                />
                {errors.nombre && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.nombre}
                  </small>
                )}
              </div>

              {/* PROCEDENCIA */}
              <div>
                <CrudLabel>Procedencia</CrudLabel>
                <CrudInput
                  value={data.procedencia}
                  onChange={(e) => setData('procedencia', e.target.value)}
                  disabled={processing}
                />
                {errors.procedencia && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.procedencia}
                  </small>
                )}
              </div>

              {/* PRECIO COSTO */}
              <div>
                <CrudLabel>Precio de costo (Bs)</CrudLabel>
                <CrudInput
                  type="number"
                  value={data.precio_costo}
                  onChange={(e) => setData('precio_costo', e.target.value)}
                  disabled={processing}
                />
                {errors.precio_costo && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.precio_costo}
                  </small>
                )}
              </div>

              {/* PRECIO VENTA */}
              <div>
                <CrudLabel>Precio de venta (Bs)</CrudLabel>
                <CrudInput
                  type="number"
                  value={data.precio_venta}
                  onChange={(e) => setData('precio_venta', e.target.value)}
                  disabled={processing}
                />
                {errors.precio_venta && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.precio_venta}
                  </small>
                )}
              </div>

              {/* ESTADO */}
              <div>
                <CrudLabel>Estado</CrudLabel>
                <CrudSelect
                  value={data.estado}
                  onChange={(e) => setData('estado', e.target.value)}
                  disabled={processing}
                >
                  <option value="disponible">Disponible</option>
                  <option value="vendido">Vendido</option>
                  <option value="permuta">Permuta</option>
                </CrudSelect>
                {errors.estado && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.estado}
                  </small>
                )}
              </div>
            </CrudGrid>

            {/* ================= ACTIONS ================= */}
            <CrudActions>
              <CrudButtonSecondary
                as={Link}
                href={route('admin.productos-generales.index')}
                type="button"
              >
                Cancelar
              </CrudButtonSecondary>

              <CrudButtonPrimary type="submit" disabled={processing}>
                Actualizar producto
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
