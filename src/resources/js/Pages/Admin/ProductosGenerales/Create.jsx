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

export default function CreateProductoGeneral() {
  const { data, setData, post, processing, errors } = useForm({
    codigo: '',
    tipo: '',
    nombre: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.productos-generales.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Producto General" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Package size={22} />
              Registrar Producto General
            </CrudTitle>
            <CrudSubtitle>
              Registro de accesorios, repuestos y productos generales
            </CrudSubtitle>
          </div>

          <CrudBackLink as={Link} href={route('admin.productos-generales.index')}>
            ← Volver
          </CrudBackLink>
        </CrudHeader>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            <CrudSectionTitle>Información del producto</CrudSectionTitle>

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
                <CrudSelect
                  value={data.tipo}
                  onChange={(e) => setData('tipo', e.target.value)}
                  disabled={processing}
                >
                  <option value="">-- Selecciona --</option>
                  <option value="vidrio_templado">Vidrio Templado</option>
                  <option value="vidrio_camara">Vidrio de Cámara</option>
                  <option value="funda">Funda</option>
                  <option value="accesorio">Accesorio</option>
                  <option value="cargador_5w">Cargador 5W</option>
                  <option value="cargador_20w">Cargador 20W</option>
                  <option value="otro">Otros / Repuestos en General</option>
                </CrudSelect>
                {errors.tipo && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.tipo}
                  </small>
                )}
              </div>

              {/* NOMBRE */}
              <div>
                <CrudLabel>Nombre (opcional)</CrudLabel>
                <CrudInput
                  value={data.nombre}
                  onChange={(e) => setData('nombre', e.target.value)}
                  disabled={processing}
                />
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
                <CrudLabel>Precio de costo</CrudLabel>
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
                <CrudLabel>Precio de venta</CrudLabel>
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
                Guardar producto
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
