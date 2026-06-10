import AdminLayout from "@/Layouts/AdminLayout";
import ReservaIndex from '@/Components/ReservaIndex';

export default function Index({ reservas }) {
  return <ReservaIndex reservas={reservas} role="admin" Layout={AdminLayout} />;
}
