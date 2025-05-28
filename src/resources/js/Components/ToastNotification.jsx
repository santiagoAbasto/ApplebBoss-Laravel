import { ToastContainer as OriginalContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Mostrar toast de éxito (estilo iOS)
 * @param {string} msg - El mensaje a mostrar
 */
export const showSuccess = (msg) =>
  toast.success(msg, {
    position: 'top-right',
    autoClose: 2800,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    theme: 'light',
  });

/**
 * Mostrar toast de error (estilo iOS)
 * @param {string} msg - El mensaje a mostrar
 */
export const showError = (msg) =>
  toast.error(msg, {
    position: 'top-right',
    autoClose: 2800,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    theme: 'light',
  });

/**
 * Contenedor global de Toasts
 * Debe estar incluido una sola vez, normalmente en tu layout principal
 */
const ToastContainer = () => <OriginalContainer />;
export default ToastContainer;
