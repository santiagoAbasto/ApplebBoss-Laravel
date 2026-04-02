import { Head, useForm, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "@/Layouts/AdminLayout";
import { Package } from "lucide-react";

import {
    CrudWrapper,
    CrudHeader,
    CrudTitle,
    CrudSubtitle,
    CrudBackLink,
    CrudCard,
    CrudSectionTitle,
    CrudGrid,
    CrudLabel,
    CrudInput,
    CrudSelect,
    CrudActions,
    CrudButtonPrimary,
    CrudButtonSecondary,
} from "@/Components/CrudUI";

export default function CreateProductoGeneral() {
    const [showModal, setShowModal] = useState(false);
    const [codigoExiste, setCodigoExiste] = useState(false);
    const [checkingCodigo, setCheckingCodigo] = useState(false);

    const { data, setData, post, processing } = useForm({
        codigo: "",
        tipo: "",
        nombre: "",
        procedencia: "",
        precio_costo: "",
        precio_venta: "",
        estado: "disponible",
    });

    const codigoPreview = data.codigo
        ? data.codigo.toUpperCase()
        : "SIN CÓDIGO";

    /* =========================================
       VERIFICACIÓN EN TIEMPO REAL
    ========================================= */
    useEffect(() => {
        if (!data.codigo.trim()) {
            setCodigoExiste(false);
            return;
        }

        const controller = new AbortController();

        const debounce = setTimeout(async () => {
            try {
                setCheckingCodigo(true);

                const response = await axios.get(
                    route("admin.productos-generales.verificar-codigo"),
                    {
                        params: { codigo: data.codigo.trim() },
                        signal: controller.signal,
                        headers: { Accept: "application/json" },
                        cache: "no-store",
                    },
                );

                setCodigoExiste(response.data.existe);
            } catch (error) {
                if (error.name !== "CanceledError") {
                    console.error(error);
                }
            } finally {
                setCheckingCodigo(false);
            }
        }, 300);

        return () => {
            clearTimeout(debounce);
            controller.abort();
        };
    }, [data.codigo]);

    /* =========================================
       SUBMIT CONTROLADO (SIN TRABARSE)
    ========================================= */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (processing || checkingCodigo) return;

        // 🔴 SI EXISTE → NO MOSTRAR MODAL
        if (codigoExiste) {
            return;
        }

        // 🔥 DOBLE VERIFICACIÓN BACKEND JUSTO ANTES
        try {
            const response = await axios.get(
                route("admin.productos-generales.verificar-codigo"),
                {
                    params: { codigo: data.codigo.trim() },
                    headers: { Accept: "application/json" },
                    cache: "no-store",
                },
            );

            if (response.data.existe) {
                setCodigoExiste(true);
                return; // NO modal
            }
        } catch (error) {
            console.error(error);
            return;
        }

        // 🟢 SOLO SI TODO ESTÁ OK
        setShowModal(true);
    };

    /* =========================================
       GUARDAR
    ========================================= */
    const guardarProducto = (duplicar) => {
        post(route("admin.productos-generales.store"), {
            preserveScroll: true,

            onSuccess: () => {
                if (duplicar) {
                    setData("codigo", "");
                    setShowModal(false);
                } else {
                    router.visit(route("admin.productos-generales.index"));
                }
            },

            onError: () => {
                setCodigoExiste(true);
                setShowModal(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Registrar Producto General" />

            <CrudWrapper>
                <CrudHeader>
                    <div>
                        <CrudTitle>
                            <Package size={22} />
                            Registrar Producto General
                        </CrudTitle>
                        <CrudSubtitle>
                            Registro de accesorios y productos generales
                        </CrudSubtitle>
                    </div>

                    <CrudBackLink
                        as={Link}
                        href={route("admin.productos-generales.index")}
                    >
                        ← Volver
                    </CrudBackLink>
                </CrudHeader>

                <CrudCard>
                    <form onSubmit={handleSubmit}>
                        <CrudSectionTitle>
                            Información del producto
                        </CrudSectionTitle>

                        <CrudGrid>
                            <div>
                                <CrudLabel>Código</CrudLabel>

                                <CrudInput
                                    value={data.codigo}
                                    onChange={(e) =>
                                        setData(
                                            "codigo",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    disabled={processing}
                                    placeholder="Ej: FUNDA-XR-001"
                                    style={{
                                        border: codigoExiste
                                            ? "2px solid #dc2626"
                                            : data.codigo && !checkingCodigo
                                              ? "2px solid #16a34a"
                                              : undefined,
                                        background: codigoExiste
                                            ? "#fef2f2"
                                            : undefined,
                                    }}
                                />

                                {checkingCodigo && (
                                    <small style={{ color: "#64748b" }}>
                                        Verificando código...
                                    </small>
                                )}

                                {codigoExiste && (
                                    <div style={errorBox}>
                                        ⚠ Este código ya está registrado.
                                        Corrige el código para continuar.
                                    </div>
                                )}

                                {!codigoExiste &&
                                    data.codigo &&
                                    !checkingCodigo && (
                                        <small
                                            style={{
                                                color: "#16a34a",
                                                fontWeight: 600,
                                            }}
                                        >
                                            ✓ Código disponible
                                        </small>
                                    )}

                                <div style={previewBox}>
                                    Código final:{" "}
                                    <span style={{ color: "#2563eb" }}>
                                        {codigoPreview}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <CrudLabel>Tipo</CrudLabel>
                                <CrudSelect
                                    value={data.tipo}
                                    onChange={(e) =>
                                        setData("tipo", e.target.value)
                                    }
                                >
                                    <option value="">-- Selecciona --</option>
                                    <option value="vidrio_templado">
                                        Vidrio Templado
                                    </option>
                                    <option value="vidrio_camara">
                                        Vidrio de Cámara
                                    </option>
                                    <option value="funda">Funda</option>
                                    <option value="accesorio">Accesorio</option>
                                    <option value="cargador_5w">
                                        Cargador 5W
                                    </option>
                                    <option value="cargador_20w">
                                        Cargador 20W
                                    </option>
                                    <option value="otro">Otros</option>
                                </CrudSelect>
                            </div>

                            <div>
                                <CrudLabel>Nombre</CrudLabel>
                                <CrudInput
                                    value={data.nombre}
                                    onChange={(e) =>
                                        setData("nombre", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <CrudLabel>Procedencia</CrudLabel>
                                <CrudInput
                                    value={data.procedencia}
                                    onChange={(e) =>
                                        setData("procedencia", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <CrudLabel>Precio de costo</CrudLabel>
                                <CrudInput
                                    type="number"
                                    value={data.precio_costo}
                                    onChange={(e) =>
                                        setData("precio_costo", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <CrudLabel>Precio de venta</CrudLabel>
                                <CrudInput
                                    type="number"
                                    value={data.precio_venta}
                                    onChange={(e) =>
                                        setData("precio_venta", e.target.value)
                                    }
                                />
                            </div>
                        </CrudGrid>

                        <CrudActions>
                            <CrudButtonSecondary
                                as={Link}
                                href={route("admin.productos-generales.index")}
                                type="button"
                                disabled={codigoExiste}
                                style={{
                                    opacity: codigoExiste ? 0.4 : 1,
                                    pointerEvents: codigoExiste
                                        ? "none"
                                        : "auto",
                                    cursor: codigoExiste
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                Cancelar
                            </CrudButtonSecondary>

                            <CrudButtonPrimary
                                type="submit"
                                disabled={
                                    processing || checkingCodigo || codigoExiste
                                }
                                style={{
                                    opacity: codigoExiste ? 0.4 : 1,
                                    pointerEvents: codigoExiste
                                        ? "none"
                                        : "auto",
                                    cursor: codigoExiste
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                Guardar producto
                            </CrudButtonPrimary>
                        </CrudActions>
                    </form>
                </CrudCard>
            </CrudWrapper>

            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <h3>
                            ¿Deseas registrar el mismo producto con otro código?
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <button
                                onClick={() => guardarProducto(false)}
                                style={btnSecondary}
                            >
                                Guardar y salir
                            </button>

                            <button
                                onClick={() => guardarProducto(true)}
                                style={btnPrimary}
                            >
                                Guardar y duplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

/* ESTILOS */

const errorBox = {
    marginTop: 8,
    padding: "8px 12px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    color: "#991b1b",
    fontWeight: 600,
    fontSize: 13,
};

const previewBox = {
    marginTop: 10,
    padding: "8px 12px",
    background: "#f1f5f9",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid #e2e8f0",
};

const modalOverlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
};

const modalBox = {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    width: 420,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
};

const btnPrimary = {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
};

const btnSecondary = {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
};