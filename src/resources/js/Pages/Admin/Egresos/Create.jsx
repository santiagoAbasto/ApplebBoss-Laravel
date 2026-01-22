import { useForm, Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaSave } from 'react-icons/fa';

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
} from '@/Components/CrudUI';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    concepto: '',
    precio_invertido: '',
    tipo_gasto: 'servicio_basico',
    frecuencia: '',
    cuotas_pendientes: '',
    comentario: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.egresos.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Egreso" />

      <CrudWrapper>
        {/* HEADER */}
        <CrudHeader>
          <CrudTitle>📤 Registrar nuevo egreso</CrudTitle>
          <CrudSubtitle>
            Registra gastos operativos y financieros del negocio
          </CrudSubtitle>
        </CrudHeader>

        <form onSubmit={submit}>
          <CrudCard>
            <CrudSectionTitle>Información del egreso</CrudSectionTitle>

            <CrudGrid>
              {/* CONCEPTO */}
              <div className="md:col-span-2">
                <CrudLabel>Concepto *</CrudLabel>
                <CrudInput
                  value={data.concepto}
                  onChange={(e) => setData('concepto', e.target.value)}
                  placeholder="Ej. Luz Tienda, Alquiler, etc."
                />
                {errors.concepto && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.concepto}
                  </p>
                )}
              </div>

              {/* PRECIO INVERTIDO */}
              <div>
                <CrudLabel>Precio invertido (Bs) *</CrudLabel>
                <CrudInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.precio_invertido}
                  onChange={(e) =>
                    setData('precio_invertido', e.target.value)
                  }
                  placeholder="Ej. 250.00"
                />
                {errors.precio_invertido && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.precio_invertido}
                  </p>
                )}
              </div>

              {/* TIPO DE GASTO */}
              <div>
                <CrudLabel>Tipo de gasto *</CrudLabel>
                <CrudInput
                  as="select"
                  value={data.tipo_gasto}
                  onChange={(e) => setData('tipo_gasto', e.target.value)}
                >
                  <option value="servicio_basico">Servicio básico</option>
                  <option value="cuota_bancaria">Cuota bancaria</option>
                  <option value="gasto_personal">Gasto personal</option>
                  <option value="sueldos">Sueldos</option>
                </CrudInput>
                {errors.tipo_gasto && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.tipo_gasto}
                  </p>
                )}
              </div>

              {/* FRECUENCIA */}
              <div>
                <CrudLabel>Frecuencia</CrudLabel>
                <CrudInput
                  value={data.frecuencia}
                  onChange={(e) => setData('frecuencia', e.target.value)}
                  placeholder="Ej. Mensual, único, trimestral..."
                />
                {errors.frecuencia && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.frecuencia}
                  </p>
                )}
              </div>

              {/* CUOTAS PENDIENTES */}
              {data.tipo_gasto === 'cuota_bancaria' && (
                <div>
                  <CrudLabel>Cuotas pendientes</CrudLabel>
                  <CrudInput
                    type="number"
                    min="0"
                    value={data.cuotas_pendientes}
                    onChange={(e) =>
                      setData('cuotas_pendientes', e.target.value)
                    }
                    placeholder="Ej. 3"
                  />
                  {errors.cuotas_pendientes && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.cuotas_pendientes}
                    </p>
                  )}
                </div>
              )}

              {/* COMENTARIO */}
              <div className="md:col-span-2">
                <CrudLabel>Comentario adicional</CrudLabel>
                <CrudInput
                  as="textarea"
                  rows={3}
                  value={data.comentario}
                  onChange={(e) => setData('comentario', e.target.value)}
                  placeholder="Ej. Vencimiento el 15 de cada mes..."
                />
                {errors.comentario && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.comentario}
                  </p>
                )}
              </div>
            </CrudGrid>

            {/* ACCIONES */}
            <CrudActions>
              <CrudButtonPrimary type="submit" disabled={processing}>
                <FaSave /> Guardar egreso
              </CrudButtonPrimary>
            </CrudActions>
          </CrudCard>
        </form>
      </CrudWrapper>
    </AdminLayout>
  );
}
