import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { useEffect, useId } from 'react';
import { FondoEquipos, FormularioEntrar, TarjetaCuenta, TituloCuenta, useEsCelular } from '@/Components/Store/CuentaUI';

/*
 * «Acceder» de la tienda: la cuenta de quien compra, en un modal. En la computadora es una tarjeta al centro; en el
 * celular, una hoja que sube desde abajo y se cierra arrastrándola. Comparte la tarjeta y el formulario con /ingresar
 * (CuentaUI), y entra por la misma puerta, que solo acepta clientes: el equipo tiene la suya y la tienda no la nombra.
 * Detrás, el mismo fondo azul con los equipos animados de las páginas de cuenta, apenas translúcido sobre la tienda.
 */

const RESORTE = { type: 'spring', damping: 32, stiffness: 340, mass: 0.9 };
const FONDO = 'radial-gradient(700px 520px at 50% 50%, rgba(123,130,216,0.30), transparent 70%), '
    + 'radial-gradient(1400px 800px at 50% 0%, rgba(26,58,150,0.93) 0%, rgba(10,36,104,0.94) 45%, rgba(1,20,70,0.96) 85%)';

function Panel({ onCerrar }) {
    const celular = useEsCelular();
    const quieto = useReducedMotion();
    const tituloId = useId();
    const arrastre = useDragControls();

    // Mientras está abierto: sin scroll detrás y Escape cierra
    useEffect(() => {
        const antes = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const tecla = (e) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', tecla);
        return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', tecla); };
    }, [onCerrar]);

    const entrada = quieto ? { opacity: 0 } : celular ? { y: '100%' } : { opacity: 0, y: 28, scale: 0.96 };
    const salida = quieto ? { opacity: 0 } : celular ? { y: '100%' } : { opacity: 0, y: 18, scale: 0.97 };

    return (
        <div className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center sm:p-6">
            <motion.button type="button" aria-label="Cerrar" tabIndex={-1} onClick={onCerrar}
                className="absolute inset-0 cursor-default backdrop-blur-md" style={{ background: FONDO }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
            {/* Sin eventos: un clic en el fondo sigue cerrando */}
            <motion.div className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <FondoEquipos />
            </motion.div>

            <motion.section role="dialog" aria-modal="true" aria-labelledby={tituloId}
                className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[30px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/20 sm:max-w-[440px] sm:rounded-[30px]"
                initial={entrada} animate={{ opacity: 1, y: 0, scale: 1 }} exit={salida} transition={quieto ? { duration: 0.2 } : RESORTE}
                drag={celular && !quieto ? 'y' : false} dragControls={arrastre} dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 650) onCerrar(); }}>
                <TarjetaCuenta className="min-h-0 flex-1" alCerrar={onCerrar} arrastre={celular ? arrastre : null} asa={celular}
                    titulo={<TituloCuenta id={tituloId}>Tu cuenta Apple Boss</TituloCuenta>}
                    subtitulo="Sigue tus pedidos, califica tus compras y paga más rápido.">
                    {/* En el celular no se enfoca el correo: abriría el teclado encima de la hoja */}
                    <FormularioEntrar alSalir={onCerrar} enfocar={!celular} />
                </TarjetaCuenta>
            </motion.section>
        </div>
    );
}

export default function AccesoModal({ abierto, onCerrar }) {
    return <AnimatePresence>{abierto && <Panel key="acceso" onCerrar={onCerrar} />}</AnimatePresence>;
}
