import styled from 'styled-components';

/* =====================================================
   WRAPPER GENERAL
===================================================== */
export const CrudWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 22px;
`;

/* =====================================================
   HEADER CRUD
===================================================== */
export const CrudHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 26px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e5e7eb;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

/* =====================================================
   TÍTULO PRINCIPAL
===================================================== */
export const CrudTitle = styled.h1`
  font-size: 28px;
  font-weight: 900;
  color: #0b1f33; /* azul muy oscuro */
  display: flex;
  align-items: center;
  gap: 10px;
`;

/* =====================================================
   SUBTÍTULO
===================================================== */
export const CrudSubtitle = styled.p`
  font-size: 14px;
  color: #475569;
  margin-top: 4px;
`;

/* =====================================================
   LINK VOLVER
===================================================== */
export const CrudBackLink = styled.a`
  font-size: 14px;
  font-weight: 600;
  color: #1e40af; /* azul fuerte */
  cursor: pointer;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

/* =====================================================
   CONTENEDOR FORM / CARD
===================================================== */
export const CrudCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 26px 28px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
`;

/* =====================================================
   TÍTULO DE SECCIÓN
===================================================== */
export const CrudSectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1e3a8a; /* azul corporativo */
  margin: 28px 0 14px;
`;

/* =====================================================
   GRID BASE
===================================================== */
export const CrudGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

/* =====================================================
   LABEL
===================================================== */
export const CrudLabel = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 6px;
  display: block;
`;

/* =====================================================
   INPUT / SELECT BASE
===================================================== */
export const CrudInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
`;

export const CrudSelect = styled.select`
  width: 100%;
  padding: 12px 42px 12px 14px;
  font-size: 14px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  background-color: #ffffff;
  color: #0f172a;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  line-height: 1.4;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
`;

/* =====================================================
   INFO BOX (MÁS SOBRIO)
===================================================== */
export const CrudInfoBox = styled.div`
  background: #f1f5f9;
  border-left: 5px solid #2563eb;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  margin-bottom: 22px;
`;

/* =====================================================
   FOOTER ACCIONES
===================================================== */
export const CrudActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 32px;
`;

/* =====================================================
   BOTONES
===================================================== */
export const CrudButtonPrimary = styled.button`
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
  padding: 12px 26px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const CrudButtonSecondary = styled.button`
  background: transparent;
  border: 1.5px solid #dc2626;   /* rojo limpio */
  color: #dc2626;
  font-weight: 700;
  padding: 11px 22px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(220, 38, 38, 0.08);
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const CrudButtonDanger = styled.button`
  background: #dc2626;
  color: white;
  font-weight: 700;
  padding: 11px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #b91c1c;
  }

  &:active {
    transform: scale(0.96);
  }
`;


