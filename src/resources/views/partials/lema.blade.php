{{--
    El lema de la tienda (config seo.negocio.lema). La parte con `escudo` lleva el ícono de seguridad: en la web, el mismo
    SVG que la tienda (ShieldCheck); en los correos, escudo.png, porque Gmail no muestra SVG.
--}}
@php($base = rtrim((string) config('seo.public_url', config('app.url')), '/'))
@foreach ((array) config('seo.negocio.lema') as $parte)
    @if (! $loop->first)<span aria-hidden="true"> · </span>@endif
    @if (! empty($parte['escudo']))
        @if ($svg)<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#C6CB36" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-2px;margin-right:3px"><path d="M12 3.25l7 2.75v5.25c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V6l7-2.75z"/><path d="M9 12l2.1 2.1L15.25 10"/></svg>@else<img src="{{ $base }}/images/correo/escudo.png" width="13" height="13" alt="" style="display:inline-block;vertical-align:-2px;margin-right:3px;border:0;">@endif
    @endif{{ $parte['texto'] }}
@endforeach
