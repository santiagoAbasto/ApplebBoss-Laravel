import AdminLayout from '@/Layouts/AdminLayout';

export default function Dashboard() {
  return (
    <AdminLayout>
      <h1 className="h3 mb-4 text-gray-800">Bienvenido al Panel del Administrador</h1>
      <p>Desde aquí puedes controlar productos, reportes y usuarios.</p>
    </AdminLayout>
  );
}
