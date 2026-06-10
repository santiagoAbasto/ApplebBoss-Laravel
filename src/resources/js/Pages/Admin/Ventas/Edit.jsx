import AdminLayout from '@/Layouts/AdminLayout';
import VentaEditForm from '@/Components/VentaEditForm';

export default function Edit({ venta, productosGenerales = [] }) {
  return (
    <AdminLayout>
      <VentaEditForm venta={venta} productosGenerales={productosGenerales} routePrefix="admin" accent="blue" />
    </AdminLayout>
  );
}
