import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import ToastContainer, { showError, showSuccess } from "@/Components/ToastNotification";
import InventoryTable from "@/Components/InventoryTable";
import { useAutoRefresh } from "@/Hooks/useAutoRefresh";
import { Plus, Search, Smartphone } from "lucide-react";
import {
  CrudButtonDanger,
  CrudButtonPrimary,
  CrudButtonSecondary,
  CrudCard,
  CrudHeader,
  CrudSectionTitle,
  CrudSubtitle,
  CrudTitle,
  CrudWrapper,
} from "@/Components/CrudUI";

export default function CelularesIndex({ celulares = [] }) {
  const [busqueda, setBusqueda] = useState("");
  useAutoRefresh(["celulares"]);

  const resumen = useMemo(() => {
    const disponibles = celulares.filter((c) => c.estado === "disponible").length;
    return {
      total: celulares.length,
      disponibles,
      noDisponibles: Math.max(0, celulares.length - disponibles),
    };
  }, [celulares]);

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
            <CrudSubtitle>Disponibles primero, ordenados por familia de iPhone y detalle comercial.</CrudSubtitle>
          </div>

          <CrudButtonPrimary as={Link} href={route("admin.celulares.create")} className="w-full justify-center sm:w-auto">
            <Plus size={18} />
            Registrar celular
          </CrudButtonPrimary>
        </CrudHeader>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-950">{resumen.total}</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-600">Disponibles</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">{resumen.disponibles}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">No disponibles</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-700">{resumen.noDisponibles}</p>
          </div>
        </div>

        <CrudCard style={{ marginBottom: 14, padding: 14 }}>
          <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Buscar inventario
          </label>
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Modelo, IMEI, capacidad, color o estado"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CrudCard>

        <CrudCard style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <CrudSectionTitle style={{ margin: 0 }}>Listado de celulares</CrudSectionTitle>
            <span className="text-xs font-semibold text-slate-500">
              {filtrados.length} resultado{filtrados.length === 1 ? "" : "s"}
            </span>
          </div>

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
