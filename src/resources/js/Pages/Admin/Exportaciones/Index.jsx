import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js'; // ✅ CORRECTO



export default function ExportacionesIndex({ subtipos }) {
  return (
    <AdminLayout>
      <Head title="Exportaciones" />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">📤 Exportación de Inventario</h1>

        {/* Categorías principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <CardExport
            href={route('admin.exportar.celulares')}
            color="blue"
            icon="📱"
            title="Celulares"
            description="Exportar todos los celulares disponibles."
          />
          <CardExport
            href={route('admin.exportar.computadoras')}
            color="green"
            icon="💻"
            title="Computadoras"
            description="Exportar todas las computadoras disponibles."
          />
          <CardExport
            href={route('admin.exportar.productos-generales')}
            color="purple"
            icon="📦"
            title="Productos Generales"
            description="Exportar todo el inventario de productos generales."
          />
        </div>

        {/* Subcategorías de productos generales */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4">🔍 Subcategorías de Productos Generales</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {subtipos.map((subtipo) => (
            <CardExport
              key={subtipo}
              href={route('admin.exportar.productos-generales.tipo', subtipo)}
              color="yellow"
              icon="🗂"
              title={subtipo}
              description="Exportar productos de esta subcategoría."
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

// ✅ Componente reutilizable
function CardExport({ href, color, icon, title, description }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-white border border-${color}-200 shadow-md rounded-xl p-5 hover:bg-${color}-50 transition`}
    >
      <div className={`text-${color}-700 text-xl font-semibold mb-1`}>{icon} {title}</div>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
