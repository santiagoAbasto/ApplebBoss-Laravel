import { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import ToastContainer, {
    showSuccess,
    showError,
} from "@/Components/ToastNotification";
import { Smartphone, Plus } from "lucide-react";

import {
    CrudWrapper,
    CrudHeader,
    CrudTitle,
    CrudSubtitle,
    CrudCard,
    CrudSectionTitle,
    CrudInput,
    CrudButtonPrimary,
    CrudButtonSecondary,
    CrudButtonDanger,
} from "@/Components/CrudUI";

export default function CelularesIndex({ celulares }) {
    const [busqueda, setBusqueda] = useState("");

    /* ===============================
       ORDEN OFICIAL APPLE
    =============================== */
    const ORDEN_APPLE = [
        "iphone 7",
        "iphone 7 plus",
        "iphone 8",
        "iphone 8 plus",
        "iphone x",
        "iphone xr",
        "iphone xs",
        "iphone xs max",
        "iphone 11",
        "iphone 11 pro",
        "iphone 11 pro max",
        "iphone 12",
        "iphone 12 mini",
        "iphone 12 pro",
        "iphone 12 pro max",
        "iphone 13",
        "iphone 13 mini",
        "iphone 13 pro",
        "iphone 13 pro max",
        "iphone 14",
        "iphone 14 plus",
        "iphone 14 pro",
        "iphone 14 pro max",
        "iphone 15",
        "iphone 15 plus",
        "iphone 15 pro",
        "iphone 15 pro max",
        "iphone 16",
        "iphone 16 plus",
        "iphone 16 pro",
        "iphone 16 pro max",
        "iphone 17",
        "iphone 17 air",
        "iphone 17 pro",
        "iphone 17 pro max",
    ];

    const normalizar = (texto) =>
        texto?.toLowerCase().replace(/\s+/g, " ").trim();

    // 🔥 Normalizador profesional de capacidad
    const obtenerCapacidadOrden = (cap) => {
        if (!cap) return 999;

        const texto = cap.toString().toLowerCase().replace(/\s+/g, "");

        if (texto.includes("1tb")) return 1000;

        const numero = parseInt(texto.replace("gb", ""));
        return isNaN(numero) ? 999 : numero;
    };

    /* ===============================
       FILTRADO + ORDEN + AGRUPACIÓN
    =============================== */
    const celularesAgrupados = useMemo(() => {
        const disponibles = celulares
            .filter((c) => c.estado === "disponible")
            .filter((c) => {
                if (!busqueda) return true;
                return c.imei_1 === busqueda;
            });

        disponibles.sort((a, b) => {
            const modeloA = normalizar(a.modelo);
            const modeloB = normalizar(b.modelo);

            const indexA = ORDEN_APPLE.indexOf(modeloA);
            const indexB = ORDEN_APPLE.indexOf(modeloB);

            const ordenA = indexA === -1 ? 999 : indexA;
            const ordenB = indexB === -1 ? 999 : indexB;

            // 1️⃣ Orden por modelo oficial Apple
            if (ordenA !== ordenB) return ordenA - ordenB;

            // 2️⃣ Orden por capacidad numérica real
            const capA = obtenerCapacidadOrden(a.capacidad);
            const capB = obtenerCapacidadOrden(b.capacidad);

            if (capA !== capB) return capA - capB;

            // 3️⃣ Dentro de misma capacidad → batería menor a mayor
            const batA = parseInt(a.bateria) || 0;
            const batB = parseInt(b.bateria) || 0;

            return batA - batB;
        });

        // Agrupar por modelo
        const grupos = {};

        disponibles.forEach((c) => {
            const modeloBase = normalizar(c.modelo);

            if (!grupos[modeloBase]) {
                grupos[modeloBase] = [];
            }

            grupos[modeloBase].push(c);
        });

        return grupos;
    }, [celulares, busqueda]);

    /* ===============================
       ACTIONS
    =============================== */
    const eliminar = (id) => {
        if (confirm("¿Deseas eliminar este celular?")) {
            router.delete(route("admin.celulares.destroy", id), {
                onSuccess: () => showSuccess("Celular eliminado exitosamente"),
                onError: () =>
                    showError("Hubo un error al eliminar el celular"),
            });
        }
    };

    return (
        <AdminLayout>
            <Head title="Celulares" />

            <CrudWrapper>
                <CrudHeader>
                    <div>
                        <CrudTitle>
                            <Smartphone size={22} />
                            Celulares
                        </CrudTitle>
                        <CrudSubtitle>
                            Inventario ordenado por modelo, capacidad y batería
                        </CrudSubtitle>
                    </div>

                    <CrudButtonPrimary
                        as={Link}
                        href={route("admin.celulares.create")}
                    >
                        <Plus size={18} />
                        Registrar celular
                    </CrudButtonPrimary>
                </CrudHeader>

                <CrudInput
                    placeholder="Buscar IMEI exacto (15 dígitos)"
                    value={busqueda}
                    maxLength={15}
                    inputMode="numeric"
                    onChange={(e) => {
                        const onlyNumbers = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 15);
                        setBusqueda(onlyNumbers);
                    }}
                />

                {Object.entries(celularesAgrupados).map(([modelo, lista]) => (
                    <CrudCard key={modelo} style={{ marginTop: 20 }}>
                        <CrudSectionTitle>
                            {modelo.toUpperCase()} — Stock: {lista.length}
                        </CrudSectionTitle>

                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background: "#f1f5f9",
                                            textAlign: "left",
                                        }}
                                    >
                                        <th style={th}>Modelo</th>
                                        <th style={th}>Capacidad</th>
                                        <th style={th}>IMEI</th>
                                        <th style={th}>Batería</th>
                                        <th style={th}>Precio (Bs)</th>
                                        <th style={th}>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lista.map((c) => (
                                        <tr
                                            key={c.id}
                                            style={{
                                                borderTop:
                                                    "1px solid #e5e7eb",
                                            }}
                                        >
                                            <td style={td}>{c.modelo}</td>
                                            <td style={td}>
                                                {c.capacidad || "N/A"}
                                            </td>
                                            <td style={td}>{c.imei_1}</td>
                                            <td style={td}>
                                                {c.bateria || "N/A"}%
                                            </td>
                                            <td style={td}>
                                                Bs{" "}
                                                {parseFloat(
                                                    c.precio_venta
                                                ).toFixed(2)}
                                            </td>
                                            <td style={td}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <CrudButtonSecondary
                                                        as={Link}
                                                        href={route(
                                                            "admin.celulares.edit",
                                                            c.id
                                                        )}
                                                    >
                                                        Editar
                                                    </CrudButtonSecondary>

                                                    <CrudButtonDanger
                                                        type="button"
                                                        onClick={() =>
                                                            eliminar(c.id)
                                                        }
                                                    >
                                                        Eliminar
                                                    </CrudButtonDanger>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CrudCard>
                ))}
            </CrudWrapper>

            <ToastContainer />
        </AdminLayout>
    );
}

const th = {
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
};

const td = {
    padding: "12px 14px",
    fontSize: 14,
    color: "#334155",
};