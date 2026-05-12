import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import ToastContainer, { showError, showSuccess } from "@/Components/ToastNotification";
import InventoryTable from "@/Components/InventoryTable";
import { Apple, Plus } from "lucide-react";
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

export default function ProductosAppleIndex({ productos = [] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;

    return productos.filter((p) =>
      [
        p.modelo,
        p.capacidad,
        p.color,
        p.imei_1,
        p.imei_2,
        p.numero_serie,
        p.estado,
      ].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [busqueda, productos]);

  const eliminar = (id) => {
    if (confirm("¿Deseas eliminar este producto Apple?")) {
      router.delete(route("admin.productos-apple.destroy", id), {
        onSuccess: () => showSuccess("Producto eliminado correctamente"),
        onError: () => showError("Error al eliminar el producto"),
      });
    }
  };

  return (
    <AdminLayout>
      <Head title="Productos Apple" />

      <CrudWrapper>
        <CrudHeader>
          <div>
            <CrudTitle>
              <Apple size={22} />
              Productos Apple
            </CrudTitle>
            <CrudSubtitle>Gestión de inventario de productos Apple</CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route("admin.productos-apple.create")}>
            <Plus size={18} />
            Registrar producto
          </CrudButtonPrimary>
        </CrudHeader>

        <CrudCard style={{ marginBottom: 14, padding: 14 }}>
          <CrudInput
            placeholder="Buscar por modelo, IMEI, serie o estado"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </CrudCard>

        <CrudCard style={{ padding: 0, overflow: "hidden" }}>
          <CrudSectionTitle style={{ padding: "16px 20px 0" }}>
            Listado de productos Apple
          </CrudSectionTitle>

          <InventoryTable
            items={filtrados}
            type="productosApple"
            emptyMessage="No se encontraron productos Apple con esa búsqueda."
            actionsRenderer={(producto) => (
              <>
                <CrudButtonSecondary
                  as={Link}
                  href={route("admin.productos-apple.edit", producto.id)}
                >
                  Editar
                </CrudButtonSecondary>

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
