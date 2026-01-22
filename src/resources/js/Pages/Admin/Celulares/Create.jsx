import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { Loader2, Smartphone } from 'lucide-react';

/* ===== ESTILOS CRUD ===== */
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

export default function CreateCelular() {
  const { data, setData, post, processing, errors, reset } = useForm({
    modelo: '',
    capacidad: '',
    color: '',
    bateria: '',
    imei_1: '',
    imei_2: '',
    estado_imei: 'libre',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  /* ===============================
     HELPERS
  =============================== */
  const handleImei = (field, value) => {
    const onlyDigits = value.replace(/\D/g, '').slice(0, 15);
    setData(field, onlyDigits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.celulares.store'), {
      onSuccess: () => {
        showSuccess('Celular registrado correctamente');
        reset();
      },
      onError: () => showError('Error al registrar el celular'),
    });
  };

  return (
    <AdminLayout>
      <Head title="Registrar Celular" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Smartphone size={22} />
              Registrar nuevo celular
            </CrudTitle>
            <CrudSubtitle>
              Completa la información del equipo antes de guardarlo
            </CrudSubtitle>
          </div>

          <CrudBackLink as={Link} href={route('admin.celulares.index')}>
            ← Volver al listado
          </CrudBackLink>
        </CrudHeader>

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit}>
          <CrudCard>
            <CrudSectionTitle>Información del equipo</CrudSectionTitle>

            <CrudGrid>
              {/* MODELO */}
              <div>
                <CrudLabel>Modelo</CrudLabel>
                <CrudInput
                  value={data.modelo}
                  onChange={(e) => setData('modelo', e.target.value)}
                />
                {errors.modelo && <small style={{ color: 'red' }}>{errors.modelo}</small>}
              </div>

              {/* CAPACIDAD */}
              <div>
                <CrudLabel>Capacidad</CrudLabel>
                <CrudInput
                  value={data.capacidad}
                  onChange={(e) => setData('capacidad', e.target.value)}
                />
                {errors.capacidad && <small style={{ color: 'red' }}>{errors.capacidad}</small>}
              </div>

              {/* COLOR */}
              <div>
                <CrudLabel>Color</CrudLabel>
                <CrudInput
                  value={data.color}
                  onChange={(e) => setData('color', e.target.value)}
                />
              </div>

              {/* BATERÍA */}
              <div>
                <CrudLabel>Batería (%)</CrudLabel>
                <CrudInput
                  value={data.bateria}
                  onChange={(e) => setData('bateria', e.target.value)}
                />
              </div>

              {/* IMEI 1 */}
              <div>
                <CrudLabel>IMEI 1</CrudLabel>
                <CrudInput
                  value={data.imei_1}
                  maxLength={15}
                  onChange={(e) => handleImei('imei_1', e.target.value)}
                />
                {errors.imei_1 && <small style={{ color: 'red' }}>{errors.imei_1}</small>}
              </div>

              {/* IMEI 2 */}
              <div>
                <CrudLabel>IMEI 2 (opcional)</CrudLabel>
                <CrudInput
                  value={data.imei_2}
                  maxLength={15}
                  onChange={(e) => handleImei('imei_2', e.target.value)}
                />
              </div>

              {/* ESTADO IMEI */}
              <div>
                <CrudLabel>Estado IMEI</CrudLabel>
                <CrudSelect
                  value={data.estado_imei}
                  onChange={(e) => setData('estado_imei', e.target.value)}
                >
                  <option value="libre">Libre</option>
                  <option value="registrado">Registrado</option>
                  <option value="imei1_libre_imei2_registrado">
                    IMEI 1 libre / IMEI 2 registrado
                  </option>
                  <option value="imei1_registrado_imei2_libre">
                    IMEI 1 registrado / IMEI 2 libre
                  </option>
                </CrudSelect>
              </div>

              {/* PROCEDENCIA */}
              <div>
                <CrudLabel>Procedencia</CrudLabel>
                <CrudInput
                  value={data.procedencia}
                  onChange={(e) => setData('procedencia', e.target.value)}
                />
              </div>

              {/* PRECIO COSTO */}
              <div>
                <CrudLabel>Precio costo</CrudLabel>
                <CrudInput
                  type="number"
                  value={data.precio_costo}
                  onChange={(e) => setData('precio_costo', e.target.value)}
                />
              </div>

              {/* PRECIO VENTA */}
              <div>
                <CrudLabel>Precio venta</CrudLabel>
                <CrudInput
                  type="number"
                  value={data.precio_venta}
                  onChange={(e) => setData('precio_venta', e.target.value)}
                />
              </div>

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
                as={Link}
                href={route('admin.celulares.index')}
              >
                Cancelar
              </CrudButtonSecondary>

              <CrudButtonPrimary type="submit" disabled={processing}>
                {processing && <Loader2 size={18} className="animate-spin" />}
                Guardar celular
              </CrudButtonPrimary>
            </CrudActions>
          </CrudCard>
        </form>
      </CrudWrapper>

      <ToastContainer />
    </AdminLayout>
  );
}
