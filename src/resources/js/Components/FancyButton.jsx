import React from 'react';
import styled from 'styled-components';

export default function FancyButton({
  children,
  variant = 'primary', // primary | danger | success | dark
  size = 'md',         // sm | md
  icon = 'arrow',
  className = '',
  ...props
}) {
  return (
    <StyledWrapper
      $variant={variant}
      $size={size}
      className={className}
    >
      <button
        type="button"
        className="button"
        {...props}
      >
        <span className="text">{children}</span>

        {icon === 'arrow' && (
          <span className="svg" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 38 15"
              fill="none"
            >
              <path
                fill="white"
                d="M10 7.519l-.939-.344h0l.939.344zm14.386-1.205l-.981-.192.981.192zm1.276 5.509l.537.843.148-.094.107-.139-.792-.611zm4.819-4.304l-.385-.923h0l.385.923zm7.227.707a1 1 0 0 0 0-1.414L31.343.448a1 1 0 0 0-1.414 0 1 1 0 0 0 0 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364z"
              />
            </svg>
          </span>
        )}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  /* =====================================================
     🧼 WRAPPER INVISIBLE (FIX DEFINITIVO)
     👉 Esto elimina el cuadro sin afectar otros usos
  ===================================================== */
  background: transparent;
  border: none;
  padding: 0;
  display: inline-block;

  /* =====================================================
     🎨 VARIANTES
  ===================================================== */
  --bg: ${({ $variant }) =>
    $variant === 'danger'
      ? '#dc2626'
      : $variant === 'success'
      ? '#059669'
      : $variant === 'dark'
      ? '#111827'
      : '#2563eb'};

  --bgHover: ${({ $variant }) =>
    $variant === 'danger'
      ? '#b91c1c'
      : $variant === 'success'
      ? '#047857'
      : $variant === 'dark'
      ? '#0b1220'
      : '#1d4ed8'};

  --border: ${({ $variant }) =>
    $variant === 'danger'
      ? '#fecaca'
      : $variant === 'success'
      ? '#a7f3d0'
      : $variant === 'dark'
      ? '#cbd5e1'
      : '#bfdbfe'};

  /* =====================================================
     📏 TAMAÑOS
  ===================================================== */
  --padY: ${({ $size }) => ($size === 'sm' ? '7px' : '9px')};
  --padX: ${({ $size }) => ($size === 'sm' ? '14px' : '18px')};
  --font: ${({ $size }) => ($size === 'sm' ? '0.82rem' : '0.9rem')};

  /* =====================================================
     🔘 BOTÓN
  ===================================================== */
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    padding: var(--padY) var(--padX);
    background-color: var(--bg);
    border: 3px solid var(--border);
    border-radius: 999px;

    color: white;
    font-size: var(--font);
    font-weight: 700;
    letter-spacing: 0.3px;

    cursor: pointer;
    user-select: none;
    transition: all 0.25s ease;
  }

  .text {
    white-space: nowrap;
  }

  .svg {
    display: flex;
    align-items: center;
  }

  .svg svg {
    width: 22px;
    height: 12px;
  }

  /* =====================================================
     ✨ INTERACCIONES
  ===================================================== */
  .button:hover {
    background-color: var(--bgHover);
    transform: translateY(-1px);
  }

  .button:active {
    transform: scale(0.96);
    border-width: 2px;
  }

  .button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.28);
  }

  .button:hover .svg svg {
    animation: jello-vertical 0.9s both;
    transform-origin: left;
  }

  /* =====================================================
     📱 MOBILE
  ===================================================== */
  @media (max-width: 640px) {
    .svg {
      display: none; /* flecha oculta en móvil */
    }
  }

  /* =====================================================
     🎞️ ANIMACIÓN
  ===================================================== */
  @keyframes jello-vertical {
    0% { transform: scale3d(1, 1, 1); }
    30% { transform: scale3d(0.75, 1.25, 1); }
    40% { transform: scale3d(1.25, 0.75, 1); }
    50% { transform: scale3d(0.85, 1.15, 1); }
    65% { transform: scale3d(1.05, 0.95, 1); }
    75% { transform: scale3d(0.95, 1.05, 1); }
    100% { transform: scale3d(1, 1, 1); }
  }
`;
