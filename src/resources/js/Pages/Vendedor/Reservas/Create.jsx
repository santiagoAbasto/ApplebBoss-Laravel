import VendedorLayout from "@/Layouts/VendedorLayout";
import ReservaForm from '@/Components/ReservaForm';

export default function Create() {
  return <ReservaForm role="vendedor" Layout={VendedorLayout} />;
}
