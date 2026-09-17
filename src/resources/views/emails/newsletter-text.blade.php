@if($esPrueba)[CORREO DE PRUEBA]

@endif
@foreach($bloques as $b)
@switch($b['tipo'])
@case('titulo')
{{ mb_strtoupper($b['texto']) }}

@break
@case('texto')
{{ $b['texto'] }}

@break
@case('imagen')
@if($b['alt'])[Imagen: {{ $b['alt'] }}]@endif
@if($b['enlace']) {{ $b['enlace'] }}@endif


@break
@case('boton')
{{ $b['texto'] }}: {{ $b['url'] }}

@break
@case('producto')
{{ $b['nombre'] }}@if($b['precio']) — Bs {{ number_format($b['precio'], 0, ',', '.') }}@endif

{{ $b['url'] }}

@break
@case('separador')
----------------------------------------

@break
@endswitch
@endforeach
--
@if($pie){{ $pie }}
@endif
Recibes este correo porque te suscribiste al newsletter de Apple Boss.
Darte de baja: {{ $unsubscribeUrl }}
