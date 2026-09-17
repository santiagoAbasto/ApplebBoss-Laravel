import { usePage } from '@inertiajs/react';

// El nombre de la tienda se escribe en un solo lugar: Tienda online → Configuración. Desde ahí llega en los props
// compartidos (`tienda.tienda_nombre`) y todo lo que el cliente lee lo toma de acá: el encabezado, el pie, los
// mensajes de WhatsApp y los datos que lee Google. Antes estaba escrito a mano en 30 lugares de la tienda, así que
// cambiarlo en el panel no cambiaba nada.

export const NOMBRE_POR_DEFECTO = 'Apple Boss';

/** El nombre de la tienda a partir de los props compartidos. Nunca devuelve vacío. */
export function nombreTienda(tienda) {
    const nombre = (tienda?.tienda_nombre ?? '').trim();
    return nombre !== '' ? nombre : NOMBRE_POR_DEFECTO;
}

/** El nombre de la tienda dentro de un componente. */
export function useNombreTienda() {
    const { tienda } = usePage().props;
    return nombreTienda(tienda);
}

/** Con qué arranca todo mensaje de WhatsApp que la tienda le arma al cliente: «Hola Apple Boss,». */
export function saludoWhatsapp(tienda) {
    return `Hola ${nombreTienda(tienda)},`;
}
