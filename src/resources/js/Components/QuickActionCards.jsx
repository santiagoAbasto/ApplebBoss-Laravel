import React from 'react';
import styled from 'styled-components';
import { Link } from '@inertiajs/react';

export default function QuickActionCards({ actions = [] }) {
  return (
    <Wrapper>
      {actions.map((a, i) => (
        <ActionCard key={i} href={a.href}>
          <span className="fill" />

          <div className="icon">
            <i className={`fas ${a.icon}`} />
          </div>

          <span className="label">{a.label}</span>
        </ActionCard>
      ))}
    </Wrapper>
  );
}

/* =======================
   STYLES
======================= */

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 3rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCard = styled(Link)`
  position: relative;
  overflow: hidden;
  height: 96px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid rgba(16, 185, 129, 0.18);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;

  font-weight: 700;
  font-size: 15px;
  color: #065f46;

  /* 🔥 FIX DEFINITIVO LINK */
  &,
  &:hover,
  &:focus,
  &:visited,
  &:active {
    text-decoration: none !important;
    color: inherit;
    outline: none;
  }

  &:focus-visible {
    outline: none;
  }

  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);

  transition: transform 0.25s ease, box-shadow 0.25s ease;

  /* ====== RELLENO TIPO UIVERSE ====== */
  .fill {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    z-index: 0;
  }

  .icon,
  .label {
    position: relative;
    z-index: 1;
    transition: color 0.3s ease, transform 0.25s ease;
  }

  .icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #16a34a;
  }

  /* ====== HOVER ====== */
  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 18px 30px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  &:hover .fill {
    transform: scaleX(1);
  }

  &:hover .icon,
  &:hover .label {
    color: #ffffff;
  }

  &:hover .icon {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.97);
  }
`;
