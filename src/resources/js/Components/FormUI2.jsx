import styled from 'styled-components';

/* =====================================================
   CONTENEDOR PRINCIPAL DEL FORM (VENDEDOR)
===================================================== */
export const FormContainer = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #f3fcfb 100%
  );
  border-radius: 26px;
  padding: 26px 30px;
  border: 3px solid #e6f6f4;
  box-shadow: rgba(46, 196, 182, 0.25) 0px 24px 30px -18px;
`;

/* =====================================================
   TÍTULO DEL FORM
===================================================== */
export const FormTitle = styled.h2`
  text-align: center;
  font-weight: 900;
  font-size: 26px;
  color: #1fa89c;
  margin-bottom: 16px;
`;

/* =====================================================
   SUBTÍTULO / SECCIÓN
===================================================== */
export const FormSectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #1fa89c;
  margin: 22px 0 10px;
`;

/* =====================================================
   INPUT BASE
===================================================== */
export const Input = styled.input`
  width: 100%;
  background: #ffffff;
  border: none;
  padding: 14px 18px;
  border-radius: 18px;
  margin-top: 10px;
  font-size: 14px;
  box-shadow: rgba(46, 196, 182, 0.25) 0px 8px 12px -8px;
  border-inline: 2px solid transparent;
  transition: all 0.18s ease-in-out;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-inline: 2px solid #2ec4b6;
  }
`;

/* =====================================================
   TEXTAREA
===================================================== */
export const Textarea = styled.textarea`
  width: 100%;
  background: #ffffff;
  border: none;
  padding: 14px 18px;
  border-radius: 18px;
  margin-top: 10px;
  font-size: 14px;
  min-height: 80px;
  resize: none;
  box-shadow: rgba(46, 196, 182, 0.25) 0px 8px 12px -8px;
  border-inline: 2px solid transparent;
  transition: all 0.18s ease-in-out;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-inline: 2px solid #2ec4b6;
  }
`;

/* =====================================================
   SELECT
===================================================== */
export const Select = styled.select`
  width: 100%;
  background: #ffffff;
  border: none;
  padding: 14px 18px;
  border-radius: 18px;
  margin-top: 10px;
  font-size: 14px;
  box-shadow: rgba(46, 196, 182, 0.25) 0px 8px 12px -8px;
  border-inline: 2px solid transparent;
  transition: all 0.18s ease-in-out;

  &:focus {
    outline: none;
    border-inline: 2px solid #2ec4b6;
  }
`;

/* =====================================================
   BOTÓN PRINCIPAL (VENDEDOR)
===================================================== */
export const PrimaryButton = styled.button`
  display: block;
  width: 100%;
  font-weight: bold;
  background: linear-gradient(
    45deg,
    #2ec4b6 0%,
    #38d9c8 100%
  );
  color: white;
  padding: 14px;
  margin: 22px auto 0;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  box-shadow: rgba(46, 196, 182, 0.45) 0px 18px 12px -14px;
  transition: all 0.18s ease-in-out;

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
  color: #e03131;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  margin-top: 6px;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: rgba(224, 49, 49, 0.1);
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
    #e8f8f6 100%
  );
  border-radius: 22px;
  padding: 18px 20px;
  margin-top: 16px;
  border-left: 6px solid #2ec4b6;
  box-shadow: rgba(46, 196, 182, 0.3) 0px 14px 22px -14px;
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
  color: #1fa89c;
  margin-bottom: 4px;
`;

/* =====================================================
   PRECIO CLIENTE (RESALTADO POSITIVO)
===================================================== */
export const PriceHighlight = styled(Input)`
  border-inline: 2px solid #40c057;

  &:focus {
    border-inline: 2px solid #40c057;
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
