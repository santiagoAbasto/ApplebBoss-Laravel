import { motion, useReducedMotion } from 'framer-motion';

// Aparece suavemente (sube y se aclara) la primera vez que entra en pantalla.
// Respeta "reducir movimiento" del sistema: en ese caso se muestra sin animar.
export default function Reveal({ children, delay = 0, y = 24, className, as = 'div' }) {
    const reduce = useReducedMotion();
    const Tag = motion[as] ?? motion.div;

    if (reduce) return <Tag className={className}>{children}</Tag>;

    return (
        <Tag
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </Tag>
    );
}
