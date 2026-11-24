import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { useEffect, useMemo, useId } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { route } from "ziggy-js";

const NAVY = "#16244E";
const LIMA = "#A8D82A";

const LABELS = {
    facturacion_total: "Facturación Total",
    utilidad_total: "Utilidad Total",
    utilidad_disponible: "Utilidad Disponible",
    egresos_total: "Egresos Totales",
    margen_global_pct: "Margen Global",
    ticket_promedio_global: "Ticket Promedio Global",
    dependencia_top3_pct: "Dependencia Top 3",
    crecimiento_mensual_pct: "Crecimiento Mensual",
    ingresos: "Ingresos",
    utilidad: "Utilidad",
    margen_promedio_pct: "Margen",
    ticket_promedio: "Ticket Promedio",
    nivel_riesgo: "Nivel de Riesgo",
    observacion: "Observación",
    observaciones: "Observaciones",
    modelos_mas_rentables: "Modelos Más Rentables",
    modelos_mayor_rotacion: "Modelos con Mayor Rotación",
    capacidad_mas_vendida: "Capacidad Más Vendida",
    color_mas_vendido: "Color Más Vendido",
    bateria_promedio_vendida: "Batería Promedio Vendida",
    configuracion_mas_rentable: "Configuración Más Rentable",
    procesador_mas_vendido: "Procesador Más Vendido",
    ram_mas_vendida: "RAM Más Vendida",
    almacenamiento_mas_vendido: "Almacenamiento Más Vendido",
    tipo_mas_vendido: "Tipo Más Vendido",
    producto_mayor_rotacion: "Producto con Mayor Rotación",
    producto_mejor_margen: "Producto con Mejor Margen",
    margen_promedio_accesorios: "Margen Promedio Accesorios",
    prioridad: "Prioridad",
    accion: "Acción",
    descripcion: "Descripción",
    impacto: "Impacto",
    impacto_estimado: "Impacto Estimado",
};

const PERCENT_KEYS = new Set([
    "margen_global_pct",
    "dependencia_top3_pct",
    "crecimiento_mensual_pct",
    "margen_promedio_pct",
    "margen_promedio_accesorios",
]);

const CURRENCY_KEYS = new Set([
    "facturacion_total",
    "utilidad_total",
    "utilidad_disponible",
    "egresos_total",
    "ticket_promedio_global",
    "ingresos",
    "utilidad",
    "ticket_promedio",
]);

const CAT_LABELS = {
    celular: "Celulares",
    celulares: "Celulares",
    computadora: "Computadoras",
    computadoras: "Computadoras",
    producto_general: "Accesorios",
    productos_generales: "Accesorios",
    accesorios: "Accesorios",
    producto_apple: "Apple",
    productos_apple: "Apple",
    servicio_tecnico: "Servicio técnico",
    servicios_tecnicos: "Servicio técnico",
};

