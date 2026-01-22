import React from 'react';
import styled from 'styled-components';

export default function UiversePanelCard({ title, children }) {
  return (
    <Wrapper>
      <div className="card">
        <h3 className="heading">{title}</h3>
        <div className="content">{children}</div>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  .card {
    position: relative;
    width: 100%;
    min-height: 240px;

    /* 🎨 ESTADO NORMAL */
    background: #ffffff;
    color: #0f172a;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    padding: 18px;
    gap: 12px;
    border-radius: 16px;

    box-shadow:
      0 8px 20px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px rgba(20, 184, 166, 0.15);

    transition:
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      background-color 0.25s ease,
      box-shadow 0.25s ease;

    cursor: default;
    overflow: hidden;
  }

  /* ===== BORDE SUAVE ===== */
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 18px;
    padding: 2px;

    background: linear-gradient(
      135deg,
      #5eead4,
      #22c55e
    );

    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;

    opacity: 0.35;
    transition: opacity 0.25s ease;
  }

  /* ===== GLOW ===== */
  .card::after {
    content: '';
    position: absolute;
    inset: -20px;

    background: radial-gradient(
      circle,
      rgba(45, 212, 191, 0.35),
      transparent 70%
    );

    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: -1;
  }

  /* ===== HOVER (SE MUEVE Y VUELVE) ===== */
  .card:hover {
    transform: translateY(4px);
    background: linear-gradient(
      135deg,
      #ecfeff,
      #d1fae5
    );

    box-shadow:
      0 12px 28px rgba(16, 185, 129, 0.25),
      inset 0 0 0 1px rgba(16, 185, 129, 0.4);
  }

  .card:hover::before {
    opacity: 0.85;
  }

  .card:hover::after {
    opacity: 1;
  }

  /* ===== TEXTO ===== */
  .heading {
    font-size: 16px;
    font-weight: 700;
    color: #064e3b;
  }

  .content {
    font-size: 14px;
    color: #065f46;
  }

  /* ===== MOBILE SAFE ===== */
  @media (max-width: 640px) {
    .card {
      min-height: 200px;
    }
  }
`;
