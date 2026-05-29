import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import ToastContainer, { showError, showSuccess } from "@/Components/ToastNotification";
import InventoryTable from "@/Components/InventoryTable";
import { useAutoRefresh } from "@/Hooks/useAutoRefresh";
import { Plus, Smartphone } from "lucide-react";
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

export default function CelularesIndex({ celulares = [] }) {
  const [busqueda, setBusqueda] = useState("");
  useAutoRefresh(["celulares"]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return celulares;

    return celulares.filter((c) =>
      [
        c.modelo,
        c.capacidad,
        c.color,
        c.imei_1,
        c.imei_2,
        c.estado_imei,
        c.estado,
      ].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [busqueda, celulares]);

  const eliminar = (id) => {
    if (confirm("¿Deseas eliminar este celular?")) {
      router.delete(route("admin.celulares.destroy", id), {
        onSuccess: () => showSuccess("Celular eliminado exitosamente"),
        onError: () => showError("Hubo un error al eliminar el celular"),
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
            <CrudSubtitle>Inventario ordenado por disponibilidad y fecha</CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route("admin.celulares.create")}>
            <Plus size={18} />
            Registrar celular
          </CrudButtonPrimary>
        </CrudHeader>

        <CrudCard style={{ marginBottom: 14, padding: 14 }}>
          <CrudInput
            placeholder="Buscar por modelo, IMEI, capacidad o estado"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </CrudCard>

        <CrudCard style={{ padding: 0, overflow: "hidden" }}>
          <CrudSectionTitle style={{ padding: "16px 20px 0" }}>
            Listado de celulares
          </CrudSectionTitle>

          <InventoryTable
            items={filtrados}
            type="celulares"
            emptyMessage="No se encontraron celulares con esa búsqueda."
            actionsRenderer={(celular) => (
              <>
                <CrudButtonSecondary as={Link} href={route("admin.celulares.edit", celular.id)}>
                  Editar
                </CrudButtonSecondary>

                <CrudButtonDanger type="button" onClick={() => eliminar(celular.id)}>
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
