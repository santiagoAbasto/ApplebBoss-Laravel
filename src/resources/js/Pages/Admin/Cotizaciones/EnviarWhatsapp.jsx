import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function EnviarWhatsapp({ telefono, mensaje }) {
  useEffect(() => {
    const urlEncodedMessage = encodeURIComponent(mensaje);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isDesktop = /Macintosh|Windows|Linux/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `https://api.whatsapp.com/send?phone=${telefono}&text=${urlEncodedMessage}`;
    } else if (isDesktop) {
      const intent = `whatsapp://send?phone=${telefono}&text=${urlEncodedMessage}`;
      window.location.href = intent;

      // Si no se abre la app de escritorio, cae a WhatsApp Web
      setTimeout(() => {
        window.location.href = `https://web.whatsapp.com/send?phone=${telefono}&text=${urlEncodedMessage}`;
      }, 1000);

      return;
    } else {
      window.location.href = `https://web.whatsapp.com/send?phone=${telefono}&text=${urlEncodedMessage}`;
    }
  }, [telefono, mensaje]);

  return (
    <div className="text-center mt-5">
      <h2>Redirigiendo a WhatsApp...</h2>
      <p>
        Si no ocurre nada, haz{' '}
        <a
          href={`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
        >
          clic aquí
        </a>.
      </p>
    </div>
  );
}