export default function Show({ report }) {
    const parsed = useMemo(() => {
        try {
            return typeof report.content === "string"
                ? JSON.parse(report.content)
                : report.content;
        } catch {
            return null;
        }
    }, [report]);

    useEffect(() => {
        if (!report.viewed_at) {
            axios.post(route("admin.automation.markViewed", report.id)).catch(() => {});
        }
    }, [report.id, report.viewed_at]);

    if (!parsed) {
        return (
            <AdminLayout>
                <div className="p-10 text-red-500">Error procesando reporte.</div>
            </AdminLayout>
        );
    }

    const resumen = parsed?.resumen_ejecutivo ?? {};
    const crecimiento = Number(resumen?.crecimiento_mensual_pct ?? 0);

    const db = parsed?.datos_base ?? {};
    const mix = (Array.isArray(db.mix_ventas_categorias) ? db.mix_ventas_categorias : [])
        .slice()
        .sort((a, b) => (b.participacion_ingresos_pct || 0) - (a.participacion_ingresos_pct || 0));
    const cats = (Array.isArray(db.resumen_categorias) ? db.resumen_categorias : [])
        .slice()
        .sort((a, b) => (b.ingresos || 0) - (a.ingresos || 0));
    const rent = (Array.isArray(db.top_productos_rentables) ? db.top_productos_rentables : []).slice(0, 6);
    const rot = (Array.isArray(db.top_productos_mayor_rotacion) ? db.top_productos_mayor_rotacion : []).slice(0, 6);
    const kpis = db.kpis_comerciales ?? {};

    return (
        <AdminLayout>
            <Head title="Apple Boss Intelligence" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* ───── Cabecera ───── */}
                    <header className="relative overflow-hidden rounded-[2rem] p-6 shadow-xl ring-1 ring-slate-200/70 sm:p-8"
                        style={{ background: `linear-gradient(120deg, ${NAVY} 0%, #223869 55%, ${NAVY} 100%)` }}>
                        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-10"
                            style={{ background: LIMA }} />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-4">
                                <AppleMark size={58} />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-300">
                                        Apple Boss Intelligence
                                    </p>
                                    <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                        Informe estratégico con IA
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                                        {emptyText(resumen.descripcion) ||
                                            "Resumen ejecutivo para decidir sobre margen, mix, reposición y crecimiento."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <HeaderChip label="Período" value={formatPeriod(parsed?.period_start, parsed?.period_end)} />
                                <HeaderChip label="Estado" value={report.viewed_at ? "Revisado" : "Nuevo"} />
                                <HeaderChip label="Motor" value="Claude Opus 5.5" />
                            </div>
                        </div>
                    </header>

                    {/* ───── KPIs principales ───── */}
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard title="Facturación" value={formatBs(resumen.facturacion_total)} tone="navy" icon="cash" />
                        <MetricCard title="Utilidad" value={formatBs(resumen.utilidad_total)} tone="lima" icon="up" />
                        <MetricCard title="Utilidad disponible" value={formatBs(resumen.utilidad_disponible ?? db.utilidad_disponible)} tone="teal" icon="wallet" />
                        <MetricCard title="Margen global" value={formatPercent(resumen.margen_global_pct)} tone="sky" icon="pie" />
                    </section>

                    {/* ───── Panorama comercial: gauge + crecimiento + KPIs ───── */}
                    <Section title="Panorama comercial" subtitle="Rentabilidad, tendencia mensual y actividad del período.">
                        <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
                            <div className="flex items-center justify-center rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                <Gauge value={resumen.margen_global_pct} label="Margen global" />
                            </div>
                            <div className="space-y-4">
                                <div className={`flex items-center justify-between rounded-3xl border p-5 ${
                                    crecimiento > 0 ? "border-emerald-200 bg-emerald-50"
                                        : crecimiento < 0 ? "border-rose-200 bg-rose-50"
                                            : "border-slate-200 bg-slate-50"}`}>
                                    <div className="flex items-center gap-3">
                                        <TrendIcon dir={crecimiento > 0 ? "up" : crecimiento < 0 ? "down" : "flat"} />
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Crecimiento mensual</p>
                                            <div className="text-2xl font-extrabold text-slate-900">{formatPercent(crecimiento)}</div>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                        crecimiento > 0 ? "bg-emerald-100 text-emerald-700"
                                            : crecimiento < 0 ? "bg-rose-100 text-rose-700"
                                                : "bg-slate-200 text-slate-700"}`}>
                                        {crecimiento > 0 ? "Crecimiento" : crecimiento < 0 ? "Contracción" : "Estable"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <KpiChip label="Transacciones" value={num(kpis.transacciones_totales)} />
                                    <KpiChip label="Ítems vendidos" value={num(kpis.items_vendidos)} />
                                    <KpiChip label="Ticket prom." value={formatBs(kpis.ticket_promedio_global)} />
                                    <KpiChip label="Descuento" value={formatPercent(kpis.porcentaje_descuento_sobre_facturacion)} />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ───── Mix de ventas ───── */}
                    {mix.length > 0 && (
                        <div className="grid gap-8 xl:grid-cols-2">
                            <Section title="Mix de facturación" subtitle="Participación de cada categoría en los ingresos.">
                                <BarsSVG rows={mix.map((m) => ({
                                    label: catLabel(m.categoria),
                                    value: m.participacion_ingresos_pct || 0,
                                    right: formatPercent(m.participacion_ingresos_pct),
                                }))} color={NAVY} accent={LIMA} />
                            </Section>
                            <Section title="Mix de utilidad" subtitle="De dónde sale realmente la ganancia.">
                                <BarsSVG rows={mix
                                    .slice()
                                    .sort((a, b) => (b.participacion_utilidad_pct || 0) - (a.participacion_utilidad_pct || 0))
                                    .map((m) => ({
                                        label: catLabel(m.categoria),
                                        value: m.participacion_utilidad_pct || 0,
                                        right: formatPercent(m.participacion_utilidad_pct),
                                    }))} color="#0F766E" accent={LIMA} />
                            </Section>
                        </div>
                    )}

                    {/* ───── Ingresos y margen por categoría ───── */}
                    {cats.length > 0 && (
                        <Section title="Ingresos por categoría" subtitle="Ingreso total y margen de cada línea de negocio.">
                            <BarsSVG rows={cats.map((c) => ({
                                label: catLabel(c.categoria),
                                sub: `Margen ${formatPercent(c.margen_pct)} · Util. ${bsK(c.utilidad)}`,
                                value: c.ingresos || 0,
                                right: bsK(c.ingresos),
                            }))} color={NAVY} accent="#3b82f6" />
                        </Section>
                    )}

                    {/* ───── Top productos ───── */}
                    {(rent.length > 0 || rot.length > 0) && (
                        <div className="grid gap-8 xl:grid-cols-2">
                            {rent.length > 0 && (
                                <Section title="Productos más rentables" subtitle="Mayor utilidad generada en el período.">
                                    <BarsSVG rows={rent.map((p) => ({
                                        label: p.producto,
                                        sub: `${catLabel(p.categoria)} · ${num(p.unidades)} u · ${formatPercent(p.margen_pct)}`,
                                        value: p.utilidad || 0,
                                        right: bsK(p.utilidad),
                                    }))} color="#0F766E" accent={LIMA} />
                                </Section>
                            )}
                            {rot.length > 0 && (
                                <Section title="Mayor rotación" subtitle="Los que más salen por unidades vendidas.">
                                    <BarsSVG rows={rot.map((p) => ({
                                        label: p.producto,
                                        sub: `${catLabel(p.categoria)} · ${bsK(p.ingresos)}`,
                                        value: p.unidades || 0,
                                        right: `${num(p.unidades)} u`,
                                    }))} color="#1D4ED8" accent="#60A5FA" unitBars />
                                </Section>
                            )}
                        </div>
                    )}

                    {/* ───── Análisis por categoría (tarjetas IA) ───── */}
                    {Array.isArray(parsed?.analisis_por_categoria) && parsed.analisis_por_categoria.length > 0 && (
                        <Section title="Análisis por categoría" subtitle="Rentabilidad, margen y riesgo por línea de negocio.">
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {parsed.analisis_por_categoria.map((cat, i) => (
                                    <article key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <h3 className="text-lg font-semibold capitalize text-slate-900">{humanize(cat.categoria)}</h3>
                                            <RiskBadge value={cat.nivel_riesgo} />
                                        </div>
                                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                            <InfoPill label="Ingresos" value={formatBs(cat.ingresos)} />
                                            <InfoPill label="Utilidad" value={formatBs(cat.utilidad)} />
                                            <InfoPill label="Margen" value={formatPercent(cat.margen_promedio_pct)} />
                                            <InfoPill label="Ticket" value={formatBs(cat.ticket_promedio)} />
                                        </div>
                                        <p className="mt-5 text-sm leading-6 text-slate-600">{emptyText(cat.observacion)}</p>
                                    </article>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* ───── Analítica detallada ───── */}
                    <div className="grid gap-8 xl:grid-cols-3">
                        <Section title="Análisis Celulares" subtitle="Modelos, capacidad, color y señales de mix comercial.">
                            <AnalysisBlock data={parsed?.analisis_celulares ?? db.analisis_celulares} />
                        </Section>
                        <Section title="Análisis Computadoras" subtitle="Configuraciones, ticket y oportunidad de upselling.">
                            <AnalysisBlock data={parsed?.analisis_computadoras ?? db.analisis_computadoras} />
                        </Section>
                        <Section title="Análisis Accesorios" subtitle="Tipo, rotación y productos con mayor contribución.">
                            <AnalysisBlock data={parsed?.analisis_accesorios ?? db.analisis_accesorios} />
                        </Section>
                    </div>

                    {/* ───── Riesgos / Oportunidades ───── */}
                    <div className="grid gap-8 xl:grid-cols-2">
                        <Section title="Riesgos estratégicos" subtitle="Alertas de concentración, margen y dependencia comercial.">
                            <div className="space-y-4">
                                {(parsed?.riesgos_estrategicos ?? []).map((risk, i) => (
                                    <div key={i} className="flex gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-5">
                                        <AlertIcon />
                                        <div>
                                            <div className="text-sm font-semibold uppercase tracking-wide text-rose-700">{emptyText(risk.tipo)}</div>
                                            <p className="mt-1 text-sm leading-6 text-slate-700">{emptyText(risk.descripcion)}</p>
                                            <p className="mt-2 text-xs font-medium text-rose-700">{emptyText(risk.impacto)}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!parsed?.riesgos_estrategicos || parsed.riesgos_estrategicos.length === 0) && (
                                    <p className="text-sm text-slate-500">Sin riesgos relevantes detectados.</p>
                                )}
                            </div>
                        </Section>

                        <Section title="Oportunidades" subtitle="Palancas de crecimiento y mejora de rentabilidad.">
                            <div className="space-y-4">
                                {(parsed?.oportunidades ?? []).map((op, i) => (
                                    <div key={i} className="flex gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                                        <SparkIcon />
                                        <div>
                                            <p className="text-sm leading-6 text-slate-700">{emptyText(op.descripcion)}</p>
                                            <p className="mt-2 text-xs font-medium text-emerald-700">{emptyText(op.impacto_estimado)}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!parsed?.oportunidades || parsed.oportunidades.length === 0) && (
                                    <p className="text-sm text-slate-500">Sin oportunidades registradas.</p>
                                )}
                            </div>
                        </Section>
                    </div>

                    {/* ───── Recomendaciones ───── */}
                    <Section title="Recomendaciones ejecutivas" subtitle="Acciones priorizadas para las siguientes decisiones de negocio.">
                        <div className="space-y-4">
                            {(parsed?.recomendaciones_ejecutivas ?? []).map((rec, i) => (
                                <div key={i} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                                            style={{ background: LIMA, color: NAVY }}>{i + 1}</span>
                                        <p className="text-sm leading-6 text-slate-700">{emptyText(rec.accion)}</p>
                                    </div>
                                    <PriorityBadge value={rec.prioridad} />
                                </div>
                            ))}
                            {(!parsed?.recomendaciones_ejecutivas || parsed.recomendaciones_ejecutivas.length === 0) && (
                                <p className="text-sm text-slate-500">Sin recomendaciones registradas.</p>
                            )}
                        </div>
                    </Section>

                    <p className="pb-6 text-center text-xs text-slate-400">
                        Generado por Apple Boss Intelligence · Claude Opus 5.5 · {emptyText(report.generated_at)}
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}

/* ═════════════════ Gráficos SVG ═════════════════ */

function BarsSVG({ rows, color = NAVY, accent = LIMA, unitBars = false }) {
    const uid = useId().replace(/[:]/g, "");
    const gid = `bars-${uid}`;
    const data = (rows || []).filter((r) => r && (r.value || r.value === 0));
    if (!data.length) return <p className="text-sm text-slate-500">Sin datos suficientes.</p>;

    const max = Math.max(1, ...data.map((r) => Math.abs(r.value) || 0));
    const W = 480, rowH = 44, padT = 10, labelW = 176, barX = 184, rightPad = 70;
    const barMax = W - barX - rightPad;
    const H = padT * 2 + data.length * rowH;

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" className="overflow-visible">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={accent} />
                </linearGradient>
            </defs>
            {data.map((r, i) => {
                const cy = padT + i * rowH + rowH / 2;
                const w = Math.max(5, (Math.abs(r.value) / max) * barMax);
                return (
                    <g key={i}>
                        <text x={labelW} y={r.sub ? cy - 7 : cy} textAnchor="end" dominantBaseline="middle"
                            fontSize="13.5" fontWeight="700" fill="#1f2937">{trunc(r.label, 22)}</text>
                        {r.sub && (
                            <text x={labelW} y={cy + 8} textAnchor="end" dominantBaseline="middle"
                                fontSize="10.5" fontWeight="600" fill="#94a3b8">{trunc(r.sub, 28)}</text>
                        )}
                        <rect x={barX} y={cy - 9} width={barMax} height="18" rx="9" fill="#eef1f6" />
                        <motion.rect x={barX} y={cy - 9} height="18" rx="9" fill={`url(#${gid})`}
                            initial={{ width: 0 }} whileInView={{ width: w }} viewport={{ once: true }}
                            transition={{ duration: 0.9, delay: i * 0.06, ease: "easeOut" }} />
                        <text x={W} y={cy} textAnchor="end" dominantBaseline="middle"
                            fontSize="12.5" fontWeight="800" fill={color}>{r.right}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function Gauge({ value = 0, label = "Margen global" }) {
    const uid = useId().replace(/[:]/g, "");
    const gid = `gauge-${uid}`;
    const r = 54, C = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, Number(value) || 0)) / 100;
    return (
        <svg viewBox="0 0 150 150" width="176" height="176" className="overflow-visible">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={NAVY} />
                    <stop offset="100%" stopColor={LIMA} />
                </linearGradient>
            </defs>
            <circle cx="75" cy="75" r={r} fill="none" stroke="#eef1f6" strokeWidth="15" />
            <motion.circle cx="75" cy="75" r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="15"
                strokeLinecap="round" strokeDasharray={C} transform="rotate(-90 75 75)"
                initial={{ strokeDashoffset: C }} whileInView={{ strokeDashoffset: C * (1 - pct) }}
                viewport={{ once: true }} transition={{ duration: 1.1, ease: "easeOut" }} />
            <text x="75" y="72" textAnchor="middle" fontSize="30" fontWeight="800" fill={NAVY}>
                {Number(value || 0).toLocaleString("es-BO", { maximumFractionDigits: 1 })}%
            </text>
            <text x="75" y="94" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#94a3b8">{label}</text>
        </svg>
    );
}

