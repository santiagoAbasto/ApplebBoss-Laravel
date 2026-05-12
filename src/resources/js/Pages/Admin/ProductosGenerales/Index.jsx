import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import ToastContainer, { showError, showSuccess } from "@/Components/ToastNotification";
import InventoryTable from "@/Components/InventoryTable";
import { Package, Plus } from "lucide-react";
import {
  CrudButtonDanger,
  CrudButtonPrimary,
  CrudButtonSecondary,
  CrudCard,
  CrudHeader,
  CrudInput,
  CrudSectionTitle,
  CrudSubtitle,
  CrudTitle,
  CrudWrapper,
} from "@/Components/CrudUI";

export default function ProductosGeneralesIndex({ productos = [] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const source = q ? productos : productos.slice(0, 25);

    if (!q) return source;

    return source.filter((p) =>
      [p.codigo, p.tipo, p.nombre, p.procedencia, p.estado].some((value) =>
        String(value || "").toLowerCase().includes(q)
      )
    );
  }, [busqueda, productos]);

  const eliminar = (id) => {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
      router.delete(route("admin.productos-generales.destroy", id), {
        onSuccess: () => showSuccess("Producto eliminado correctamente"),
        onError: () => showError("Error al eliminar el producto"),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm("¿Deseas habilitar este producto para la venta?")) {
      router.patch(route("admin.productos-generales.habilitar", id), {
        onSuccess: () => showSuccess("Producto habilitado con éxito"),
        onError: () => showError("Error al habilitar el producto"),
      });
    }
  };

  return (
    <AdminLayout>
      <Head title="Productos Generales" />

      <CrudWrapper>
        <CrudHeader>
          <div>
            <CrudTitle>
              <Package size={22} />
              Productos Generales
            </CrudTitle>
            <CrudSubtitle>Accesorios, repuestos y productos sin IMEI</CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route("admin.productos-generales.create")}>
            <Plus size={18} />
            Registrar producto
          </CrudButtonPrimary>
        </CrudHeader>

        <CrudCard style={{ marginBottom: 14, padding: 14 }}>
          <CrudInput
            placeholder="Buscar por código, tipo, nombre o estado"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
            Sin búsqueda se muestran los primeros 25 productos ordenados por disponibilidad.
          </p>
        </CrudCard>

        <CrudCard style={{ padding: 0, overflow: "hidden" }}>
          <CrudSectionTitle style={{ padding: "16px 20px 0" }}>
            Listado de productos
          </CrudSectionTitle>

          <InventoryTable
            items={filtrados}
            type="productosGenerales"
            emptyMessage="No se encontraron productos con esa búsqueda."
            actionsRenderer={(producto) => (
              <>
                {producto.estado === "permuta" ? (
                  <CrudButtonSecondary type="button" onClick={() => habilitar(producto.id)}>
                    Habilitar
                  </CrudButtonSecondary>
                ) : (
                  <CrudButtonSecondary
                    as={Link}
                    href={route("admin.productos-generales.edit", producto.id)}
                  >
                    Editar
                  </CrudButtonSecondary>
                )}

                <CrudButtonDanger type="button" onClick={() => eliminar(producto.id)}>
                  Eliminar
                </CrudButtonDanger>
              </>
            )}
          />
        </CrudCard>
      </CrudWrapper>

      <ToastContainer />
    </AdminLayout>
  );
}
