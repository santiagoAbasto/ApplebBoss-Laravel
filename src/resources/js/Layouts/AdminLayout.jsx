import {
  CalendarCheck, ChartLine, CircleHelp, ClipboardCheck, Contact, FileDown, FileText, Hammer, House, Images, Laptop,
  Layers, LayoutDashboard, List, MailOpen, MapPin, Newspaper, Package, Receipt, Repeat, Search, Send, Settings,
  ShoppingCart, SlidersHorizontal, Smartphone, Store, Tablet, Tag, Truck, Users, Wallet, Wrench,
} from 'lucide-react';
import IconoUsuarios from '@/Components/Admin/IconoUsuarios';
import PanelShell, { AB, DISPLAY_FONT } from '@/Layouts/PanelShell';

export { AB, DISPLAY_FONT };

// Lo de todos los días arriba; la tienda online y el marketing después, como bloque.
const NAV = [
  { key: 'inicio', items: [{ r: 'admin.dashboard', icon: LayoutDashboard, label: 'Resumen', exact: true, modulo: 'resumen' }] },
  { key: 'operacion', label: 'Ventas y operación', items: [
    { r: 'admin.ventas.index', icon: ShoppingCart, label: 'Ventas', modulo: 'ventas' },
    { r: 'admin.pedidos.index', icon: Truck, label: 'Pedidos de la tienda', modulo: 'pedidos' },
    { r: 'admin.reservas.index', icon: CalendarCheck, label: 'Reservas', modulo: 'reservas' },
    { r: 'admin.servicios.index', icon: Hammer, label: 'Servicio técnico', modulo: 'servicios' },
    { r: 'admin.cotizaciones.index', icon: Receipt, label: 'Cotizaciones', modulo: 'cotizaciones' },
    { r: 'admin.egresos.index', icon: Wallet, label: 'Egresos', modulo: 'egresos' },
    { r: 'admin.reportes.index', icon: ChartLine, label: 'Reportes', modulo: 'reportes' },
    { r: 'admin.clientes.index', icon: Users, label: 'Clientes', modulo: 'clientes' },
  ] },
  { key: 'inventario', label: 'Inventario', items: [
    { r: 'admin.celulares.index', icon: Smartphone, label: 'Celulares', modulo: 'inventario' },
    { r: 'admin.computadoras.index', icon: Laptop, label: 'Computadoras', modulo: 'inventario' },
    { r: 'admin.productos-apple.index', icon: Tablet, label: 'Productos Apple', modulo: 'inventario' },
    { r: 'admin.productos-generales.index', icon: Package, label: 'Productos generales', modulo: 'inventario' },
    { r: 'admin.inventory-audits.index', icon: ClipboardCheck, label: 'Auditoría', modulo: 'auditoria' },
  ] },
  { key: 'tienda', label: 'Tienda online', items: [
    { r: 'admin.catalogo.index', icon: Store, label: 'Productos en la tienda', modulo: 'tienda' },
    { r: 'admin.modelos.index', icon: Images, label: 'Modelos y fotos', modulo: 'tienda' },
    { r: 'admin.categories.index', icon: Tag, label: 'Categorías', modulo: 'tienda' },
    { r: 'admin.collections.index', icon: Layers, label: 'Colecciones', modulo: 'tienda' },
    { r: 'admin.home-builder.index', icon: House, label: 'Portada', modulo: 'tienda' },
    { r: 'admin.menus.index', icon: List, label: 'Menú', modulo: 'tienda' },
    { r: 'admin.pages.index', icon: FileText, label: 'Páginas', modulo: 'tienda' },
    { r: 'admin.faqs.index', icon: CircleHelp, label: 'Preguntas frecuentes', modulo: 'tienda' },
    { r: 'admin.services.index', icon: Wrench, label: 'Servicios', modulo: 'tienda' },
    { r: 'admin.locations.index', icon: MapPin, label: 'Ubicaciones', modulo: 'tienda' },
    { r: 'admin.novedades.index', icon: Newspaper, label: 'Novedades', modulo: 'tienda' },
    { r: 'admin.trade-in.index', icon: Repeat, label: 'Trade-In', aviso: 'trade_in', modulo: 'tienda' },
    { r: 'admin.configuracion.tienda.edit', icon: Settings, label: 'Configuración', modulo: 'tienda' },
  ] },
  { key: 'marketing', label: 'Marketing y Google', items: [
    { r: 'admin.newsletter.campaigns.index', icon: Send, label: 'Campañas', modulo: 'marketing' },
    { r: 'admin.newsletter.subscribers.index', icon: Contact, label: 'Suscriptores', modulo: 'marketing' },
    { r: 'admin.newsletter.settings.edit', icon: MailOpen, label: 'Ajustes del newsletter', modulo: 'marketing' },
    { r: 'admin.seo.index', icon: Search, label: 'Google y redes sociales', modulo: 'marketing' },
  ] },
  { key: 'datos', label: 'Exportar datos', items: [
    { r: 'admin.exportaciones.index', icon: FileDown, label: 'Exportaciones', modulo: 'exportar' },
    { r: 'admin.exportar.personalizado', icon: SlidersHorizontal, label: 'Exportador', modulo: 'exportar' },
  ] },
  { key: 'sistema', label: 'Sistema', items: [
    { r: 'admin.usuarios.index', icon: IconoUsuarios, label: 'Usuarios y roles', modulo: 'usuarios' },
  ] },
];

export default function AdminLayout({ children, title }) {
  return (
    <PanelShell
      nav={NAV}
      homeRoute="admin.dashboard"
      headTitle={title ? `${title} | Apple Boss` : 'Panel de Administración | Apple Boss'}
      migaPorDefecto="Panel de administración"
      filtrarPorPermisos
    >
      {children}
    </PanelShell>
  );
}
