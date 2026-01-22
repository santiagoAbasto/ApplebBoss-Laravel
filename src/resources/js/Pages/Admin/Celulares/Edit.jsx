import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastNotification from '@/Components/ToastNotification';
import { Loader2, Phone } from 'lucide-react';

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

export default function Edit({ celular }) {
  const { data, setData, put, processing, errors } = useForm({
    modelo: celular.modelo || '',
    capacidad: celular.capacidad || '',
    color: celular.color || '',
    bateria: celular.bateria || '',
    imei_1: celular.imei_1 || '',
    imei_2: celular.imei_2 || '',
    estado_imei: celular.estado_imei || 'libre',
    procedencia: celular.procedencia || '',
    precio_costo: celular.precio_costo || '',
    precio_venta: celular.precio_venta || '',
    estado: celular.estado || 'disponible',
  });

  const [toastVisible, setToastVisible] = useState(false);

  /* ===============================
     HANDLERS
  =============================== */
  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.celulares.update', celular.id), {
      onSuccess: () => {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
      },
    });
  };

  const handleImeiInput = (field, value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 15);
    setData(field, numericValue);
  };

  return (
    <AdminLayout>
      <Head title="Editar Celular" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Phone size={22} />
              Editar celular
            </CrudTitle>
            <CrudSubtitle>
              Modificación de datos del equipo en inventario
            </CrudSubtitle>
          </div>

          <CrudBackLink as={Link} href={route('admin.celulares.index')}>
            ← Volver
          </CrudBackLink>
        </CrudHeader>

        {/* ================= INFO ================= */}
        <CrudInfoBox>
          Estás editando un equipo existente. Los cambios se reflejarán
          inmediatamente en el inventario y reportes.
        </CrudInfoBox>

        {/* ================= FORM ================= */}
        <CrudCard>
          <form onSubmit={handleSubmit}>
            {/* ========= DATOS GENERALES ========= */}
            <CrudSectionTitle>Información del equipo</CrudSectionTitle>

            <CrudGrid>
              {[
                ['Modelo', 'modelo'],
                ['Capacidad', 'capacidad'],
                ['Color', 'color'],
                ['Batería (opcional)', 'bateria'],
                ['Procedencia', 'procedencia'],
              ].map(([label, field]) => (
                <div key={field}>
                  <CrudLabel>{label}</CrudLabel>
                  <CrudInput
                    value={data[field]}
                    onChange={(e) => setData(field, e.target.value)}
                  />
                  {errors[field] && (
                    <small style={{ color: '#dc2626' }}>
                      {errors[field]}
                    </small>
                  )}
                </div>
              ))}
            </CrudGrid>

            {/* ========= IMEI ========= */}
            <CrudSectionTitle>IMEI</CrudSectionTitle>

            <CrudGrid>
              <div>
                <CrudLabel>IMEI 1</CrudLabel>
                <CrudInput
                  value={data.imei_1}
                  onChange={(e) =>
                    handleImeiInput('imei_1', e.target.value)
                  }
                />
                {errors.imei_1 && (
                  <small style={{ color: '#dc2626' }}>
                    {errors.imei_1}
                  </small>
                )}
              </div>

              <div>
                <CrudLabel>IMEI 2 (opcional)</CrudLabel>
                <CrudInput
                  value={data.imei_2}
                  onChange={(e) =>
                    handleImeiInput('imei_2', e.target.value)
                  }
                />
              </div>

              <div>
                <CrudLabel>Estado IMEI</CrudLabel>
                <CrudSelect
                  value={data.estado_imei}
                  onChange={(e) =>
                    setData('estado_imei', e.target.value)
                  }
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
            </CrudGrid>

            {/* ========= PRECIOS ========= */}
            <CrudSectionTitle>Precios</CrudSectionTitle>

            <CrudGrid>
              <div>
                <CrudLabel>Precio de costo</CrudLabel>
                <CrudInput
                  type="number"
                  value={data.precio_costo}
                  onChange={(e) =>
                    setData('precio_costo', e.target.value)
                  }
                />
              </div>

              <div>
                <CrudLabel>Precio de venta</CrudLabel>
                <CrudInput
                  type="number"
                  value={data.precio_venta}
                  onChange={(e) =>
                    setData('precio_venta', e.target.value)
                  }
                />
              </div>
            </CrudGrid>

            {/* ========= ESTADO ========= */}
            <CrudSectionTitle>Estado</CrudSectionTitle>

            <CrudSelect
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </CrudSelect>

            {/* ========= ACCIONES ========= */}
            <CrudActions>
              <CrudButtonSecondary
                as={Link}
                href={route('admin.celulares.index')}
                type="button"
              >
                Cancelar
              </CrudButtonSecondary>

              <CrudButtonPrimary type="submit" disabled={processing}>
                {processing && <Loader2 size={16} className="animate-spin" />}
                Actualizar celular
              </CrudButtonPrimary>
            </CrudActions>
          </form>
        </CrudCard>
      </CrudWrapper>

      <ToastNotification
        show={toastVisible}
        type="success"
        message="✅ Celular actualizado con éxito"
      />
    </AdminLayout>
  );
}
