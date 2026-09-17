import { useEffect, useRef } from 'react';

const BTN = 'rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-sm';

/**
 * Editor de texto sencillo (como un procesador de textos): títulos, negrita, listas y enlaces.
 * La persona no ve código; el servidor limpia el resultado antes de guardarlo.
 */
export default function SimpleEditor({ value, onChange, minHeight = 320, placeholder = 'Escribe aquí…' }) {
    const ref = useRef(null);

    // Solo al montar: después el contenido lo maneja el propio editor
    useEffect(() => {
        if (ref.current) ref.current.innerHTML = value || '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emit = () => onChange(ref.current?.innerHTML ?? '');

    const exec = (cmd, arg = null) => {
        ref.current?.focus();
        document.execCommand(cmd, false, arg);
        emit();
    };

    const link = () => {
        const url = window.prompt('Pega el enlace (por ejemplo https://wa.me/591…):');
        if (url) exec('createLink', url);
    };

    // Pegar siempre como texto simple (evita traer estilos raros de Word o páginas web)
    const onPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        emit();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500">
            <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5" role="toolbar" aria-label="Formato del texto">
                <button type="button" className={BTN} onClick={() => exec('formatBlock', 'h2')}>Título</button>
                <button type="button" className={BTN} onClick={() => exec('formatBlock', 'h3')}>Subtítulo</button>
                <button type="button" className={BTN} onClick={() => exec('formatBlock', 'p')}>Texto normal</button>
                <span className="mx-1 w-px self-stretch bg-slate-200" aria-hidden="true" />
                <button type="button" className={BTN + ' font-black'} onClick={() => exec('bold')}>Negrita</button>
                <button type="button" className={BTN + ' italic'} onClick={() => exec('italic')}>Cursiva</button>
                <span className="mx-1 w-px self-stretch bg-slate-200" aria-hidden="true" />
                <button type="button" className={BTN} onClick={() => exec('insertUnorderedList')}>• Lista</button>
                <button type="button" className={BTN} onClick={() => exec('insertOrderedList')}>1. Lista numerada</button>
                <button type="button" className={BTN} onClick={link}>Enlace</button>
                <button type="button" className={BTN + ' text-slate-500'} onClick={() => exec('removeFormat')}>Quitar formato</button>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={emit}
                onBlur={emit}
                onPaste={onPaste}
                data-placeholder={placeholder}
                className="ab-simple-editor px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none"
                style={{ minHeight }}
            />
            <style>{`
                .ab-simple-editor:empty:before { content: attr(data-placeholder); color: #94a3b8; }
                .ab-simple-editor h2 { font-size: 1.25rem; font-weight: 800; margin: 1rem 0 .5rem; color: #0f172a; }
                .ab-simple-editor h3 { font-size: 1.05rem; font-weight: 700; margin: .9rem 0 .4rem; color: #0f172a; }
                .ab-simple-editor p { margin: 0 0 .75rem; }
                .ab-simple-editor ul { list-style: disc; padding-left: 1.4rem; margin: 0 0 .75rem; }
                .ab-simple-editor ol { list-style: decimal; padding-left: 1.4rem; margin: 0 0 .75rem; }
                .ab-simple-editor a { color: #1d4ed8; text-decoration: underline; }
            `}</style>
        </div>
    );
}
