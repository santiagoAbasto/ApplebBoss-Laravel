import AdminLayout from '@/Layouts/AdminLayout';
import ServiciosForm from '@/Components/Panel/ServiciosForm';

export default function Edit({ servicio, tecnicos = [], marcas = [], especialidades = [], revision = [] }) {
  return (
    <ServiciosForm servicio={servicio} tecnicos={tecnicos} marcas={marcas} especialidades={especialidades} revision={revision}
      Layout={AdminLayout} prefijo="admin" />
  );
}
