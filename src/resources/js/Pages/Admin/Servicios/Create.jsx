import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import { route } from 'ziggy-js';

import {
  FormContainer,
  FormTitle,
  FormSectionTitle,
  Input,
  Textarea,
  PrimaryButton,
  SecondaryButton,

  // 👇 NUEVOS COMPONENTES UX
  ServiceCard,
  ServiceGrid,
  FieldLabel,
  PriceHighlight,
  ServiceFooter,
} from '@/Components/FormUI';


export default function CreateServicio() {
  const { data, setData, post, processing } = useForm({
    cliente: '',
    telefono: '',
    equipo: '',
    tecnico: '',
    fecha: new Date().toISOString().split('T')[0],
    detalle_servicio: '',
    notas_adicionales: '',
    precio_costo: 0,
    precio_venta: 0,
  });

  /* ======================
     SERVICIOS (ESTRUCTURA REAL)
  ====================== */
  const [servicios, setServicios] = useState([
    { descripcion: '', costo: '', precio: '' },
  ]);

  /* ======================
     CLIENTES (AUTOCOMPLETE)
  ====================== */
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const buscarCliente = async (valor) => {
    setData('cliente', valor);
    if (valor.length < 2) {
      setMostrarSugerencias(false);
      return;
    }

    const res = await axios.get(
      route('admin.clientes.sugerencias', { term: valor }) // ✅ CORRECTO
    );

    setSugerencias(res.data);
    setMostrarSugerencias(true);
  };


  const seleccionarCliente = (c) => {
    setData((prev) => ({
      ...prev,
      cliente: c.nombre,
      telefono: c.telefono,
    }));
    setMostrarSugerencias(false);
  };

  /* ======================
     SERVICIOS CRUD
  ====================== */
  const agregarServicio = () =>
    setServicios((prev) => [
      ...prev,
      { descripcion: '', costo: '', precio: '' },
    ]);

  const actualizarServicio = (i, campo, valor) =>
    setServicios((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [campo]: valor } : s))
    );

  const eliminarServicio = (i) =>
    setServicios((prev) => prev.filter((_, idx) => idx !== i));

  /* ======================
     TOTALES REALES
  ====================== */
  const totalCosto = servicios.reduce(
    (sum, s) => sum + Number(s.costo || 0),
    0
  );

  const totalVenta = servicios.reduce(
    (sum, s) => sum + Number(s.precio || 0),
    0
  );

  /* ======================
     SUBMIT (JSON LIMPIO)
  ====================== */
  const handleSubmit = (e) => {
    e.preventDefault();

    const serviciosValidos = servicios.filter(
      (s) =>
        s.descripcion &&
        Number(s.costo) >= 0 &&
        Number(s.precio) >= 0
    );

    if (serviciosValidos.length === 0) {
      alert('Debe registrar al menos un servicio válido');
      return;
    }

    const detalleJSON = serviciosValidos.map((s) => ({
      descripcion: s.descripcion,
      costo: Number(s.costo),   // 🔴 ESTE ERA EL DATO QUE SE PERDÍA
      precio: Number(s.precio),
    }));

    // ✅ PRIMERO setData
    setData((prev) => ({
      ...prev,
      detalle_servicio: JSON.stringify(detalleJSON),
      precio_costo: totalCosto,
      precio_venta: totalVenta,
    }));

    // ✅ LUEGO post SIN payload
    post(route('admin.servicios.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Servicio Técnico" />

      <FormContainer>
        {/* TÍTULO */}
        <FormTitle>Servicio Técnico</FormTitle>

        <form onSubmit={handleSubmit}>
          {/* ======================
            CLIENTE
        ====================== */}
          <FormSectionTitle>Información del Cliente</FormSectionTitle>

          <Input
            placeholder="Cliente"
            value={data.cliente}
            onChange={(e) => buscarCliente(e.target.value)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
          />

          {mostrarSugerencias && sugerencias.length > 0 && (
            <div
              style={{
                marginTop: 8,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                padding: 6,
              }}
            >
              {sugerencias.map((c, i) => (
                <SecondaryButton
                  key={i}
                  type="button"
                  onMouseDown={() => seleccionarCliente(c)} // ✅ CLAVE
                  style={{ display: 'block', width: '100%', textAlign: 'left' }}
                >
                  {c.nombre} — {c.telefono}
                </SecondaryButton>
              ))}
            </div>
          )}

          <Input
            placeholder="Teléfono"
            value={data.telefono}
            onChange={(e) => setData('telefono', e.target.value)}
          />

          <Input
            placeholder="Equipo"
            value={data.equipo}
            onChange={(e) => setData('equipo', e.target.value)}
          />

          <Input
            placeholder="Técnico"
            value={data.tecnico}
            onChange={(e) => setData('tecnico', e.target.value)}
          />

          {/* ======================
            SERVICIOS
        ====================== */}
          <FormSectionTitle>Detalle del Servicio</FormSectionTitle>

          {servicios.map((s, i) => (
            <ServiceCard key={i}>
              <ServiceGrid>
                {/* DESCRIPCIÓN */}
                <div>
                  <FieldLabel>Servicio</FieldLabel>
                  <Input
                    placeholder="Descripción del servicio"
                    value={s.descripcion}
                    onChange={(e) =>
                      actualizarServicio(i, 'descripcion', e.target.value)
                    }
                  />
                </div>

                {/* COSTO */}
                <div>
                  <FieldLabel>Costo</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Costo"
                    value={s.costo}
                    onChange={(e) =>
                      actualizarServicio(i, 'costo', e.target.value)
                    }
                  />
                </div>

                {/* PRECIO CLIENTE */}
                <div>
                  <FieldLabel>Precio Cliente</FieldLabel>
                  <PriceHighlight
                    type="number"
                    min="0"
                    placeholder="Precio"
                    value={s.precio}
                    onChange={(e) =>
                      actualizarServicio(i, 'precio', e.target.value)
                    }
                  />
                </div>
              </ServiceGrid>

              <ServiceFooter>
                <SecondaryButton
                  type="button"
                  onMouseDown={() => eliminarServicio(i)}
                >
                  Eliminar servicio
                </SecondaryButton>
              </ServiceFooter>
            </ServiceCard>
          ))}

          <PrimaryButton type="button" onClick={agregarServicio}>
            + Agregar servicio
          </PrimaryButton>


          {/* ======================
            NOTAS
        ====================== */}
          <FormSectionTitle>Notas adicionales</FormSectionTitle>

          <Textarea
            placeholder="Observaciones, condiciones, recomendaciones..."
            value={data.notas_adicionales}
            onChange={(e) =>
              setData('notas_adicionales', e.target.value)
            }
          />

          {/* ======================
            TOTALES
        ====================== */}
          <div style={{ marginTop: 20, fontSize: 14 }}>
            <p>
              <strong>Costo total:</strong> Bs {totalCosto.toFixed(2)}
            </p>
            <p>
              <strong>Cliente paga:</strong> Bs {totalVenta.toFixed(2)}
            </p>
          </div>

          {/* ======================
            SUBMIT
        ====================== */}
          <PrimaryButton type="submit" disabled={processing}>
            {processing ? 'Guardando…' : 'Guardar Servicio'}
          </PrimaryButton>
        </form>
      </FormContainer>
    </AdminLayout>
  );

}
