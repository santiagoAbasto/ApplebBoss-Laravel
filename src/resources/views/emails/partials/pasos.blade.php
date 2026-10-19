{{-- El camino del equipo en el taller: hechos en navy, el actual en lima, lo que falta en gris. --}}
@php($n = count($pasos))
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">
    <tr>
        @foreach ($pasos as $i => $paso)
            @php($hecho = $i < $actual)
            @php($ahora = $i === $actual)
            <td align="center" valign="top" width="{{ (int) (100 / $n) }}%" style="padding:0 2px;">
                <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" valign="middle" style="width:30px;height:30px;border-radius:999px;font-size:13px;font-weight:800;line-height:30px;{{ $ahora ? 'background:#C6CB36;color:#011446;' : ($hecho ? 'background:#011446;color:#ffffff;' : 'background:#e2e8f0;color:#94a3b8;') }}">{{ $hecho ? '✓' : $i + 1 }}</td></tr></table>
                <p style="margin:8px 0 0;font-size:11px;line-height:1.35;font-weight:{{ $ahora ? '800' : '600' }};color:{{ $ahora ? '#011446' : ($hecho ? '#334155' : '#94a3b8') }};">{{ $paso }}</p>
            </td>
        @endforeach
    </tr>
</table>
