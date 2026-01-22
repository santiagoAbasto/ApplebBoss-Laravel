import React from 'react';
import styled from 'styled-components';

export default function AnimatedActionButton({
  label = 'Registrar',
  icon = 'fa-check',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
}) {
  return (
    <Btn
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
    >
      <span className="fill" />
      <span className="content">
        <span className="icon">
          <i className={`fas ${loading ? 'fa-spinner fa-spin' : icon}`} />
        </span>
        <span className="label">{loading ? 'Registrando...' : label}</span>
      </span>
    </Btn>
  );
}

const Btn = styled.button`
  position: relative;
  overflow: hidden;
  height: 56px;
  border-radius: 18px;
  padding: 0 22px;

  border: 1px solid rgba(16, 185, 129, 0.22);
  background: #ffffff;

  cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);

  transition: transform 0.25s ease, box-shadow 0.25s ease;

  .fill {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    z-index: 0;
  }

  .content {
    position: relative;
    z-index: 1;

    display: inline-flex;
    align-items: center;
    gap: 12px;

    font-weight: 800;
    font-size: 15px;
    color: #065f46;

    transition: color 0.25s ease;
  }

  .icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    font-size: 18px;
    color: #16a34a;
    transition: transform 0.25s ease, color 0.25s ease;
  }

  @media (hover: hover) {
    &:hover {
      transform: translateY(-3px);
      box-shadow:
        0 18px 30px rgba(0, 0, 0, 0.16),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    &:hover .fill {
      transform: scaleX(1);
    }

    &:hover .content,
    &:hover .icon {
      color: #ffffff;
    }

    &:hover .icon {
      transform: scale(1.06);
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
