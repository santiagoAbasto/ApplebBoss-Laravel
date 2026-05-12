import AdminLayout from '@/Layouts/AdminLayout';
import VentaEditForm from '@/Components/VentaEditForm';

export default function Edit({ venta }) {
  return (
    <AdminLayout>
      <VentaEditForm venta={venta} routePrefix="admin" accent="blue" />
    </AdminLayout>
  );
}
