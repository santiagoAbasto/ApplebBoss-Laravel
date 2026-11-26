<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Acceso del jurado · Apple Boss</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{ --navy:#16244E; --navy2:#20315F; --lima:#A8D82A; --lima-d:#7FA80F; --on:#EAEFFB; --mut:#A7B3D4; }
  *{ box-sizing:border-box; margin:0; }
  body{ min-height:100vh; font-family:'Inter',system-ui,sans-serif; color:var(--on);
    background:
      radial-gradient(1200px 700px at 85% -10%, rgba(168,216,42,.14), transparent 60%),
      radial-gradient(900px 800px at -10% 110%, rgba(46,72,135,.55), transparent 60%),
      var(--navy);
    display:flex; align-items:center; justify-content:center; padding:28px 18px; }
  .card{ width:100%; max-width:460px; }
  .brand{ display:flex; align-items:center; gap:12px; margin-bottom:26px; }
  .mark{ width:42px; height:42px; border-radius:11px; background:var(--lima); display:flex; align-items:center; justify-content:center; }
  .mark svg{ width:24px; height:24px; }
  .brand b{ font-family:'Montserrat'; font-weight:800; font-size:21px; color:#fff; letter-spacing:-.01em; }
  .eyebrow{ font-family:'Montserrat'; font-weight:700; font-size:12.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--lima); margin-bottom:10px; }
  h1{ font-family:'Montserrat'; font-weight:800; font-size:33px; line-height:1.1; color:#fff; letter-spacing:-.015em; }
  .lead{ color:var(--mut); font-size:15px; margin-top:12px; line-height:1.5; }
  .btns{ display:flex; flex-direction:column; gap:13px; margin-top:28px; }
  a.btn{ display:flex; align-items:center; gap:14px; text-decoration:none; border-radius:15px; padding:17px 20px;
    font-family:'Montserrat'; font-weight:700; font-size:17px; transition:transform .12s ease, box-shadow .12s ease; }
  a.btn:active{ transform:translateY(1px); }
  .btn .ic{ width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
  .btn .ic svg{ width:21px; height:21px; }
  .btn .tx{ display:flex; flex-direction:column; gap:2px; }
  .btn .tx small{ font-family:'Inter'; font-weight:500; font-size:12.5px; opacity:.75; }
  .btn.primary{ background:var(--lima); color:var(--navy); box-shadow:0 10px 30px rgba(168,216,42,.22); }
  .btn.primary .ic{ background:rgba(22,36,78,.14); color:var(--navy); }
  .btn.ghost{ background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.14); }
  .btn.ghost .ic{ background:rgba(168,216,42,.16); color:var(--lima); }
  .note{ margin-top:24px; display:flex; gap:11px; align-items:flex-start; background:rgba(168,216,42,.1);
    border:1px solid rgba(168,216,42,.3); border-radius:13px; padding:13px 15px; font-size:13.5px; color:#eef5dc; line-height:1.45; }
  .note svg{ width:19px; height:19px; flex:0 0 auto; margin-top:1px; color:var(--lima); }
  .foot{ margin-top:24px; text-align:center; font-family:'Montserrat'; font-weight:600; font-size:12.5px; color:var(--mut); letter-spacing:.02em; }
</style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="#16244E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.3"/><circle cx="18" cy="7" r="2.3"/><circle cx="12" cy="17" r="2.3"/><path d="M8 7.2 15.6 7.6M7.3 8 11 15M16.5 9 13 15"/></svg></span>
      <b>Apple Boss</b>
    </div>

    <p class="eyebrow">Defensa de grado · Acceso del jurado</p>
    <h1>Bienvenido, Jurado {{ $n }}</h1>
    <p class="lead">Explorá el sistema real de Apple Boss. Elegí con qué rol querés entrar.</p>

    <div class="btns">
      <a class="btn primary" href="{{ route('jurado.entrar', ['n' => $n, 'token' => $token, 'rol' => 'admin']) }}">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/></svg></span>
        <span class="tx">Entrar al panel <small>como Administrador · acceso total</small></span>
      </a>
      <a class="btn ghost" href="{{ route('jurado.entrar', ['n' => $n, 'token' => $token, 'rol' => 'vendedor']) }}">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg></span>
        <span class="tx">Entrar como Vendedor <small>operación del mostrador</small></span>
      </a>
      <a class="btn ghost" href="{{ url('/') }}">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21V12h6v9"/></svg></span>
        <span class="tx">Ver la tienda en línea <small>la vista del cliente</small></span>
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
