import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';
import { Modal, buttonCls, inputCls } from '@/Components/Admin/ui';

// Los botones para hacerle llegar un documento al cliente: WhatsApp con el mensaje armado y el enlace al PDF, Correo
// (con el PDF adjunto; si el cliente no dejó correo, se pide acá y queda guardado) y Copiar el mensaje. Lo que muestra
// sale de `compartir`, que arma el servidor (App\Support\Documentos\Documento::compartir) para cada fila.

const chip = 'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const fechaCorta = (iso) => new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });
const TITULOS = { venta: 'la nota de venta', servicio: 'la nota de servicio', reserva: 'la nota de reserva', diagnostico: 'el informe técnico' };

export default function Compartir({ prefijo, compartir }) {
  const [modal, setModal] = useState(false);
  const [correo, setCorreo] = useState(compartir?.correo || '');
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!compartir) return null;
  const { tipo, id, codigo, whatsapp, mensaje, publicable, correo_enviado_en: enviadoEn } = compartir;
  const bloqueo = publicable ? null : 'Completa el informe para compartirlo';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* sin portapapeles (http sin https): el usuario copia a mano */ }
  };

  const enviar = (e) => {
    e?.preventDefault();
    setEnviando(true);
    setError(null);
    router.post(route(`${prefijo}.documentos.correo`, { tipo, id }), { correo: correo.trim() }, {
      preserveScroll: true,
      onSuccess: () => setModal(false),
      onError: (errs) => setError(errs.correo || 'No se pudo enviar.'),
      onFinish: () => setEnviando(false),
    });
  };

  return (
    <>
      <div className="inline-flex gap-1.5">
        {whatsapp && !bloqueo ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" title={`WhatsApp con ${TITULOS[tipo]} ${codigo}`}
            className={`${chip} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100`}>
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        ) : (
          <button type="button" disabled title={bloqueo || 'El cliente no dejó teléfono'} className={`${chip} border-slate-200 bg-white text-slate-600`}>
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
        )}
        <button type="button" disabled={Boolean(bloqueo)} onClick={() => { setCorreo(compartir.correo || ''); setError(null); setModal(true); }}
          title={bloqueo || (enviadoEn ? `Enviado el ${fechaCorta(enviadoEn)} a ${compartir.correo}` : (compartir.correo ? `Enviar a ${compartir.correo}` : 'El cliente no dejó correo: escríbelo y se envía'))}
          className={`${chip} ${enviadoEn ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}>
          <Mail className="h-3.5 w-3.5" /> Correo {enviadoEn && <Check className="h-3 w-3" aria-label="enviado" />}
        </button>
        <button type="button" disabled={Boolean(bloqueo)} onClick={copiar} title={bloqueo || 'Copiar el mensaje con el enlace al PDF'}
          className={`${chip} border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900`}>
          {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      {modal && (
        <Modal title={`Enviar ${TITULOS[tipo]} ${codigo} por correo`} onClose={() => setModal(false)}
          footer={(
            <>
              <button type="button" onClick={() => setModal(false)} className={buttonCls('secondary')}>Cancelar</button>
              <button type="submit" form={`correo-${tipo}-${id}`} disabled={enviando || !correo.trim()} className={buttonCls('primary')}>
                <Mail className="h-4 w-4" /> {enviando ? 'Enviando…' : (enviadoEn ? 'Volver a enviar' : 'Enviar')}
              </button>
            </>
          )}>
          <form id={`correo-${tipo}-${id}`} onSubmit={enviar} className="space-y-3">
            <p className="text-sm text-slate-600">
              Va con el PDF adjunto y el enlace para abrirlo. {compartir.correo ? 'Puedes cambiar el correo: queda guardado en el cliente.' : 'El cliente no dejó correo: escríbelo y queda guardado en su ficha.'}
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Correo del cliente</span>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.com" autoFocus required className={inputCls} />
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            {enviadoEn && <p className="text-xs text-slate-500">Ya se envió el {fechaCorta(enviadoEn)}{compartir.correo ? ` a ${compartir.correo}` : ''}.</p>}
          </form>
        </Modal>
      )}
    </>
  );
}
