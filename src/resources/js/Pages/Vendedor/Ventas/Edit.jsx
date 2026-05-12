import VendedorLayout from '@/Layouts/VendedorLayout';
import VentaEditForm from '@/Components/VentaEditForm';

export default function Edit({ venta }) {
  return (
    <VendedorLayout>
      <VentaEditForm venta={venta} routePrefix="vendedor" accent="emerald" />
    </VendedorLayout>
  );
}
