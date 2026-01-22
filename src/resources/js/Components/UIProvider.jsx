import { createGlobalStyle } from "styled-components";

const GlobalUI = createGlobalStyle`
  /* ===============================
     INPUTS / SELECT / TEXTAREA
  =============================== */
  .input {
    width: 100%;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    outline: none;

    background: #F2F2F2;
    border: 1px solid transparent;

    color: #111827;
    font-size: 14px;

    transition: all .25s cubic-bezier(0.15, 0.83, 0.66, 1);
  }

  textarea.input {
    padding: 12px 14px;
    min-height: 110px;
    resize: vertical;
  }

  select.input {
    padding-right: 36px;
    appearance: none;
    background-image:
      linear-gradient(45deg, transparent 50%, #111 50%),
      linear-gradient(135deg, #111 50%, transparent 50%);
    background-position:
      calc(100% - 18px) 55%,
      calc(100% - 12px) 55%;
    background-size: 6px 6px;
    background-repeat: no-repeat;
  }

  .input:focus {
    background: transparent;
    box-shadow: 0 0 0 2px #111827;
  }

  .input::placeholder {
    color: #6B7280;
  }

  /* quitar spinners number */
  .input::-webkit-outer-spin-button,
  .input::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  .input[type=number] {
    -moz-appearance: textfield;
  }

  /* ===============================
     BOTONES
  =============================== */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    min-height: 44px;
    padding: 0 16px;

    border-radius: 12px;
    border: 0;
    cursor: pointer;

    font-weight: 700;
    font-size: 14px;

    transition: transform .15s ease, box-shadow .2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .btn:active {
    transform: scale(0.97);
  }

  .btn-primary {
    color: #fff;
    background: linear-gradient(180deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%);
    box-shadow: 0 10px 24px rgba(37, 99, 235, .25);
  }

  .btn-secondary {
    background: #F2F2F2;
    color: #111827;
  }

  .btn-success {
    color: #fff;
    background: linear-gradient(180deg, #16A34A 0%, #15803D 50%, #14532D 100%);
    box-shadow: 0 10px 24px rgba(22, 163, 74, .22);
  }

  /* hover solo desktop real */
  @media (hover:hover) {
    .btn:hover {
      box-shadow: 0 14px 30px rgba(0,0,0,.15);
    }
  }

  /* ===============================
     RESPONSIVE SIN TOCAR JSX
  =============================== */
  @media (max-width: 768px) {
    .input.w-80,
    .input.w-56,
    .input.w-24,
    .input.w-20 {
      width: 100% !important;
    }

    .btn.btn-success.px-8 {
      width: 100%;
    }

    table th,
    table td {
      white-space: nowrap;
    }
  }
`;

export default function UIProvider() {
  return <GlobalUI />;
}
