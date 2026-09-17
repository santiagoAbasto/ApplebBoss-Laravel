// Inertia solo sabe navegar dentro de la tienda: una dirección de otro sitio (WhatsApp, Instagram, un correo) va con
// <a> para que no se rompa. La usan los menús y las tarjetas de «Nuestros servicios».
export const esExterno = (href) => typeof href === 'string' && /^(https?:)?\/\/|^(mailto|tel|wa):/i.test(href.trim());
