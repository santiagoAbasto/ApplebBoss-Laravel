import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Apple, FolderTree, Laptop, Boxes, Smartphone, Upload, Search } from 'lucide-react';

/* =======================
   CRUD UI (OFICIAL)
======================= */
import {
  CrudWrapper,
  CrudHeader,
  CrudTitle,
  CrudSubtitle,
  CrudCard,
  CrudSectionTitle,
  CrudGrid,
} from '@/Components/CrudUI';

export default function ExportacionesIndex({ subtipos }) {
  return (
    <AdminLayout>
      <Head title="Exportaciones" />

      <CrudWrapper>
        {/* ================= HEADER ================= */}
        <CrudHeader>
          <div>
            <CrudTitle>
              <Upload size={22} />
              Exportaciones
            </CrudTitle>
            <CrudSubtitle>
              Exportación de inventario y subcategorías
            </CrudSubtitle>
          </div>
        </CrudHeader>

        {/* ================= INVENTARIO PRINCIPAL ================= */}
        <CrudCard style={{ marginBottom: 24 }}>
          <CrudSectionTitle>Inventario principal</CrudSectionTitle>

          <CrudGrid>
            <ExportCard
              href={route('admin.exportar.celulares')}
              icon={<Smartphone size={18} />}
              title="Celulares"
              description="Exportar todos los celulares disponibles."
            />
            <ExportCard
              href={route('admin.exportar.computadoras')}
              icon={<Laptop size={18} />}
              title="Computadoras"
              description="Exportar todas las computadoras disponibles."
            />
            <ExportCard
              href={route('admin.exportar.productos-generales')}
              icon={<Boxes size={18} />}
              title="Productos Generales"
              description="Exportar todo el inventario general."
            />
            <ExportCard
              href={route('admin.exportar.productos-apple')}
              icon={<Apple size={18} />}
              title="Productos Apple"
              description="Exportar todos los productos Apple."
            />
            <ExportCard
              href={route('admin.exportar.personalizado')}
              icon={<Search size={18} />}
              title="Exportador por nombre"
              description="Filtrar por modelo o nombre y exportar coincidencias."
            />
          </CrudGrid>
        </CrudCard>

        {/* ================= SUBCATEGORÍAS ================= */}
        <CrudCard>
          <CrudSectionTitle>
            Subcategorías de productos generales
          </CrudSectionTitle>

          {subtipos?.length > 0 ? (
            <CrudGrid>
              {subtipos.map((subtipo) => (
                <ExportCard
                  key={subtipo}
                  href={route(
                    'admin.exportar.productos-generales.tipo',
                    subtipo
                  )}
                  icon={<FolderTree size={18} />}
                  title={subtipo}
                  description="Exportar productos de esta subcategoría."
                />
              ))}
            </CrudGrid>
          ) : (
            <p style={{ color: '#64748b', fontSize: 14 }}>
              No existen subcategorías registradas.
            </p>
          )}
        </CrudCard>
      </CrudWrapper>
    </AdminLayout>
  );
}

/* ===============================
   EXPORT CARD (ESTILO CRUD)
=============================== */
function ExportCard({ href, icon, title, description }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 16,
        background: '#ffffff',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 8px 24px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {icon}
        <span>{title}</span>
      </div>

      <p
        style={{
          fontSize: 14,
          color: '#475569',
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {description}
      </p>
    </a>
  );
}
