// El horario de un local, día por día (Tienda online → Ubicaciones). Lo usan la tienda y la vista previa del panel.
// Cada día: { dia: 1..7 (lunes..domingo), abierto, tramos: [{ abre: 'HH:MM', cierra: 'HH:MM' }] }.

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Los siete días en orden, o null si ningún día tiene un tramo completo: sin eso no hay horario que mostrar. */
export function normalizarHorario(horarios) {
    if (!Array.isArray(horarios)) return null;

    const porDia = new Map(horarios.map((d) => [Number(d.dia), d]));
    const dias = DIAS.map((_, i) => {
        const d = porDia.get(i + 1);
        const tramos = (d?.tramos ?? []).filter((t) => /^\d{1,2}:\d{2}$/.test(t?.abre ?? '') && /^\d{1,2}:\d{2}$/.test(t?.cierra ?? ''));
        return { abierto: Boolean(d?.abierto) && tramos.length > 0, tramos: d?.abierto ? tramos : [] };
    });

    return dias.some((d) => d.abierto) ? dias : null;
}

/** «09:00» → «9:00». */
export const hora = (hhmm) => {
    const [h, m] = String(hhmm).split(':');
    return `${Number(h)}:${m}`;
};

const tramosEnTexto = (tramos) => tramos.map((t) => `${hora(t.abre)} a ${hora(t.cierra)}`).join(' y ');

/** Los días seguidos con el mismo horario van en una línea: «Lunes a viernes: 9:00 a 19:00», «Domingo: cerrado». */
export function lineasHorario(horarios) {
    const dias = normalizarHorario(horarios);
    if (!dias) return [];

    const grupos = [];
    dias.forEach((d, i) => {
        const texto = d.abierto ? tramosEnTexto(d.tramos) : 'cerrado';
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.texto === texto) ultimo.hasta = i;
        else grupos.push({ desde: i, hasta: i, texto });
    });

    return grupos.map(({ desde, hasta, texto }) => {
        const nombre = desde === hasta
            ? DIAS[desde]
            : `${DIAS[desde]} ${hasta === desde + 1 ? 'y' : 'a'} ${DIAS[hasta].toLowerCase()}`;
        return `${nombre}: ${texto}`;
    });
}

// La hora de Bolivia, esté donde esté quien mira la página
function ahoraEnBolivia(fecha) {
    const partes = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/La_Paz', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(fecha);
    const valor = (tipo) => partes.find((p) => p.type === tipo)?.value;
    return {
        dia: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(valor('weekday')),
        minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
    };
}

const enMinutos = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
};

/** «Abierto ahora · cierra a las 19:00» o «Cerrado ahora · abre mañana a las 9:00». Sin horario, null. */
export function estadoAhora(horarios, fecha = new Date()) {
    const dias = normalizarHorario(horarios);
    if (!dias) return null;

    const { dia, minutos } = ahoraEnBolivia(fecha);
    if (dia < 0) return null;

    const hoy = dias[dia];
    const actual = hoy.tramos.find((t) => minutos >= enMinutos(t.abre) && minutos < enMinutos(t.cierra));
    if (hoy.abierto && actual) {
        return { abierto: true, texto: `Abierto ahora · cierra a las ${hora(actual.cierra)}` };
    }

    const masTarde = hoy.tramos.find((t) => minutos < enMinutos(t.abre));
    if (hoy.abierto && masTarde) {
        return { abierto: false, texto: `Cerrado ahora · abre hoy a las ${hora(masTarde.abre)}` };
    }

    for (let n = 1; n <= 7; n += 1) {
        const i = (dia + n) % 7;
        if (dias[i].abierto) {
            const cuando = n === 1 ? 'mañana' : `el ${DIAS[i].toLowerCase()}`;
            return { abierto: false, texto: `Cerrado ahora · abre ${cuando} a las ${hora(dias[i].tramos[0].abre)}` };
        }
    }

    return null;
}
