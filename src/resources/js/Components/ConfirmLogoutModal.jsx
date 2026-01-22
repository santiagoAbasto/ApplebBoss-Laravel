import React from 'react';
import styled from 'styled-components';

export default function ConfirmLogoutModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  // 🔍 Detectar contexto por URL
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';

  const isAdmin = pathname.startsWith('/admin');
  const isVendedor = pathname.startsWith('/vendedor');

  const panelName = isAdmin
    ? 'panel de administración'
    : isVendedor
      ? 'panel del vendedor'
      : 'panel';

  const titleColor = isAdmin ? '#1e3a8a' : '#064e3b'; // azul admin | verde vendedor

  return (
    <Overlay>
      <Modal $titleColor={titleColor}>
        <h3>¿Cerrar sesión?</h3>

        <p>
          Estás a punto de salir del <strong>{panelName}</strong>.
          <br />
          ¿Deseas continuar?
        </p>

        <div className="actions">
          <button className="cancel" onClick={onClose}>
            Cancelar
          </button>

          <button className="logout" onClick={onConfirm}>
            Salir
          </button>
        </div>
      </Modal>
    </Overlay>
  );
}

/* ================= ESTILOS ================= */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 9999;
`;

const Modal = styled.div`
  width: 90%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 18px;
  padding: 24px;

  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  animation: pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${({ $titleColor }) => $titleColor};
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: #475569;
    line-height: 1.5;
  }

  .actions {
    margin-top: 22px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  button {
    border-radius: 999px;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
  }

  button:active {
    transform: scale(0.95);
  }

  .cancel {
    background: #f1f5f9;
    color: #334155;
  }

  .cancel:hover {
    background: #e2e8f0;
  }

  .logout {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    box-shadow: 0 10px 22px rgba(239, 68, 68, 0.4);
  }

  .logout:hover {
    box-shadow: 0 14px 28px rgba(239, 68, 68, 0.6);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
