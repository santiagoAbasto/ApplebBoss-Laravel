import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ clientes }) {
  const [enviando, setEnviando] = useState(false);

  const mensaje = encodeURIComponent(
    `🎉 ¡Hola! En AppleBoss tenemos promociones especiales para ti. 💥 No te las pierdas. Visítanos o escríbenos ahora mismo 📱`
  );

  const limpiarNumero = (tel) => {
    const soloNumeros = tel.replace(/\D/g, '');
  
    // Si ya tiene un código internacional (ej. +54, +34) y no es Bolivia
    if (soloNumeros.length >= 11 && !soloNumeros.startsWith('591')) {
      return soloNumeros;
    }
  
    // Si ya empieza con 591 (número boliviano con código)
    if (soloNumeros.startsWith('591')) {
      return soloNumeros;
    }
  
    // Si es un número nacional boliviano sin código (8 dígitos)
    if (soloNumeros.length === 8) {
      return `591${soloNumeros}`;
    }
  
    // Fallback: si no se cumple ninguna condición, retornamos limpio
    return soloNumeros;
  };
  
  const enviarWhatsApp = (numeros) => {
    if (!confirm(`¿Enviar promoción a ${numeros.length} cliente(s)?`)) return;
  
    numeros.forEach((tel, index) => {
      setTimeout(() => {
        const numeroFinal = limpiarNumero(tel);
  
        if (numeroFinal.length >= 11) {
          const enlaceWeb = `https://wa.me/${numeroFinal}?text=${mensaje}`;
          const enlaceApp = `whatsapp://send?phone=${numeroFinal}&text=${mensaje}`;
  
          // Detección de entorno
          const esCelular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const esDesktop = !esCelular;
  
          if (esDesktop) {
            // Intenta abrir en app de escritorio
            const win = window.open(enlaceApp, '_blank');
  
            // Fallback a web si no se abre (puede depender del sistema operativo)
            setTimeout(() => {
              if (win && win.closed === false) return;
              window.open(enlaceWeb, '_blank');
            }, 1000);
          } else {
            // En móvil directamente abrimos en app (funciona igual)
            window.open(enlaceApp, '_blank');
          }
  
        } else {
          console.warn(`❌ Número inválido omitido: ${tel}`);
        }
      }, index * 1000);
    });
  };
  const handleEnviarPromocion = () => {
    if (!confirm('¿Enviar promoción a todos estos clientes por WhatsApp?')) return;

    setEnviando(true);

    clientes.forEach((cliente, index) => {
      setTimeout(() => {
        const numeroFinal = limpiarNumero(cliente.telefono);

        if (numeroFinal.length >= 10) {
          const url = obtenerURLWhatsApp(numeroFinal);
          window.open(url, '_blank');
        } else {
          console.warn(`Número inválido omitido: ${cliente.telefono}`);
        }

        if (index === clientes.length - 1) {
          setTimeout(() => setEnviando(false), 1000);
        }
      }, index * 1000); // 1 segundo entre cada envío
    });
  };

  return (
    <VendedorLayout>
      <Head title="Mis Clientes" />

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-green-700">📋 Mis Clientes</h1>
        <button
          onClick={handleEnviarPromocion}
          className="btn btn-success shadow px-4 py-2 rounded-md text-white hover:bg-green-800 transition"
          disabled={enviando}
        >
          {enviando ? 'Enviando...' : '📣 Enviar promoción a todos'}
        </button>
      </div>

      <div className="overflow-auto rounded shadow bg-white">
        <table className="table table-sm table-bordered text-sm text-center align-middle">
          <thead className="bg-success text-white">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              clientes.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td className="text-start">{c.nombre}</td>
                  <td>{c.telefono}</td>
                  <td>{c.correo || '-'}</td>
                  <td>
                    <Link
                      href={route('vendedor.clientes.edit', c.id)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      ✏️ Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VendedorLayout>
  );
}
