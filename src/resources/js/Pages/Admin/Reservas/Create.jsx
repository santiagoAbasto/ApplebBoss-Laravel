import AdminLayout from "@/Layouts/AdminLayout";
import ReservaForm from '@/Components/ReservaForm';

export default function Create() {
  return <ReservaForm role="admin" Layout={AdminLayout} />;
}
