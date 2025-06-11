import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function Index({ clientes }) {
    const handleEnviarPromocion = () => {
        if (!confirm('¿Enviar promoción a todos estos clientes por WhatsApp?')) return;
      
        const mensaje = encodeURIComponent(`🎉 ¡Hola! En AppleBoss tenemos promociones especiales para ti. 💥 No te las pierdas. Visítanos o escríbenos ahora mismo 📱`);
        
        clientes.forEach((cliente, index) => {
          const telefono = cliente.telefono.replace(/\D/g, ''); // Limpia guiones, espacios
          if (telefono.length >= 8) {
            const url = `https://wa.me/591${telefono}?text=${mensaje}`;
            setTimeout(() => {
              window.open(url, `_blank`);
            }, index * 1000); // Espera 1 segundo entre cada uno
          }
        });
      };      

  return (
    <AdminLayout>
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
              <td>{c.correo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