function AppleMark({ size = 56 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" className="shrink-0">
            <path d="M60 36 Q80 20 85 38 Q64 46 60 36 Z" fill={LIMA} />
            <path d="M60 44 C65 35 74 33 80 37 C86 41 90 47 91 55 A 8.5 8.5 0 0 0 91 72 C90 84 80 98 69 98 C65 98 62 96 60 95 C58 96 55 98 51 98 C40 98 28 83 28 66 C27 54 31 42 40 37 C46 33 55 35 60 44 Z"
                fill="#fff" />
        </svg>
    );
}

function TrendIcon({ dir }) {
    const color = dir === "up" ? "#059669" : dir === "down" ? "#e11d48" : "#64748b";
    const d = dir === "up" ? "M4 17 L11 10 L15 14 L21 7" : dir === "down" ? "M4 7 L11 14 L15 10 L21 17" : "M4 12 H20";
    const head = dir === "up" ? "M16 7 H21 V12" : dir === "down" ? "M16 17 H21 V12" : "";
    return (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${color}1a` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />{head && <path d={head} />}
            </svg>
        </span>
    );
}

function AlertIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 L22 20 H2 Z" /><path d="M12 10 V14" /><circle cx="12" cy="17.2" r="0.6" fill="#e11d48" stroke="none" />
        </svg>
    );
}

function SparkIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="mt-0.5 shrink-0">
            <path d="M12 2 l1.8 4.6 4.6 1.8 -4.6 1.8 L12 15 l-1.8-4.8 L5.6 8.4 l4.6-1.8 Z" fill="#059669" />
            <path d="M19 13 l0.9 2.3 2.3 0.9 -2.3 0.9 L19 19.4 l-0.9-2.4 L15.8 16.2 l2.3-0.9 Z" fill="#34d399" />
        </svg>
    );
}

/* ═════════════════ Tarjetas / helpers ═════════════════ */

function MetricCard({ title, value, tone, icon }) {
    const tones = {
        navy: { bg: "bg-indigo-50", fg: "text-indigo-700" },
        lima: { bg: "bg-lime-50", fg: "text-lime-700" },
        teal: { bg: "bg-teal-50", fg: "text-teal-700" },
        sky: { bg: "bg-sky-50", fg: "text-sky-700" },
    };
    const t = tones[tone] || tones.navy;
    return (
        <div className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-slate-200/70">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${t.bg} ${t.fg}`}>
                <CardIcon kind={icon} />{title}
            </div>
            <div className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{value}</div>
        </div>
    );
}

