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

export default function CreateComputadora() {
  const { data, setData, post, processing, errors } = useForm({
    nombre: '',
    procesador: '',
    numero_serie: '',
    color: '',
    bateria: '',
    ram: '',
    almacenamiento: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.computadoras.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Computadora" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Laptop size={22} />
              Registrar nueva computadora
            </CrudTitle>
            <CrudSubtitle>
              Completa los datos para registrar una computadora en el inventario
            </CrudSubtitle>
          </div>
        </CrudHeader>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            <CrudSectionTitle>Información del equipo</CrudSectionTitle>

            <CrudGrid>
              {[
                { label: 'Nombre', key: 'nombre' },
                { label: 'Procesador', key: 'procesador' },
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
                type="button"
                onClick={() => window.history.back()}
              >
                Cancelar
              </CrudButtonSecondary>

              <CrudButtonPrimary type="submit" disabled={processing}>
                Guardar computadora
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}
