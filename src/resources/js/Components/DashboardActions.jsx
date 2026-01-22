import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

/* ================= ICONOS ================= */
const VentaIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M3 3h18v4H3zM5 7h14v14H5z" /></svg>
);
const ServicioIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" /></svg>
);
const ProductoIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4-9 4z" /></svg>
);
const ReporteIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z" /></svg>
);

/* ================= COMPONENTE ================= */
export default function DashboardActions() {
  const [open, setOpen] = useState(false);

  const go = (tipo) => {
    const map = {
      celular: 'admin.celulares.create',
      computadora: 'admin.computadoras.create',
      producto_general: 'admin.productos-generales.create',
    };
    window.location.href = route(map[tipo]);
  };

  return (
    <Grid>
      <ActionLink href={route('admin.ventas.create')} color="#0284c7">
        <VentaIcon /><span>Venta</span>
      </ActionLink>

      <ActionLink href={route('admin.servicios.create')} color="#16a34a">
        <ServicioIcon /><span>Servicio</span>
      </ActionLink>

      <ActionButton
        onClick={() => setOpen(!open)}
        color="#4f46e5"
        $active={open}
      >
        <ProductoIcon />
        <span>Producto</span>

        {open && (
          <Dropdown $color="#4f46e5">
            <button onClick={() => go('celular')}>Celular</button>
            <button onClick={() => go('computadora')}>Computadora</button>
            <button onClick={() => go('producto_general')}>Producto General</button>
          </Dropdown>
        )}
      </ActionButton>
      <ActionLink href={route('admin.reportes.index')} color="#e11d48">
        <ReporteIcon /><span>Reportes</span>
      </ActionLink>
    </Grid>
  );
}

/* ================= ESTILOS ================= */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 16px;
`;

const baseCard = `
  height: 64px;
  border-radius: 14px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border: none;
  outline: none;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  transition: all .25s ease;
  text-decoration: none;

  svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
  }

  &:hover {
    transform: translateY(-2px);
    color: #fff;
    background: var(--c);
  }
`;

const ActionLink = styled(Link)`
  ${baseCard}
  --c: ${({ color }) => color};
  text-decoration: none !important;
`;

const ActionButton = styled.button`
  ${baseCard}
  --c: ${({ color }) => color};
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 74px;
  left: 0;
  width: 220px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 45px rgba(0,0,0,.18);
  padding: 10px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* 🔒 Aislar estilos del botón padre */
  color: #0f172a;

  button {
    all: unset; /* 🔥 evita herencia blanca */
    display: block;
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    background: #f1f5ff;
    color: #0f172a;
    transition: all 0.2s ease;
  }

  /* 🎯 AQUÍ ESTÁ LA MAGIA */
  button:hover {
    background: ${({ $color }) => $color};
    color: #ffffff;
  }
`;
