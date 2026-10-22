import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Check, Mail, Star } from 'lucide-react';
import { Modal, buttonCls, inputCls } from '@/Components/Admin/ui';

// Pedirle al cliente que califique en Google: WhatsApp con el mensaje y el enlace armados, y Correo con el pedido de
// reseña. Solo aparece en las ventas (una compra terminada que se puede calificar). Los datos salen de `resena`, que
// arma App\Support\Resenas\Solicitud::paraPanel para cada fila.

const chip = 'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const fechaCorta = (iso) => new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });

export default function PedirResena({ prefijo, id, codigo, resena }) {
  const [modal, setModal] = useState(false);
  const [correo, setCorreo] = useState(resena?.correo || '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!resena) return null;
  const { whatsapp, pedida_en: pedidaEn, tipo } = resena;

  const enviar = (e) => {
    e?.preventDefault();
    setEnviando(true);
    setError(null);
    router.post(route(`${prefijo}.resenas.pedir`, { tipo, id }), { correo: correo.trim() }, {
      preserveScroll: true,
      onSuccess: () => setModal(false),
      onError: (errs) => setError(errs.correo || 'No se pudo enviar.'),
      onFinish: () => setEnviando(false),
    });
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reseña</span>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" title={`WhatsApp pidiendo la reseña · ${codigo}`}
            className={`${chip} border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100`}>
            <Star className="h-3.5 w-3.5" /> WhatsApp
          </a>
        ) : (
          <button type="button" disabled title="El cliente no dejó teléfono" className={`${chip} border-slate-200 bg-white text-slate-600`}>
            <Star className="h-3.5 w-3.5" /> WhatsApp
          </button>
        )}
        <button type="button" onClick={() => { setCorreo(resena.correo || ''); setError(null); setModal(true); }}
          title={pedidaEn ? `Reseña pedida el ${fechaCorta(pedidaEn)}` : (resena.correo ? `Pedir reseña a ${resena.correo}` : 'Escribe el correo del cliente')}
          className={`${chip} ${pedidaEn ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}>
          <Mail className="h-3.5 w-3.5" /> Correo {pedidaEn && <Check className="h-3 w-3" aria-label="pedida" />}
        </button>
      </div>

      {modal && (
        <Modal title={`Pedir reseña · ${codigo}`} onClose={() => setModal(false)}
          footer={(
            <>
              <button type="button" onClick={() => setModal(false)} className={buttonCls('secondary')}>Cancelar</button>
              <button type="submit" form={`resena-${id}`} disabled={enviando || !correo.trim()} className={buttonCls('primary')}>
                <Mail className="h-4 w-4" /> {enviando ? 'Enviando…' : (pedidaEn ? 'Volver a pedir' : 'Enviar')}
              </button>
            </>
          )}>
          <form id={`resena-${id}`} onSubmit={enviar} className="space-y-3">
            <p className="text-sm text-slate-600">
              Le llega un correo con el botón para calificar en Google. {resena.correo ? 'Puedes cambiar el correo: queda guardado en el cliente.' : 'El cliente no dejó correo: escríbelo y queda guardado en su ficha.'}
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Correo del cliente</span>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.com" autoFocus required className={inputCls} />
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            {pedidaEn && <p className="text-xs text-slate-500">Ya se pidió el {fechaCorta(pedidaEn)}.</p>}
          </form>
        </Modal>
      )}
    </>
  );
}