function CardIcon({ kind }) {
    const p = {
        cash: "M3 7 H21 V17 H3 Z M7 12 h.01 M17 12 h.01",
        up: "M4 17 L10 11 L14 15 L20 8 M15 8 H20 V13",
        wallet: "M3 7 H19 a2 2 0 0 1 2 2 V17 H5 a2 2 0 0 1-2-2 Z M16 12 h.01",
        pie: "M12 3 a9 9 0 1 0 9 9 H12 Z",
    }[kind] || "M4 12 H20";
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={p} />
        </svg>
    );
}

function HeaderChip({ label, value }) {
    return (
        <div className="rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/20 backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-lime-200">{label}</div>
            <div className="mt-0.5 text-sm font-bold text-white">{value}</div>
        </div>
    );
}

function KpiChip({ label, value }) {
    return (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
            <div className="mt-1 text-base font-extrabold" style={{ color: NAVY }}>{value}</div>
        </div>
    );
}

function Section({ title, subtitle, children }) {
    return (
        <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-slate-200/70 sm:p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
                {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
            </div>
            {children}
        </section>
    );
}

function AnalysisBlock({ data }) {
    if (!data || typeof data !== "object") {
        return <p className="text-sm text-slate-500">No hay información analítica disponible para esta sección.</p>;
    }
    const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null);
    return (
        <div className="space-y-4">
            {entries.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labelFor(key)}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-700">{renderValue(key, value)}</div>
                </div>
            ))}
        </div>
    );
}

