import VendedorLayout from '@/Layouts/VendedorLayout';
import ServiciosForm from '@/Components/Panel/ServiciosForm';

export default function Create({ tecnicos = [], marcas = [], especialidades = [], revision = [] }) {
  return (
    <ServiciosForm tecnicos={tecnicos} marcas={marcas} especialidades={especialidades} revision={revision}
      Layout={VendedorLayout} prefijo="vendedor" />
  );
}
