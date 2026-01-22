import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Apple } from 'lucide-react';

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

export default function Edit({ productoApple }) {
  const { data, setData, put, processing, errors } = useForm({
    modelo: productoApple.modelo || '',
    capacidad: productoApple.capacidad || '',
    bateria: productoApple.bateria || '',
    color: productoApple.color || '',
    numero_serie: productoApple.numero_serie || '',
    procedencia: productoApple.procedencia || '',
    precio_costo: productoApple.precio_costo || '',
    precio_venta: productoApple.precio_venta || '',
    tiene_imei: productoApple.tiene_imei || false,
    imei_1: productoApple.imei_1 || '',
    imei_2: productoApple.imei_2 || '',
    estado_imei: productoApple.estado_imei || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.productos-apple.update', productoApple.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Producto Apple" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Apple size={22} />
              Editar Producto Apple
            </CrudTitle>
            <CrudSubtitle>
              Modificando: <strong>{productoApple.modelo}</strong>
            </CrudSubtitle>
          </div>

          <CrudBackLink as="button" onClick={() => window.history.back()}>
            ← Volver
          </CrudBackLink>
        </CrudHeader>

        {/* ================= INFO ================= */}
        <CrudInfoBox>
          Estás editando un producto Apple existente. Los cambios se reflejarán
          inmediatamente en inventario, ventas y reportes.
        </CrudInfoBox>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            <CrudSectionTitle>Información del producto</CrudSectionTitle>

            <CrudGrid>
              {[
                { name: 'modelo', label: 'Modelo' },
                { name: 'capacidad', label: 'Capacidad' },
                { name: 'bateria', label: 'Batería' },
                { name: 'color', label: 'Color' },
                { name: 'numero_serie', label: 'Número de serie / IMEI general' },
                { name: 'procedencia', label: 'Procedencia' },
                { name: 'precio_costo', label: 'Precio costo (Bs)', type: 'number' },
                { name: 'precio_venta', label: 'Precio venta (Bs)', type: 'number' },
              ].map(({ name, label, type = 'text' }) => (
                <div key={name}>
                  <CrudLabel>{label}</CrudLabel>
                  <CrudInput
                    type={type}
                    value={data[name]}
                    onChange={(e) => setData(name, e.target.value)}
                  />
                  {errors[name] && (
                    <small style={{ color: '#dc2626' }}>
                      {errors[name]}
                    </small>
                  )}
                </div>
              ))}

              {/* TIENE IMEI */}
              <div>
                <CrudLabel>¿Tiene IMEI?</CrudLabel>
                <CrudSelect
                  value={data.tiene_imei ? 'true' : 'false'}
                  onChange={(e) =>
                    setData('tiene_imei', e.target.value === 'true')
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </CrudSelect>
                {errors.tiene_imei && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.tiene_imei}
                  </small>
                )}
              </div>
            </CrudGrid>

            {/* ================= IMEI ================= */}
            {data.tiene_imei && (
              <>
                <CrudSectionTitle>Información IMEI</CrudSectionTitle>

                <CrudGrid>
                  <div>
                    <CrudLabel>IMEI 1</CrudLabel>
                    <CrudInput
                      value={data.imei_1}
                      onChange={(e) => setData('imei_1', e.target.value)}
                    />
                    {errors.imei_1 && (
                      <small style={{ color: '#dc2626' }}>
                        {errors.imei_1}
                      </small>
                    )}
                  </div>

                  <div>
                    <CrudLabel>IMEI 2</CrudLabel>
                    <CrudInput
                      value={data.imei_2}
                      onChange={(e) => setData('imei_2', e.target.value)}
                    />
                    {errors.imei_2 && (
                      <small style={{ color: '#dc2626' }}>
                        {errors.imei_2}
                      </small>
                    )}
                  </div>

                  <div>
                    <CrudLabel>Estado del IMEI</CrudLabel>
                    <CrudSelect
                      value={data.estado_imei}
                      onChange={(e) =>
                        setData('estado_imei', e.target.value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      <option>Libre</option>
                      <option>Registro seguro</option>
                      <option>IMEI 1 libre y IMEI 2 registrado</option>
                      <option>IMEI 2 libre y IMEI 1 registrado</option>
                    </CrudSelect>
                    {errors.estado_imei && (
                      <small style={{ color: '#dc2626' }}>
                        {errors.estado_imei}
                      </small>
                    )}
                  </div>
                </CrudGrid>
              </>
            )}

            {/* ================= ACTIONS ================= */}
            <CrudActions>
              <CrudButtonSecondary
                type="button"
                onClick={() => window.history.back()}
              >
                Cancelar
              </CrudButtonSecondary>

              <CrudButtonPrimary type="submit" disabled={processing}>
                Guardar cambios
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
