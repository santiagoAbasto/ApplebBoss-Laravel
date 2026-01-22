import React from 'react';
import styled from 'styled-components';

export default function NeonInput({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  height = 46,
  ...props
}) {
  return (
    <Wrap $height={height}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        {...props}
      />
    </Wrap>
  );
}

const Wrap = styled.div`
  width: 100%;

  input {
    width: 100%;
    height: ${({ $height }) => `${$height}px`};
    padding: 0 16px;

    border-radius: 16px;
    border: none;
    outline: none !important;

    /* 🔥 mata Safari / Tailwind */
    box-shadow: none;
    -webkit-appearance: none;
    appearance: none;

    background: #ffffff;
    color: #0f172a;
    font-size: 14px;

    /* ===============================
       BORDE BASE (VISIBLE SIEMPRE)
    =============================== */
    box-shadow:
      inset 0 0 0 3px #9ff1e5,
      0 4px 10px rgba(15, 23, 42, 0.06);

    transition: box-shadow 0.25s ease, transform 0.15s ease;
  }

  /* ===============================
     HOVER (sutil pero visible)
  =============================== */
  input:hover {
    box-shadow:
      inset 0 0 0 3px #6ee7d8,
      0 6px 14px rgba(15, 23, 42, 0.08);
  }

  /* ===============================
     FOCUS (FUERTE / PREMIUM)
  =============================== */
  input:focus,
  input:focus-visible {
    box-shadow:
      inset 0 0 0 3px #14b8a6,
      0 0 0 4px rgba(20, 184, 166, 0.35),
      0 10px 30px rgba(20, 184, 166, 0.25);

    transform: translateY(-1px);
  }

  input::placeholder {
    color: #9ca3af;
  }
`;
