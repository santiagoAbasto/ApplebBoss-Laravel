import React from 'react';
import styled from 'styled-components';

const Ui3DCard = ({
  title = 'Meta mensual',
  description = '',
  progress = 0, // porcentaje 0–100
}) => {
  return (
    <StyledWrapper>
      <div className="parent">
        <div className="card">

          {/* GLASS */}
          <div className="glass" />

          {/* CONTENIDO */}
          <div className="content">
            <span className="title">{title}</span>
            <span className="text">{description}</span>

            {/* PROGRESO */}
            <div className="progress-wrapper">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">
                {progress}% completado
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="bottom">
            <span className="status">
              {progress >= 100 ? 'Meta alcanzada 🎉' : 'Progreso actual'}
            </span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

/* =========================
   STYLES
========================= */
const StyledWrapper = styled.div`
  .parent {
    width: 100%;
    max-width: 300px;
    min-height: 320px;
    perspective: 1000px;
    margin: 0 auto;
  }

  .card {
    position: relative;
    min-height: 320px;
    border-radius: 36px;
    background: linear-gradient(135deg, #00e5a8, #00c26e);
    transform-style: preserve-3d;
    transition: transform 0.5s ease, box-shadow 0.5s ease;
    box-shadow: 0 25px 30px rgba(0, 0, 0, 0.18);
  }

  .glass {
    position: absolute;
    inset: 10px;
    border-radius: 32px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.85),
      rgba(255, 255, 255, 0.4)
    );
    transform: translateZ(25px);
    backdrop-filter: blur(6px);
  }

  .content {
    position: relative;
    padding: 36px 28px;
    transform: translateZ(26px);
  }

  .title {
    display: block;
    font-size: 18px;
    font-weight: 800;
    color: #065f46;
  }

  .text {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #065f46;
    opacity: 0.85;
  }

  /* PROGRESS */
  .progress-wrapper {
    margin-top: 24px;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #16a34a, #22c55e);
    transition: width 0.4s ease;
  }

  .progress-text {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #065f46;
  }

  .bottom {
    position: absolute;
    bottom: 18px;
    left: 24px;
    right: 24px;
    transform: translateZ(26px);
    display: flex;
    justify-content: flex-end;
  }

  .status {
    font-size: 12px;
    font-weight: 700;
    color: #047857;
  }

  /* HOVER SOLO DESKTOP */
  @media (hover: hover) {
    .parent:hover .card {
      transform: rotate3d(1, 1, 0, 18deg);
      box-shadow: 0 35px 45px rgba(0, 0, 0, 0.25);
    }
  }

  /* REDUCED MOTION */
  @media (prefers-reduced-motion: reduce) {
    .card,
    .glass,
    .parent {
      transition: none;
      transform: none !important;
    }
  }

  /* MOBILE */
  @media (max-width: 640px) {
    .parent {
      max-width: 100%;
    }

    .content {
      padding: 28px 22px;
    }
  }
`;

export default Ui3DCard;
