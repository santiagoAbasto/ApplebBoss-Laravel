import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ clientes }) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

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

  const handleSeleccionar = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clientesFiltrados = clientes.filter((c) =>
    [c.nombre, c.telefono, c.correo].some((campo) =>
      campo?.toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  const numerosSeleccionados = clientes
    .filter((c) => seleccionados.includes(c.id))
    .map((c) => limpiarNumero(c.telefono))
    .filter((tel) => tel.length >= 8);

  return (
    <AdminLayout>
      <Head title="Mis Clientes" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-[#003366]">📋 Mis Clientes</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => enviarWhatsApp(clientes.map(c => limpiarNumero(c.telefono)))}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow transition"
          >
            📣 Enviar a todos
          </button>
          <button
            disabled={numerosSeleccionados.length === 0}
            onClick={() => enviarWhatsApp(numerosSeleccionados)}
            className={`${
              numerosSeleccionados.length === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } font-medium px-4 py-2 rounded-lg shadow transition`}
          >
            ✉️ Enviar a seleccionados ({numerosSeleccionados.length})
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, teléfono o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-green-100 text-gray-900 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-center">✔</th>
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((c, index) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(c.id)}
                      onChange={() => handleSeleccionar(c.id)}
                      className="accent-[#003366] w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{index + 1}</td>
                  <td className="px-4 py-3">{c.nombre}</td>
                  <td className="px-4 py-3">{c.telefono}</td>
                  <td className="px-4 py-3">{c.correo}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={route('admin.clientes.edit', c.id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      ✏️ Editar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500 italic">
                  No hay clientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
