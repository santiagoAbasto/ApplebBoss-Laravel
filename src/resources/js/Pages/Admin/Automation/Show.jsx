import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { useMemo, useEffect } from "react";
import axios from "axios";
import { route } from "ziggy-js";

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
            axios.post(route("admin.automation.markViewed", report.id))
                .catch(() => {});
        }
    }, []);

    if (!parsed) {
        return (
            <AdminLayout>
                <div className="p-10 text-red-500">
                    Error procesando reporte.
                </div>
            </AdminLayout>
        );
    }

    const resumen = parsed?.resumen_ejecutivo ?? {};

    const formatBs = (n) =>
        `Bs ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const crecimiento = resumen?.crecimiento_mensual_pct;

    return (
        <AdminLayout>
            <Head title="AppleBoss Intelligence" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">

                {/* HEADER */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-800">
                        🧠 AppleBoss Intelligence
                    </h1>
                </div>

                {/* MÉTRICAS PRINCIPALES */}
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                    <MetricCard title="Facturación Total" value={formatBs(resumen.facturacion_total)} color="indigo" />
                    <MetricCard title="Utilidad Total" value={formatBs(resumen.utilidad_total)} color="green" />
                    <MetricCard title="Utilidad Disponible" value={formatBs(resumen.utilidad_disponible)} color="emerald" />
                    <MetricCard title="Margen Global" value={`${resumen.margen_global_pct || 0}%`} color="sky" />
                </div>

                {/* CRECIMIENTO */}
                <Section title="Crecimiento Mensual">
                    <div className={`p-6 rounded-xl ${
                        crecimiento > 0 ? "bg-green-50 border border-green-200"
                        : crecimiento < 0 ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 border"
                    }`}>
                        <div className="text-xl font-semibold">
                            {crecimiento !== null ? `${crecimiento}%` : "N/A"}
                        </div>
                    </div>
                </Section>

                {/* ANALISIS POR CATEGORIA */}
                <Section title="Análisis por Categoría">
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {parsed?.analisis_por_categoria?.map((cat, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow">
                                <h3 className="font-semibold capitalize mb-2">
                                    {cat.categoria.replace(/_/g, " ")}
                                </h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>Ingresos: {formatBs(cat.ingresos)}</div>
                                    <div>Utilidad: {formatBs(cat.utilidad)}</div>
                                    <div>Margen: {cat.margen_promedio_pct}%</div>
                                    <div>
                                        Riesgo:
                                        <span className={`ml-2 font-semibold ${
                                            cat.nivel_riesgo === "ALTO"
                                                ? "text-red-600"
                                                : cat.nivel_riesgo === "MEDIO"
                                                ? "text-yellow-600"
                                                : "text-green-600"
                                        }`}>
                                            {cat.nivel_riesgo}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ANALISIS CELULARES */}
                <Section title="Análisis Celulares">
                    <AnalysisBlock data={parsed?.analisis_celulares} />
                </Section>

                {/* ANALISIS COMPUTADORAS */}
                <Section title="Análisis Computadoras">
                    <AnalysisBlock data={parsed?.analisis_computadoras} />
                </Section>

                {/* ANALISIS ACCESORIOS */}
                <Section title="Análisis Accesorios">
                    <AnalysisBlock data={parsed?.analisis_accesorios} />
                </Section>

                {/* RIESGOS */}
                <Section title="Riesgos Estratégicos">
                    {parsed?.riesgos_estrategicos?.map((r, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 p-5 rounded-xl mb-4">
                            <div className="font-semibold text-red-700">{r.tipo}</div>
                            <div className="text-sm mt-1">{r.descripcion}</div>
                            <div className="text-xs text-red-600 mt-2">{r.impacto}</div>
                        </div>
                    ))}
                </Section>

                {/* OPORTUNIDADES */}
                <Section title="Oportunidades">
                    {parsed?.oportunidades?.map((o, i) => (
                        <div key={i} className="bg-green-50 border border-green-200 p-5 rounded-xl mb-4">
                            <div className="text-sm">{o.descripcion}</div>
                            <div className="text-xs text-green-600 mt-2">{o.impacto_estimado}</div>
                        </div>
                    ))}
                </Section>

                {/* RECOMENDACIONES */}
                <Section title="Recomendaciones Ejecutivas">
                    {parsed?.recomendaciones_ejecutivas?.map((r, i) => (
                        <div key={i} className="bg-white border p-5 rounded-xl shadow-sm mb-4 flex justify-between">
                            <div className="text-sm">{r.accion}</div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                r.prioridad === "ALTA"
                                    ? "bg-red-100 text-red-700"
                                    : r.prioridad === "MEDIA"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                            }`}>
                                {r.prioridad}
                            </span>
                        </div>
                    ))}
                </Section>

            </div>
        </AdminLayout>
    );
}

/* COMPONENTES */

function MetricCard({ title, value, color }) {
    const colors = {
        indigo: "bg-indigo-100 text-indigo-700",
        green: "bg-green-100 text-green-700",
        emerald: "bg-emerald-100 text-emerald-700",
        sky: "bg-sky-100 text-sky-700",
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-md">
            <div className={`inline-block px-3 py-1 text-xs rounded-full mb-4 ${colors[color]}`}>
                {title}
            </div>
            <div className="text-2xl font-bold text-gray-800">
                {value}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-12">
            <h2 className="text-2xl font-semibold mb-6">{title}</h2>
            {children}
        </div>
    );
}

function AnalysisBlock({ data }) {
    if (!data) return <div className="text-gray-400">Sin datos suficientes.</div>;

    return (
        <div className="text-sm text-gray-700 space-y-2">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <strong>{key.replace(/_/g, " ")}:</strong>{" "}
                    {Array.isArray(value)
                        ? value.length > 0 ? value.join(", ") : "N/A"
                        : value ?? "N/A"}
                </div>
            ))}
        </div>
    );
}