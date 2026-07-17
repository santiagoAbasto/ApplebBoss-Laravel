import AdminLayout from '@/Layouts/AdminLayout';
import VentaEditForm from '@/Components/VentaEditForm';

export default function Edit({ venta, productosGenerales = [], inventarioEdicion = {} }) {
  return (
    <AdminLayout>
      <VentaEditForm venta={venta} productosGenerales={productosGenerales} inventarioEdicion={inventarioEdicion} routePrefix="admin" accent="blue" />
    </AdminLayout>
  );
}
