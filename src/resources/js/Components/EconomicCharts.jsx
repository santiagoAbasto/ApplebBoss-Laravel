import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';

export default function EconomicChart({
  historico = { dia: [], mes: [], anio: [] },
  resumen_total = {},
}) {
  const [periodo, setPeriodo] = useState('mes');
  const [modo, setModo] = useState('ingresos'); // ingresos | inversion | utilidad

  // Hover / Scrubber
  const [hover, setHover] = useState(null);
  const [cursor, setCursor] = useState(23); // punto seleccionado por slider (0..23)

  /* ============================
   * 1) DATOS REALES (BACKEND)
   * ============================ */
  const raw = useMemo(() => {
    const arr = Array.isArray(historico?.[periodo]) ? historico[periodo] : [];

    const mapped = arr
      .map((d) => {
        const total = Number(d?.total);
        const capital = Number(d?.capital);
        const utilidad = Number(d?.utilidad);

        return {
          fecha: d?.fecha ?? null,
          label: d?.label ?? (d?.fecha ? String(d.fecha).slice(0, 10) : '—'),
          total: Number.isFinite(total) ? total : 0,
          capital: Number.isFinite(capital) ? capital : 0,
          utilidad: Number.isFinite(utilidad) ? utilidad : 0,
        };
      })
      .filter((d) => d.fecha || d.label); // mantiene algo

    // Si viene vacío, creamos 1 punto con el monto actual para que nunca se vea vacío
    if (mapped.length === 0) {
      const fallback =
        modo === 'ingresos'
          ? Number(resumen_total?.total_ventas ?? 0)
          : modo === 'inversion'
            ? Number(resumen_total?.total_costo ?? 0)
            : Number(resumen_total?.utilidad_disponible ?? 0);

      return [
        {
          fecha: new Date().toISOString(),
          label: '—',
          total: Number.isFinite(fallback) ? fallback : 0,
          capital: Number.isFinite(fallback) ? fallback : 0,
          utilidad: Number.isFinite(fallback) ? fallback : 0,
        },
      ];
    }

    // Orden por fecha si existe
    return mapped.sort((a, b) => {
      const da = a.fecha ? new Date(a.fecha).getTime() : 0;
      const db = b.fecha ? new Date(b.fecha).getTime() : 0;
      return da - db;
    });
  }, [historico, periodo, modo, resumen_total]);

  const realValues = useMemo(() => {
    return raw.map((d) =>
      modo === 'inversion' ? d.capital : modo === 'utilidad' ? d.utilidad : d.total
    );
  }, [raw, modo]);

  /* ============================
   * 2) RESAMPLE A 24 PUNTOS + PICOS AGRESIVOS
   * ============================ */
  const N = 24;

  const buildSeries = useMemo(() => {
    const n = realValues.length;

    // 🔹 Interpolación base (lineal real)
    const base = Array.from({ length: N }, (_, i) => {
      if (n === 1) return realValues[0];

      const t = i / (N - 1);
      const pos = t * (n - 1);
      const i0 = Math.floor(pos);
      const i1 = Math.min(n - 1, i0 + 1);
      const frac = pos - i0;

      const v0 = realValues[i0];
      const v1 = realValues[i1];

      return v0 + (v1 - v0) * frac;
    });

    const max = Math.max(...base);
    const min = Math.min(...base);

    const realRange = max - min || Math.abs(max || 1);

    // 🔥 rango visual mínimo (clave)
    const visualRange = Math.max(realRange, Math.abs(max || 1) * 0.35);

    // 🔥 PICOS AGRESIVOS (NO ONDA, SERRUCHO SUAVE)
    const values = base.map((b, i) => {
      // pendiente local (dirección real)
      const prev = base[i - 1] ?? b;
      const slope = b - prev;

      // 🔥 aceleración no lineal (sube más rápido)
      const accel = Math.sign(slope) * Math.pow(Math.abs(slope), 0.6);

      // 🔥 pico asimétrico
      const spike =
        Math.sin(i * 1.35) * visualRange * 0.22 +
        Math.sin(i * 0.55) * visualRange * 0.12;

      // 🔥 empuje desde abajo
      const pushUp = Math.abs(Math.sin(i * 0.9)) * visualRange * 0.18;

      return b + accel * 2.8 + spike + pushUp;
    });

    // labels alineados a datos reales
    const meta = Array.from({ length: N }, (_, i) => {
      if (raw.length === 1) return raw[0];
      const t = i / (N - 1);
      const idx = Math.round(t * (raw.length - 1));
      return raw[Math.min(raw.length - 1, Math.max(0, idx))];
    });

    return { base, values, meta };
  }, [realValues, raw]);

  /* ============================
   * 3) PATHS + TRAMOS ROJO/VERDE
   * ============================ */
  const svg = useMemo(() => {
    const values = buildSeries.values;
    const base = buildSeries.base;

    // 🔴 CLAVE: el eje Y se calcula SOLO con BASE e incluye 0
    const max = Math.max(...base, 0);
    const min = Math.min(...base, 0);

    const pad = Math.max((max - min) * 0.08, Math.abs(max || 1) * 0.22);

    // 🔥 CLAVE: base visual según modo
    const bottom =
      modo === 'utilidad'
        ? (min < 0 ? min - pad : 0)   // utilidad negativa cae desde arriba
        : 0;                          // ingresos / inversión nacen desde abajo

    const top =
      modo === 'utilidad'
        ? (max > 0 ? max + pad : 0)
        : max + pad;

    const range = top - bottom || 1;


    const stepX = 100 / (N - 1);

    const points = values.map((v, i) => {
      const x = i * stepX;

      // 🔥 USAMOS PICOS PARA LA FORMA,
      // 🔴 PERO SI EL VALOR REAL ES NEGATIVO FORZAMOS CAÍDA VISUAL
      const visualValue =
        base[i] < 0
          ? v - Math.abs(base[i]) * 0.15
          : v;

      const y = 48 - ((visualValue - bottom) / range) * 25;

      return {
        x,
        y,
        value: values[i],   // valor con picos (visual)
        base: base[i],      // valor real financiero (puede ser -400)
        meta: buildSeries.meta[i],
        i,
      };
    });



    // Área
    let area = `M 0 50 `;
    points.forEach((p) => (area += `L ${p.x} ${p.y} `));
    area += `L 100 50 Z`;

    // Segmentos colorizados por tendencia REAL
    const segments = [];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];

      const down = cur.base < prev.base;
      const loss = cur.base < 0;

      segments.push({
        d: `M ${prev.x} ${prev.y} L ${cur.x} ${cur.y}`,
        cls: loss ? 'loss' : down ? 'down' : 'up',
      });
    }

    return { points, area, segments };
  }, [buildSeries]);

  /* ============================
   * 4) MONTO SUPERIOR + DELTA
   * ============================ */
  const monto = useMemo(() => {
    return modo === 'ingresos'
      ? Number(resumen_total?.total_ventas ?? 0)
      : modo === 'inversion'
        ? Number(resumen_total?.total_inversion ?? 0) // ✅
        : Number(resumen_total?.utilidad_disponible ?? 0);
  }, [modo, resumen_total]);


  const lastBase = buildSeries.base.at(-1) ?? 0;
  const prevBase = buildSeries.base.at(-2) ?? buildSeries.base.at(-1) ?? 0;
  const diff = lastBase - prevBase;

  const diffColor = diff < 0 ? '#ef4444' : diff === 0 ? '#facc15' : '#22c55e';
  const diffLabel = diff < 0 ? '▼' : diff === 0 ? '•' : '▲';

  /* ============================
   * 5) ACENTO POR MODO (pro)
   * ============================ */
  const accent = useMemo(() => {
    if (modo === 'inversion') return '#facc15'; // amarillo
    if (modo === 'utilidad') return lastBase < 0 ? '#ef4444' : '#22c55e';
    return '#22c55e'; // ingresos verde
  }, [modo, lastBase]);

  /* ============================
   * 6) Slider: siempre apunta al último si cambias tab
   * ============================ */
  useEffect(() => {
    setHover(null);
    setCursor(23);
  }, [periodo, modo]);

  const activeIndex = hover !== null ? hover : cursor;
  const active = svg.points[activeIndex];


  return (
    <Wrapper $accent={accent}>
      <div className="card">
        <div className="top">
          <span>Apple Boss</span>
          <span>Resumen Económico</span>
        </div>

        <div className="switch">
          {['ingresos', 'inversion', 'utilidad'].map((m) => (
            <button
              key={m}
              className={modo === m ? 'active' : ''}
              onClick={() => setModo(m)}
              type="button"
            >
              {m}
            </button>
          ))}
        </div>

        <div className="priceRow">
          <div className="price">
            Bs {Number(monto ?? 0).toLocaleString('es-BO')}
          </div>

          {diff !== 0 && (
            <div className="delta" style={{ color: diffColor }}>
              {diffLabel} Bs {Math.abs(diff).toLocaleString('es-BO')}
            </div>
          )}
        </div>


        <div className="period">
          {['dia', 'mes', 'anio'].map((p) => (
            <button
              key={p}
              className={periodo === p ? 'active' : ''}
              onClick={() => setPeriodo(p)}
              type="button"
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        {/* SCRUBBER PRO */}
        <div className="scrubber">
          <span className="scrubLabel">0</span>
          <input
            type="range"
            min={0}
            max={23}
            step={1}
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
          />
          <span className="scrubLabel">23</span>
        </div>

        <div className="chart" key={`${periodo}-${modo}`}>
          <svg viewBox="0 0 100 50" preserveAspectRatio="none">
            <path d={svg.area} className="area" />

            {svg.segments.map((s, idx) => (
              <path key={idx} d={s.d} className={`seg ${s.cls}`} />
            ))}

            {svg.points.map((p) => {
              const isActive = p.i === activeIndex;
              const isLoss = (p.base ?? 0) < 0;

              return (
                <circle
                  key={p.i}
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 2.8 : 1.7}
                  className={`dot ${isLoss ? 'lossDot' : ''} ${isActive ? 'activeDot' : ''}`}
                  onMouseEnter={() => setHover(p.i)}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}

            {/* “crosshair” vertical suave */}
            {active && <line x1={active.x} y1="6" x2={active.x} y2="50" className="cross" />}
          </svg>

          {/* TOOLTIP PRO */}
          {active && (
            <div className="tooltip" style={{ left: `${active.x}%` }}>
              <div className="ttTitle">{active.meta?.label ?? '—'}</div>

              <div className="ttValue">
                Bs {Number(active.base ?? 0).toLocaleString('es-BO')}
              </div>

              <div className="ttSub">
                {modo === 'utilidad' && Number(active.base ?? 0) < 0 ? (
                  <span className="lossText">📉 Se invirtió</span>
                ) : (
                  <span className="okText">📈 Movimiento</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

/* =============================
 * ESTILOS PREMIUM (PRODUCCIÓN)
 * ============================= */
const Wrapper = styled.div`
  --accent: ${({ $accent }) => $accent};

  .card {
    background: #000;
    border-radius: 32px;
    padding: 20px;
    color: #fff;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .top {
    display: flex;
    justify-content: space-between;
    font-size: 0.95em;
    opacity: 0.85;
  }

  .switch,
  .period {
    display: flex;
    gap: 10px;
    margin: 12px 0;
  }

  button {
    flex: 1;
    background: #222;
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 16px;
    padding: 10px 8px;
    color: #aaa;
    font-size: 0.78em;
    cursor: pointer;
    transition: transform 0.08s ease, background 0.15s ease;
  }

  button:active {
    transform: translateY(1px);
  }

  button.active {
    background: var(--accent);
    color: #000;
    font-weight: 700;
  }

  .priceRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .price {
    font-size: 2.2em;
    font-weight: 900;
    letter-spacing: 0.3px;
  }

  .delta {
    font-size: 0.95em;
    font-weight: 800;
    opacity: 0.95;
    white-space: nowrap;
  }

  .scrubber {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0 10px 0;
    opacity: 0.95;
  }

  .scrubLabel {
    font-size: 0.72em;
    color: #888;
    width: 22px;
    text-align: center;
  }

  .scrubber input {
    flex: 1;
    accent-color: var(--accent);
  }

  .chart {
    flex: 1;
    min-height: 240px;
    background: #111;
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  }

  svg {
    width: 100%;
    height: 100%;
  }

  /* Area suave */
  .area {
    fill: color-mix(in srgb, var(--accent) 18%, transparent);
  }

  /* Segmentos (verde/rojo) */
  .seg {
    fill: none;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 520;
    stroke-dashoffset: 520;
    animation: draw 1.2s ease forwards;
  }

  .seg.up {
    stroke: #22c55e;
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.28));
  }

  .seg.down {
    stroke: #ef4444;
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.25));
  }

  .seg.loss {
    stroke: #ef4444;
    filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.35));
  }

  .dot {
    fill: var(--accent);
    opacity: 0.95;
    transition: r 0.12s ease, opacity 0.12s ease;
  }

  .lossDot {
    fill: #ef4444;
    filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.55));
  }

  .activeDot {
    opacity: 1;
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.18));
  }

  .cross {
    stroke: rgba(255, 255, 255, 0.07);
    stroke-width: 0.6;
    stroke-dasharray: 2 2;
  }

  .tooltip {
    position: absolute;
    bottom: 10px;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 12px;
    border-radius: 14px;
    font-size: 0.78em;
    white-space: nowrap;
    backdrop-filter: blur(6px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
  }

  .ttTitle {
    color: #bdbdbd;
    font-size: 0.9em;
    margin-bottom: 4px;
  }

  .ttValue {
    font-size: 1.05em;
    font-weight: 900;
  }

  .ttSub {
    margin-top: 6px;
    font-size: 0.92em;
    opacity: 0.95;
  }

  .lossText {
    color: #ef4444;
    font-weight: 900;
  }

  .okText {
    color: #22c55e;
    font-weight: 900;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
`;
