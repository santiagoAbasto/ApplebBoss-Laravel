import styled from 'styled-components';

/* =====================================================
   CONTENEDOR PRINCIPAL DEL FORM (AJUSTADO)
===================================================== */
export const FormContainer = styled.div`
  width: 100%;
  max-width: 880px;              /* ⬅️ MÁS ANCHO */
  margin: 0 auto;                /* ⬅️ SIN margen vertical exagerado */
  background: linear-gradient(
    0deg,
    rgb(255, 255, 255) 0%,
    rgb(244, 247, 251) 100%
  );
  border-radius: 28px;           /* ⬅️ Un poco menos exagerado */
  padding: 28px 32px;            /* ⬅️ Menos padding vertical */
  border: 4px solid rgb(255, 255, 255);
  box-shadow: rgba(133, 189, 215, 0.45) 0px 24px 28px -18px;
`;

/* =====================================================
   TÍTULO DEL FORM
===================================================== */
export const FormTitle = styled.h2`
  text-align: center;
  font-weight: 900;
  font-size: 26px;
  color: rgb(16, 137, 211);
  margin-bottom: 18px;
`;

/* =====================================================
   SUBTÍTULO / SECCIÓN
===================================================== */
export const FormSectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(16, 137, 211);
  margin: 20px 0 8px;
`;

/* =====================================================
   INPUT BASE
===================================================== */
export const Input = styled.input`
  width: 100%;
  background: white;
  border: none;
  padding: 14px 18px;            /* ⬅️ más compacto */
  border-radius: 18px;
  margin-top: 10px;              /* ⬅️ menos aire */
  font-size: 14px;
  box-shadow: #cff0ff 0px 8px 10px -6px;
  border-inline: 2px solid transparent;
  transition: all 0.18s ease-in-out;

  &::placeholder {
    color: rgb(170, 170, 170);
  }

  &:focus {
    outline: none;
    border-inline: 2px solid #12b1d1;
  }
`;

/* =====================================================
   TEXTAREA
===================================================== */
export const Textarea = styled.textarea`
  width: 100%;
  background: white;
  border: none;
  padding: 14px 18px;
  border-radius: 18px;
  margin-top: 10px;
  font-size: 14px;
  min-height: 80px;              /* ⬅️ menos alto */
  resize: none;
  box-shadow: #cff0ff 0px 8px 10px -6px;
  border-inline: 2px solid transparent;
  transition: all 0.18s ease-in-out;

  &::placeholder {
    color: rgb(170, 170, 170);
  }

  &:focus {
    outline: none;
    border-inline: 2px solid #12b1d1;
  }
`;

/* =====================================================
   SELECT
===================================================== */
export const Select = styled.select`
  width: 100%;
  background: white;
  border: none;
  padding: 14px 18px;
  border-radius: 18px;
  margin-top: 10px;
  font-size: 14px;
  box-shadow: #cff0ff 0px 8px 10px -6px;
  border-inline: 2px solid transparent;
  transition: all 0.18s ease-in-out;

  &:focus {
    outline: none;
    border-inline: 2px solid #12b1d1;
  }
`;

/* =====================================================
   BOTÓN PRINCIPAL
===================================================== */
export const PrimaryButton = styled.button`
  display: block;
  width: 100%;
  font-weight: bold;
  background: linear-gradient(
    45deg,
    rgb(16, 137, 211) 0%,
    rgb(18, 177, 209) 100%
  );
  color: white;
  padding: 14px;
  margin: 22px auto 0;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  box-shadow: rgba(133, 189, 215, 0.45) 0px 18px 10px -14px;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* =====================================================
   BOTÓN SECUNDARIO
===================================================== */
export const SecondaryButton = styled.button`
  background: transparent;
  border: none;
  color: #ff4d4f;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 6px;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: rgba(255, 77, 79, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;
/* =====================================================
   CONTENEDOR DE ÍTEM DE SERVICIO (CARD)
===================================================== */
export const ServiceCard = styled.div`
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #f4f9fd 100%
  );
  border-radius: 22px;
  padding: 18px 20px;
  margin-top: 14px;
  border-left: 6px solid #12b1d1; /* cyan tech */
  box-shadow: rgba(18, 177, 209, 0.25) 0px 12px 20px -12px;
`;

/* =====================================================
   GRID INTERNO DEL SERVICIO
===================================================== */
export const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 0.6fr;
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

/* =====================================================
   LABEL PEQUEÑO
===================================================== */
export const FieldLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1089d3; /* azul tech */
  margin-bottom: 4px;
`;

/* =====================================================
   PRECIO CLIENTE (RESALTADO POSITIVO)
===================================================== */
export const PriceHighlight = styled(Input)`
  border-inline: 2px solid #2ecc71;

  &:focus {
    border-inline: 2px solid #2ecc71;
  }
`;

/* =====================================================
   FOOTER DE CARD SERVICIO
===================================================== */
export const ServiceFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

