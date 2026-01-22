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

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    modelo: '',
    capacidad: '',
    bateria: '',
    color: '',
    numero_serie: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    tiene_imei: false,
    imei_1: '',
    imei_2: '',
    estado_imei: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.productos-apple.store'));
  };

  return (
    <AdminLayout>
      <Head title="Crear Producto Apple" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Apple size={22} />
              Registrar Producto Apple
            </CrudTitle>
            <CrudSubtitle>
              Completa la información del producto antes de guardarlo
            </CrudSubtitle>
          </div>
        </CrudHeader>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            <CrudSectionTitle>Información del producto</CrudSectionTitle>

            <CrudGrid>
              {[
                { label: 'Modelo', key: 'modelo' },
                { label: 'Capacidad', key: 'capacidad' },
                { label: 'Batería', key: 'bateria' },
                { label: 'Color', key: 'color' },
                { label: 'Número de serie / IMEI general', key: 'numero_serie' },
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

              {/* TIENE IMEI */}
              <div>
                <CrudLabel>¿Tiene IMEI?</CrudLabel>
                <CrudSelect
                  value={data.tiene_imei}
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
                Guardar producto
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
