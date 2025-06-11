import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head } from '@inertiajs/react';

export default function Index({ clientes }) {
  const handleEnviarPromocion = () => {
    if (!confirm('¿Enviar promoción a todos estos clientes por WhatsApp?')) return;

    const mensaje = encodeURIComponent(
      `🎉 ¡Hola! En AppleBoss tenemos promociones especiales para ti. 💥 No te las pierdas. Visítanos o escríbenos ahora mismo 📱`
    );

    clientes.forEach((cliente, index) => {
      // Elimina cualquier carácter no numérico
      const cleanTelefono = cliente.telefono.replace(/\D/g, '');
      // Si no empieza con 591, lo añade
      const numeroFinal = cleanTelefono.startsWith('591')
        ? cleanTelefono
        : '591' + cleanTelefono;

      if (numeroFinal.length >= 10) {
        const url = `https://wa.me/${numeroFinal}?text=${mensaje}`;
        setTimeout(() => {
          window.open(url, '_blank');
        }, index * 1000); // Espera 1 segundo entre cada envío
      }
    });
  };

  return (
    <VendedorLayout>
      <Head title="Mis Clientes" />

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h1 className="h4 text-success fw-bold">📋 Mis Clientes</h1>
        <button onClick={handleEnviarPromocion} className="btn btn-success shadow-sm">
          📣 Enviar promoción a todos
        </button>
      </div>

      <table className="table table-bordered table-hover table-sm">
        <thead className="table-success text-center">
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Correo</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, index) => (
            <tr key={c.id}>
              <td>{index + 1}</td>
              <td>{c.nombre}</td>
              <td>{c.telefono}</td>
              <td>{c.correo || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </VendedorLayout>
  );
}
