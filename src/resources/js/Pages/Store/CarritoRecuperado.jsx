import { Head, Link, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, ShoppingBag } from 'lucide-react';
import { route } from 'ziggy-js';
import { PaginaCuenta, TarjetaCuenta, TituloCuenta, pieza } from '@/Components/Store/CuentaUI';
import StoreLayout, { money, useStoreCart } from '@/Layouts/StoreLayout';

/*
 * El enlace del correo de carrito abandonado. Rearma el carrito con lo que sigue disponible y lleva al checkout.
 * Mismo escenario que las páginas de cuenta (fondo con los equipos animados, tarjeta navy) para que se sienta de la casa.
 */

function Boton({ onClick, href, children }) {
  const quieto = useReducedMotion();
  const cls = 'group mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(1,20,70,0.8)]';
  const estilo = { background: 'linear-gradient(135deg, #011446, #1A3A96)' };
  const contenido = <>{children} <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" /></>;
  return href
    ? <Link href={href} className={cls} style={estilo}>{contenido}</Link>
    : <motion.button type="button" onClick={onClick} whileTap={quieto ? undefined : { scale: 0.985 }} className={cls} style={estilo}>{contenido}</motion.button>;
}

// El hook del carrito solo existe dentro de StoreLayout: por eso el contenido es un componente aparte (igual que en Checkout)
function Contenido({ nombre, items, agotados, total, recuperado, baja }) {
  const { restaurar } = useStoreCart();

  const retomar = () => {
    restaurar(items.map((i) => i.key));
    router.visit(route('checkout'));
  };

  let titulo; let subtitulo; let cuerpo;

  if (baja) {
    titulo = 'Listo';
    subtitulo = 'No te mandamos más recordatorios de carrito a este correo.';
    cuerpo = (
      <motion.div variants={pieza} className="text-center">
        <p className="text-[15px] leading-relaxed text-slate-600">Tu cuenta y tus pedidos siguen igual. Cuando quieras, la tienda está abierta.</p>
        <Boton href="/catalogo">Ver la tienda</Boton>
      </motion.div>
    );
  } else if (recuperado) {
    titulo = `Ya está, ${nombre}`;
    subtitulo = 'Esta compra ya la completaste. Tu pedido está en Mi cuenta.';
    cuerpo = <motion.div variants={pieza}><Boton href="/mi-cuenta">Ir a mi cuenta</Boton></motion.div>;
  } else if (items.length === 0) {
    titulo = `Se nos adelantaron, ${nombre}`;
    subtitulo = 'Lo que tenías en el carrito ya se vendió. En una tienda con stock real pasa.';
    cuerpo = (
      <motion.div variants={pieza}>
        {agotados.length > 0 && <p className="text-[14px] text-slate-500">Vendido: {agotados.join(', ')}.</p>}
        <Boton href="/catalogo">Ver lo que hay hoy</Boton>
      </motion.div>
    );
  } else {
    titulo = `Tu carrito te esperaba, ${nombre}`;
    subtitulo = items.length === 1 ? 'Sigue disponible y al mismo precio. Un clic y pasas a pagar.' : 'Siguen disponibles y al mismo precio. Un clic y pasas a pagar.';
    cuerpo = (
      <>
        <ul className="divide-y divide-slate-100">
          {items.map((i) => (
            <motion.li key={i.key} variants={pieza} className="flex items-center gap-3 py-3">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50">
                {i.imagen ? <img src={i.imagen} alt="" className="h-full w-full object-contain" /> : <ShoppingBag className="h-6 w-6 text-slate-300" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-slate-900">{i.nombre}</span>
                {i.condicion && <span className="block text-[12px] text-slate-400">{i.condicion}</span>}
              </span>
              <span className="whitespace-nowrap text-[15px] font-extrabold text-[#011446]">{money(i.precio)}</span>
            </motion.li>
          ))}
        </ul>
        {items.length > 1 && (
          <motion.p variants={pieza} className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-[15px] font-extrabold text-slate-900">
            <span>Total</span><span>{money(total)}</span>
          </motion.p>
        )}
        {agotados.length > 0 && (
          <motion.p variants={pieza} className="mt-3 text-[13px] text-slate-500">Ya se vendió: {agotados.join(', ')}.</motion.p>
        )}
        <motion.div variants={pieza}>
          <Boton onClick={retomar}>Retomar mi compra</Boton>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
            <Check className="h-3.5 w-3.5" style={{ color: '#7a7f1f' }} /> Se arma solo en tu carrito; pagas en el siguiente paso.
          </p>
        </motion.div>
      </>
    );
  }

  return (
    <PaginaCuenta>
      <TarjetaCuenta
        titulo={<TituloCuenta as="h1">{titulo}</TituloCuenta>}
        subtitulo={subtitulo}
      >
        {cuerpo}
      </TarjetaCuenta>
    </PaginaCuenta>
  );
}

export default function CarritoRecuperado({ nombre, items = [], agotados = [], total = 0, recuperado = false, baja = false }) {
  return (
    <StoreLayout>
      <Head title={baja ? 'Recordatorios desactivados' : 'Tu carrito te esperaba'} />
      <Contenido nombre={nombre} items={items} agotados={agotados} total={total} recuperado={recuperado} baja={baja} />
    </StoreLayout>
  );
}
