import React from 'react';
import styled from 'styled-components';

export default function AnimatedButton({ onClick }) {
  return (
    <StyledWrapper>
      <button
        type="button"
        className="Btn"
        onClick={onClick}
        aria-label="Cerrar sesión"
      >
        <div className="sign">
          <svg viewBox="0 0 512 512">
            <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9v-62.1H192c-17.7 0-32-14.3-32-32v-64c0-17.7 14.3-32 32-32h128v-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9z" />
          </svg>
        </div>
        <span className="text">Salir</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .Btn {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: none;

    background: linear-gradient(135deg, #ef4444, #dc2626);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    transition:
      width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.25s ease,
      transform 0.2s ease;

    box-shadow:
      0 6px 16px rgba(239, 68, 68, 0.35);
  }

  .Btn:active {
    transform: scale(0.96);
  }

  .sign {
    width: 100%;
    display: grid;
    place-items: center;
  }

  .sign svg {
    width: 16px;
    fill: white;
  }

  .text {
    position: absolute;
    right: 14px;
    opacity: 0;
    white-space: nowrap;

    color: white;
    font-size: 0.9rem;
    font-weight: 600;

    transition: opacity 0.25s ease;
  }

  /* 💻 SOLO HOVER REAL */
  @media (hover: hover) {
    .Btn:hover {
      width: 120px;
      box-shadow:
        0 10px 26px rgba(239, 68, 68, 0.55);
    }

    .Btn:hover .text {
      opacity: 1;
    }
  }

  /* 📱 MOBILE SAFE */
  @media (max-width: 640px) {
    .Btn {
      width: 48px;
      height: 48px;
    }
  }
`;
