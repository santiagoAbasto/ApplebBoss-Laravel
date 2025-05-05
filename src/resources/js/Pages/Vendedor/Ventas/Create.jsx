import { useForm, Head } from '@inertiajs/react';
import VendedorLayout from '@/Layouts/VendedorLayout';
import { useState } from 'react';

export default function Create({ celulares, computadoras, productosGenerales }) {
  const [permutaActiva, setPermutaActiva] = useState(false);
  const [tipoPermuta, setTipoPermuta] = useState('');

  const { data, setData, post, errors } = useForm({
    nombre_cliente: '',
    telefono_cliente: '',
    tipo_venta: 'producto',
    es_permuta: false,
    tipo_permuta: '',
    celular_id: '',
    computadora_id: '',
    producto_general_id: '',
    cantidad: 1,
    precio_invertido: 0,
    precio_venta: 0,
    ganancia_neta: 0,
    subtotal: 0,
    descuento: 0,
    permuta: {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('vendedor.ventas.store'));
  };

  const handlePermutaChange = (field, value) => {
    setData('permuta', {
      ...data.permuta,
      [field]: value,
    });
  };

  return (
    <VendedorLayout>
      <Head title="Registrar Venta" />
      <h1 className="h3 mb-4">🛒 Registrar Venta</h1>

      <form onSubmit={handleSubmit}>
        {/* ...misma estructura del admin con setData(...) */}
        {/* (Puedes copiar del Create del admin, solo cambia route y layout) */}
        {/* Evita campos avanzados o privilegios de admin */}
        {/* Asegúrate que el select de productos solo muestre disponibles */}
        {/* También aplica las validaciones necesarias */}
        {/* Al final: */}
        <button type="submit" className="btn btn-success">Registrar Venta</button>
      </form>
    </VendedorLayout>
  );
}