function renderValue(key, value) {
    if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-slate-400">Sin registro suficiente</span>;
        if (typeof value[0] === "object" && value[0] !== null) {
            return (
                <div className="space-y-2">
                    {value.map((item, index) => (
                        <div key={`${key}-${index}`} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                            <div className="font-medium text-slate-900">
                                {emptyText(item.valor || item.producto || item.nombre || item.categoria)}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                {item.unidades !== undefined ? <span>Unidades: {item.unidades}</span> : null}
                                {item.ingresos !== undefined ? <span>Ingresos: {formatBs(item.ingresos)}</span> : null}
                                {item.utilidad !== undefined ? <span>Utilidad: {formatBs(item.utilidad)}</span> : null}
                                {item.margen_pct !== undefined ? <span>Margen: {formatPercent(item.margen_pct)}</span> : null}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
        return (
            <div className="grid gap-2">
                {Object.entries(value).map(([childKey, childValue]) => (
                    <div key={childKey} className="flex flex-wrap gap-2">
                        <span className="font-medium text-slate-800">{labelFor(childKey)}:</span>
                        <span>{formatFieldValue(childKey, childValue)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return formatFieldValue(key, value);
}

function formatFieldValue(key, value) {
    if (value === "" || value === null || value === undefined) {
        return <span className="text-slate-400">Sin registro suficiente</span>;
    }
    if (typeof value === "number") {
        if (CURRENCY_KEYS.has(key)) return formatBs(value);
        if (PERCENT_KEYS.has(key)) return formatPercent(value);
    }
    if (typeof value === "string" && value.trim().toUpperCase() === "N/A") {
        return <span className="text-slate-400">Sin registro suficiente</span>;
    }
    return value;
}

function InfoPill({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
        </div>
    );
}

function RiskBadge({ value }) {
    const tones = { ALTO: "bg-rose-100 text-rose-700", MEDIO: "bg-amber-100 text-amber-700", BAJO: "bg-emerald-100 text-emerald-700" };
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[value] || "bg-slate-100 text-slate-700"}`}>{emptyText(value)}</span>;
}

function PriorityBadge({ value }) {
    const tones = { ALTA: "bg-rose-100 text-rose-700", MEDIA: "bg-amber-100 text-amber-700", BAJA: "bg-emerald-100 text-emerald-700" };
    return <span className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-semibold ${tones[value] || "bg-slate-100 text-slate-700"}`}>{emptyText(value)}</span>;
}

function humanize(value) {
    return String(value || "").replace(/_/g, " ").trim();
}

function catLabel(k) {
    return CAT_LABELS[String(k || "").toLowerCase()] || humanize(k);
}

function trunc(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function num(n) {
    return Number(n || 0).toLocaleString("es-BO", { maximumFractionDigits: 0 });
}

function labelFor(key) {
    return LABELS[key] || humanize(key);
}

function emptyText(value) {
    if (value === null || value === undefined || value === "") return "Sin registro suficiente";
    if (typeof value === "string" && value.trim().toUpperCase() === "N/A") return "Sin registro suficiente";
    return value;
}

function formatBs(value) {
    return `Bs ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function bsK(value) {
    const n = Number(value || 0);
    const a = Math.abs(n);
    if (a >= 1e6) return `Bs ${(n / 1e6).toFixed(2).replace(".", ",")}M`;
    if (a >= 1e3) return `Bs ${(n / 1e3).toFixed(1).replace(".", ",")}k`;
    return `Bs ${n.toFixed(0)}`;
}

function formatPercent(value) {
    return `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

function formatPeriod(start, end) {
    if (!start && !end) return "Histórico completo";
    if (start && end) return start === end ? start : `${start} a ${end}`;
    return start || end;
}
