import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import ToastContainer, { showError, showSuccess } from "@/Components/ToastNotification";
import InventoryTable from "@/Components/InventoryTable";
import { Laptop, Plus } from "lucide-react";
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

export default function ComputadorasIndex({ computadoras = [] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return computadoras;

    return computadoras.filter((pc) =>
      [
        pc.nombre,
        pc.procesador,
        pc.numero_serie,
        pc.ram,
        pc.almacenamiento,
        pc.estado,
      ].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [busqueda, computadoras]);

  const eliminar = (id) => {
    if (confirm("¿Seguro que deseas eliminar esta computadora?")) {
      router.delete(route("admin.computadoras.destroy", id), {
        onSuccess: () => showSuccess("Computadora eliminada correctamente"),
        onError: () => showError("Error al eliminar la computadora"),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm("¿Deseas habilitar esta computadora para la venta?")) {
      router.patch(route("admin.computadoras.habilitar", id), {
        onSuccess: () => showSuccess("Computadora habilitada con éxito"),
        onError: () => showError("Error al habilitar la computadora"),
      });
    }
  };

  return (
    <AdminLayout>
      <Head title="Computadoras" />

      <CrudWrapper>
        <CrudHeader>
          <div>
            <CrudTitle>
              <Laptop size={22} />
              Computadoras
            </CrudTitle>
            <CrudSubtitle>Gestión de inventario de computadoras</CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route("admin.computadoras.create")}>
            <Plus size={18} />
            Registrar computadora
          </CrudButtonPrimary>
        </CrudHeader>

        <CrudCard style={{ marginBottom: 14, padding: 14 }}>
          <CrudInput
            placeholder="Buscar por nombre, procesador, serie o estado"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </CrudCard>

        <CrudCard style={{ padding: 0, overflow: "hidden" }}>
          <CrudSectionTitle style={{ padding: "16px 20px 0" }}>
            Listado de computadoras
          </CrudSectionTitle>

          <InventoryTable
            items={filtradas}
            type="computadoras"
            emptyMessage="No se encontraron computadoras con esa búsqueda."
            actionsRenderer={(pc) => (
              <>
                {pc.estado === "permuta" ? (
                  <CrudButtonPrimary type="button" onClick={() => habilitar(pc.id)}>
                    Habilitar
                  </CrudButtonPrimary>
                ) : (
                  <CrudButtonSecondary as={Link} href={route("admin.computadoras.edit", pc.id)}>
                    Editar
                  </CrudButtonSecondary>
                )}

                <CrudButtonDanger type="button" onClick={() => eliminar(pc.id)}>
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
