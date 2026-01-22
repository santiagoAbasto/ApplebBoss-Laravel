import styled from 'styled-components';

export const NeonBox = styled.div`
  position: relative;
  padding: 22px;
  border-radius: 20px;
  background: #ffffff;

  /* ===============================
     BORDE BASE (VISIBLE SIEMPRE)
  =============================== */
  box-shadow:
    inset 0 0 0 3px #9ff1e5,
    0 8px 20px rgba(15, 23, 42, 0.08);

  transition: box-shadow 0.25s ease, transform 0.2s ease;
  
  /* ===============================
     HOVER (SUTIL PREMIUM)
  =============================== */
  &:hover {
    box-shadow:
      inset 0 0 0 3px #6ee7d8,
      0 14px 30px rgba(15, 23, 42, 0.12);
  }

  /* ===============================
     SI ADENTRO HAY INPUT EN FOCUS
     (se integra con NeonInput)
  =============================== */
  &:focus-within {
    box-shadow:
      inset 0 0 0 3px #14b8a6,
      0 0 0 4px rgba(20, 184, 166, 0.25),
      0 20px 40px rgba(20, 184, 166, 0.25);

    transform: translateY(-1px);
  }
`;
