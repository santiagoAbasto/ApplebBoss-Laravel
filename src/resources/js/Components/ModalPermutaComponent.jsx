// ModalPermutaComponent.jsx rediseñado con validación forzada
import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ModalPermutaComponent({ show, onClose, tipo, onGuardar }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData({});
  }, [tipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'imei_1' || name === 'imei_2') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 15) {
        setFormData(prev => ({ ...prev, [name]: cleaned }));
      }
    } else if (name === 'precio_costo' || name === 'precio_venta') {
      const parsed = parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? '' : parsed }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = () => {
    if (!formData.precio_costo || !formData.precio_venta) {
      alert('Completa los precios del producto entregado.');
      return;
    }

    const datosFinales = {
      ...formData,
      estado: 'permuta', // 🔒 Forzamos a estado permuta
    };

    onGuardar(datosFinales);
    onClose();
  };

  const renderCampos = () => {
    switch (tipo) {
      case 'celular':
        return (
          <>
            {['modelo', 'capacidad', 'color', 'bateria'].map((field) => (
              <input
                key={field}
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="input"
                onChange={handleChange}
              />
            ))}
            <input name="imei_1" maxLength={15} value={formData.imei_1 || ''} placeholder="IMEI 1" className="input" onChange={handleChange} />
            <input name="imei_2" maxLength={15} value={formData.imei_2 || ''} placeholder="IMEI 2" className="input" onChange={handleChange} />
            <select name="estado_imei" className="input" onChange={handleChange}>
              <option value="">-- Estado IMEI --</option>
              <option value="libre">Libre</option>
              <option value="registrado">Registrado</option>
              <option value="imei1_libre_imei2_registrado">IMEI1 Libre / IMEI2 Registrado</option>
              <option value="imei1_registrado_imei2_libre">IMEI1 Registrado / IMEI2 Libre</option>
            </select>
            <input name="procedencia" placeholder="Procedencia" className="input" onChange={handleChange} />
          </>
        );
      case 'computadora':
        return (
          <>
            {['nombre', 'procesador', 'numero_serie', 'color', 'bateria', 'ram', 'almacenamiento', 'procedencia'].map((field) => (
              <input
                key={field}
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.replace('_', ' ').slice(1)}
                className="input"
                onChange={handleChange}
              />
            ))}
          </>
        );
      case 'producto_general':
        return (
          <>
            {['codigo', 'tipo', 'nombre', 'procedencia'].map((field) => (
              <input
                key={field}
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.replace('_', ' ').slice(1)}
                className="input"
                onChange={handleChange}
              />
            ))}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-900">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-bold text-gray-800 dark:text-white">
                    Registrar producto entregado ({tipo?.replace('_', ' ')})
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderCampos()}

                  <hr className="col-span-2 border-t border-gray-200 dark:border-gray-700 my-2" />

                  <input name="precio_costo" type="number" placeholder="Precio Costo (Bs)" className="input" onChange={handleChange} />
                  <input name="precio_venta" type="number" placeholder="Precio Venta (Bs)" className="input" onChange={handleChange} />
                  <select name="estado" className="input" onChange={handleChange}>
                    <option value="">-- Estado del producto --</option>
                    <option value="disponible">Disponible</option>
                    <option value="vendido">Vendido</option>
                    <option value="permuta">Permuta</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardar}
                    className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow"
                  >
                    Guardar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// Tailwind utility: agregar esto en tu CSS global o tailwind.config.js si quieres usar 'input'
// .input {
//   @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white;
// }