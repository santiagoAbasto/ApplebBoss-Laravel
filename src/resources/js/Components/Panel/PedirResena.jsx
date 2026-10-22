import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Mail, MessageCircle, Star } from 'lucide-react';
import { Modal, TildeHecho, buttonCls, inputCls } from '@/Components/Admin/ui';

// Pedirle al cliente que califique en Google. Un solo botón «Reseña» abre un modal con las dos formas de pedirla:
// WhatsApp (mensaje y enlace armados) y Correo (con el enlace para calificar). Solo aparece en una compra o un
// servicio entregado. Los datos salen de `resena`, que arma App\Support\Resenas\Solicitud::paraPanel para cada fila.

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
      <button type="button" onClick={() => { setCorreo(resena.correo || ''); setError(null); setModal(true); }}
        aria-label="Pedir reseña"
        title={pedidaEn ? `Reseña ya pedida el ${fechaCorta(pedidaEn)}` : 'Pedir una reseña en Google'}
        className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors ${pedidaEn ? 'border-amber-300 bg-amber-100 text-amber-600' : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
        <Star className="h-4 w-4" fill={pedidaEn ? 'currentColor' : 'none'} />
        {pedidaEn && <TildeHecho />}
      </button>

      {modal && (
        <Modal title={`Pedir reseña · ${codigo}`} onClose={() => setModal(false)}
          footer={(
            <>
              <button type="button" onClick={() => setModal(false)} className={buttonCls('secondary')}>Cerrar</button>
              <button type="submit" form={`resena-${id}`} disabled={enviando || !correo.trim()} className={buttonCls('primary')}>
                <Mail className="h-4 w-4" /> {enviando ? 'Enviando…' : (pedidaEn ? 'Volver a enviar' : 'Enviar por correo')}
              </button>
            </>
          )}>
          <div className="space-y-4">
            {/* WhatsApp: el mensaje con el enlace ya armado; abre el chat del cliente */}
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600">
                <MessageCircle className="h-4 w-4" /> Pedir reseña por WhatsApp
              </a>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">El cliente no dejó teléfono: solo se puede por correo.</p>
            )}

            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> o por correo <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form id={`resena-${id}`} onSubmit={enviar} className="space-y-3">
              <p className="text-sm text-slate-600">
                Le llega un correo con el botón para calificar en Google. {resena.correo ? 'Puedes cambiar el correo: queda guardado en el cliente.' : 'El cliente no dejó correo: escríbelo y queda guardado en su ficha.'}
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Correo del cliente</span>
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.com" required className={inputCls} />
              </label>
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              {pedidaEn && <p className="text-xs text-slate-500">Ya se pidió el {fechaCorta(pedidaEn)}.</p>}
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
