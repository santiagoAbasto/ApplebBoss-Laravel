import styled from 'styled-components';

export const NeonField = styled.div`
  position: relative;
  width: 100%;

  textarea,
  select {
    width: 100%;
    min-height: 46px;
    padding: 12px 16px;

    border-radius: 14px;
    border: none;
    outline: none !important;
    resize: none;

    background: #ffffff;
    color: #0f172a;
    font-size: 14px;

    /* 🔥 BORDE PASTEL ÚNICO */
    box-shadow:
      inset 0 0 0 2px #bff3ea,
      0 2px 6px rgba(0, 0, 0, 0.04);

    -webkit-appearance: none;
    appearance: none;

    transition: box-shadow 0.25s ease;
  }

  /* 🔥 FOCUS UNIFICADO (NO AZUL) */
  textarea:focus,
  textarea:focus-visible,
  select:focus,
  select:focus-visible {
    outline: none !important;
    box-shadow:
      inset 0 0 0 2.5px #7debd9,
      0 0 0 3px rgba(125, 235, 217, 0.25);
  }

  /* 🔥 HOVER SUTIL */
  textarea:hover,
  select:hover {
    box-shadow:
      inset 0 0 0 2px #9ff1e5,
      0 3px 8px rgba(0, 0, 0, 0.06);
  }
`;
