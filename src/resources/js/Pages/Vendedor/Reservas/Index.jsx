import VendedorLayout from "@/Layouts/VendedorLayout";
import ReservaIndex from '@/Components/ReservaIndex';

export default function Index({ reservas }) {
  return <ReservaIndex reservas={reservas} role="vendedor" Layout={VendedorLayout} />;
}
