<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Acceso del jurado · Apple Boss</title>
<link rel="icon" href="{{ asset('favicon.ico') }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{ --navy:#16244E; --navy2:#20315F; --lima:#A8D82A; --lima-d:#7FA80F; --on:#EAEFFB; --mut:#A7B3D4; }
  *{ box-sizing:border-box; margin:0; }
  html,body{ min-height:100%; }
  body{ min-height:100vh; font-family:'Inter',system-ui,sans-serif; color:var(--on); position:relative; overflow-x:hidden;
    background:
      radial-gradient(1200px 760px at 85% -12%, rgba(168,216,42,.16), transparent 60%),
      radial-gradient(900px 820px at -12% 112%, rgba(46,72,135,.6), transparent 60%),
      var(--navy);
    display:flex; align-items:center; justify-content:center; padding:30px 18px; }

  /* ---------- capa de SVG de tienda flotando ---------- */
  .scene{ position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
  .scene svg{ position:absolute; display:block; }
  .scene .pc{ fill:none; stroke:var(--lima); stroke-width:1.6; opacity:.16; }
  .scene .pw{ fill:none; stroke:#cdd7f2; stroke-width:1.6; opacity:.12; }
  .scene .solid{ fill:var(--lima); opacity:.10; stroke:none; }
  @keyframes drift{ 0%{ transform:translateY(0) rotate(var(--r,0deg)); } 50%{ transform:translateY(-26px) rotate(calc(var(--r,0deg) + 6deg)); } 100%{ transform:translateY(0) rotate(var(--r,0deg)); } }
  @keyframes drift2{ 0%{ transform:translateY(0) rotate(var(--r,0deg)); } 50%{ transform:translateY(22px) rotate(calc(var(--r,0deg) - 5deg)); } 100%{ transform:translateY(0) rotate(var(--r,0deg)); } }
  .fl{ animation:drift 9s ease-in-out infinite; }
  .fl2{ animation:drift2 11s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce){ .fl,.fl2,.mark-wrap{ animation:none !important; } }

  .card{ position:relative; z-index:1; width:100%; max-width:468px; }

  /* ---------- marca ---------- */
  .brand{ display:flex; align-items:center; gap:14px; margin-bottom:30px; }
  .mark-wrap{ position:relative; width:60px; height:60px; flex:0 0 auto; display:flex; align-items:center; justify-content:center;
    border-radius:17px; background:linear-gradient(160deg, rgba(168,216,42,.18), rgba(168,216,42,.04));
    border:1px solid rgba(168,216,42,.28); box-shadow:0 10px 34px rgba(168,216,42,.14);
    animation:bob 6s ease-in-out infinite; }
  @keyframes bob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
  .mark-wrap::after{ content:""; position:absolute; inset:-14px; border-radius:50%; background:radial-gradient(closest-side, rgba(168,216,42,.28), transparent 70%); z-index:-1; }
  .mark-wrap img{ width:40px; height:40px; object-fit:contain; display:block; }
  .brand b{ font-family:'Montserrat'; font-weight:900; font-size:23px; color:#fff; letter-spacing:-.02em; line-height:1; }
  .brand .tag{ display:block; font-family:'Montserrat'; font-weight:700; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--lima); margin-top:5px; }

  .eyebrow{ font-family:'Montserrat'; font-weight:700; font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--lima); margin-bottom:10px; }
  h1{ font-family:'Montserrat'; font-weight:800; font-size:32px; line-height:1.1; color:#fff; letter-spacing:-.02em; }
  h1 .j{ color:var(--lima); white-space:nowrap; }
  .lead{ color:var(--mut); font-size:15px; margin-top:13px; line-height:1.5; }

  .btns{ display:flex; flex-direction:column; gap:13px; margin-top:28px; }
  a.btn{ position:relative; display:flex; align-items:center; gap:15px; text-decoration:none; border-radius:16px; padding:17px 20px; overflow:hidden;
    font-family:'Montserrat'; font-weight:700; font-size:17px; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
  a.btn:active{ transform:translateY(1px) scale(.995); }
  .btn .ic{ width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
  .btn .ic svg{ width:22px; height:22px; }
  .btn .tx{ display:flex; flex-direction:column; gap:3px; }
  .btn .tx small{ font-family:'Inter'; font-weight:500; font-size:12.5px; opacity:.78; }
  .btn .go{ margin-left:auto; opacity:.5; transition:transform .14s ease, opacity .14s ease; }
  a.btn:hover .go{ transform:translateX(4px); opacity:.9; }
  .btn.primary{ background:linear-gradient(135deg, #B6E33A, var(--lima)); color:var(--navy); box-shadow:0 14px 36px rgba(168,216,42,.28); }
  .btn.primary .ic{ background:rgba(22,36,78,.16); color:var(--navy); }
  .btn.primary::before{ content:""; position:absolute; top:0; left:-60%; width:40%; height:100%; transform:skewX(-20deg);
    background:linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent); animation:shine 4.5s ease-in-out infinite; }
  @keyframes shine{ 0%,100%{ left:-60%; } 55%,100%{ left:130%; } }
  .btn.ghost{ background:rgba(255,255,255,.055); color:#fff; border:1px solid rgba(255,255,255,.14); backdrop-filter:blur(3px); }
  a.btn.ghost:hover{ border-color:rgba(168,216,42,.5); box-shadow:0 10px 30px rgba(0,0,0,.2); }
  .btn.ghost .ic{ background:rgba(168,216,42,.16); color:var(--lima); }

  .note{ margin-top:26px; display:flex; gap:12px; align-items:flex-start; background:rgba(168,216,42,.1);
    border:1px solid rgba(168,216,42,.3); border-radius:14px; padding:14px 16px; font-size:13.5px; color:#eef5dc; line-height:1.45; }
  .note svg{ width:20px; height:20px; flex:0 0 auto; margin-top:1px; color:var(--lima); }
  .foot{ margin-top:26px; text-align:center; font-family:'Montserrat'; font-weight:600; font-size:12px; color:var(--mut); letter-spacing:.03em; }
</style>
</head>
<body>
  <!-- escena de tienda: productos Apple flotando -->
  <div class="scene" aria-hidden="true">
    <!-- iPhone -->
    <svg class="fl" style="top:9%; left:7%; --r:-10deg; animation-delay:-1s" width="74" height="112" viewBox="0 0 74 112">
      <rect class="pc" x="6" y="4" width="62" height="104" rx="14"/>
      <rect class="pc" x="27" y="9" width="20" height="4" rx="2"/>
      <circle class="pc" cx="37" cy="99" r="5"/>
    </svg>
    <!-- MacBook -->
    <svg class="fl2" style="top:15%; right:6%; --r:9deg" width="132" height="92" viewBox="0 0 132 92">
      <rect class="pw" x="22" y="6" width="88" height="58" rx="6"/>
      <path class="pw" d="M8 72 L124 72 L132 86 L0 86 Z"/>
    </svg>
    <!-- iPad -->
    <svg class="fl" style="bottom:20%; left:5%; --r:7deg; animation-delay:-3s" width="86" height="112" viewBox="0 0 86 112">
      <rect class="pc" x="6" y="4" width="74" height="104" rx="9"/>
      <circle class="pc" cx="43" cy="99" r="4"/>
    </svg>
    <!-- Apple Watch -->
    <svg class="fl2" style="bottom:12%; right:9%; --r:-8deg; animation-delay:-2s" width="68" height="104" viewBox="0 0 68 104">
      <rect class="pc" x="16" y="30" width="36" height="44" rx="11"/>
      <path class="pc" d="M24 30 L26 10 L42 10 L44 30"/>
      <path class="pc" d="M24 74 L26 94 L42 94 L44 74"/>
    </svg>
    <!-- AirPods / case -->
    <svg class="fl" style="top:46%; right:13%; --r:12deg; animation-delay:-4s" width="60" height="60" viewBox="0 0 60 60">
      <rect class="pc" x="16" y="12" width="28" height="36" rx="12"/>
      <line class="pc" x1="30" y1="12" x2="30" y2="30"/>
    </svg>
    <!-- bolsa de compra -->
    <svg class="fl2" style="top:52%; left:10%; --r:-6deg; animation-delay:-1.5s" width="66" height="72" viewBox="0 0 66 72">
      <path class="pc" d="M14 24 L52 24 L56 66 L10 66 Z"/>
      <path class="pc" d="M24 24 V18 a9 9 0 0 1 18 0 V24"/>
    </svg>
    <!-- etiqueta de precio -->
    <svg class="fl" style="bottom:40%; left:44%; --r:18deg; animation-delay:-2.5s" width="56" height="56" viewBox="0 0 56 56">
      <path class="pc" d="M8 8 L30 8 L48 26 L30 44 L8 44 Z"/>
      <circle class="solid" cx="18" cy="20" r="4"/>
    </svg>
  </div>

  <main class="card">
    <div class="brand">
      <span class="mark-wrap"><img src="{{ asset('images/logo-appleboss-marca.png') }}" alt="Apple Boss"></span>
      <div><b>Apple Boss</b><span class="tag">ERP · Tienda en línea</span></div>
    </div>

    <p class="eyebrow">Defensa de grado · Acceso del jurado</p>
    <h1>Bienvenido, <span class="j">Jurado {{ $n }}</span></h1>
    <p class="lead">Explorá el sistema real de Apple Boss. Elegí con qué rol querés entrar.</p>

    <div class="btns">
      <a class="btn primary" href="{{ route('jurado.entrar', ['n' => $n, 'token' => $token, 'rol' => 'admin']) }}">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/></svg></span>
        <span class="tx">Entrar al panel <small>como Administrador · acceso total</small></span>
        <span class="go"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
      <a class="btn ghost" href="{{ route('jurado.entrar', ['n' => $n, 'token' => $token, 'rol' => 'vendedor']) }}">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg></span>
        <span class="tx">Entrar como Vendedor <small>operación del mostrador</small></span>
        <span class="go"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
      <a class="btn ghost" href="{{ url('/') }}">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21V12h6v9"/></svg></span>
        <span class="tx">Ver la tienda en línea <small>la vista del cliente</small></span>
        <span class="go"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </a>
    </div>

    <div class="note">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
      <span><b style="color:#fff">Modo demostración · solo lectura.</b> Podés abrir y escribir en cualquier formulario para verlo funcionar; nada se guarda en el sistema.</span>
    </div>

    <p class="foot">Apple Boss · Cochabamba, Bolivia</p>
  </main>
</body>
</html>
