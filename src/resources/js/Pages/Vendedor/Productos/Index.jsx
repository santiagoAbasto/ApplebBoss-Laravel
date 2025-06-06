import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ celulares = [], computadoras = [], productosGenerales = [], productosApple = [] }) {
  const [tab, setTab] = useState('celulares');

  const tabs = {
    celulares: { label: 'Celulares', data: celulares },
    computadoras: { label: 'Computadoras', data: computadoras },
    productosGenerales: { label: 'Productos Generales', data: productosGenerales },
    productosApple: { label: 'Productos Apple', data: productosApple },
  };

  return (
    <VendedorLayout>
      <Head title="Ver Productos" />

      <div className="mb-4">
        <h1 className="h3 text-gray-800">📦 Productos Disponibles</h1>
        <p className="text-muted">Solo lectura del inventario disponible.</p>
      </div>

      <ul className="nav nav-tabs mb-3">
        {Object.entries(tabs).map(([key, { label }]) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className="table-responsive">
        <table className="table table-bordered table-hover table-sm">
          <thead className="thead-light">
            <tr>
              <th>#</th>
              <th>Modelo / Nombre</th>
              <th>Precio Venta (Bs)</th>
              <th>Precio Costo (Bs)</th>
              <th>Estado</th>
              <th>Procedencia</th>
              <th>Identificador</th>
            </tr>
          </thead>
          <tbody>
            {tabs[tab].data.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td>{item.modelo || item.nombre}</td>
                <td>{item.precio_venta?.toLocaleString()}</td>
                <td>{item.precio_costo?.toLocaleString()}</td>
                <td>{item.estado}</td>
                <td>{item.procedencia || '-'}</td>
                <td>{item.imei1 || item.numero_serie || item.codigo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendedorLayout>
  );
}
