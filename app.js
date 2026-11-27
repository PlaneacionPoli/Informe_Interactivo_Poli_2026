(function () {
  var P = window.PDI26, L = P.lineas;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var main = $('#main'), crumb = $('#crumb');
  var KEY = 'pdi26-informe';
  var S = { estado: {}, anio: {}, proyectos: [], demo: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  S.demo = false;
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ estado: S.estado, anio: S.anio, proyectos: S.proyectos })); } catch (e) {} }

  /* ---------- modelo ---------- */
  var metas = [];
  L.forEach(function (l) { l.objetivos.forEach(function (o, oi) { o.metas.forEach(function (m, mi) {
    var id = o.id + '-' + mi; metas.push({ id: id, l: l, o: o, texto: m });
  }); }); });
  function est(id) {
    if (S.demo) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 7; return h % 3; }
    return S.estado[id] || 0;
  }
  function val(v) { return v === 2 ? 1 : v === 1 ? .5 : 0; }
  function pctOf(list) { if (!list.length) return 0; return Math.round(100 * list.reduce(function (a, m) { return a + val(est(m.id)); }, 0) / list.length); }
  function pctLinea(l) { return pctOf(metas.filter(function (m) { return m.l === l; })); }
  function pctObj(o) { return pctOf(metas.filter(function (m) { return m.o === o; })); }
  function pctTotal() { return pctOf(metas); }
  function lin(id) { return L.filter(function (l) { return l.id === id; })[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- componentes ---------- */
  function gauge(p, color, size) {
    var r = 54, c = 2 * Math.PI * r, s = size || 130;
    return '<div class="gauge" style="width:' + s + 'px;height:' + s + 'px"><svg viewBox="0 0 130 130" width="' + s + '" height="' + s + '">' +
      '<circle cx="65" cy="65" r="' + r + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="12"/>' +
      '<circle class="gf" cx="65" cy="65" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + (c * (1 - p / 100)) + '" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/></svg>' +
      '<div class="v">' + p + '<small>%</small></div></div>';
  }
  function bar(p, color) { return '<div class="bar" style="--c:' + color + '"><i data-w="' + p + '"></i></div>'; }
  function animate(root) {
    // setTimeout (no requestAnimationFrame): se ejecuta aunque la pestaña esté en segundo plano
    setTimeout(function () {
      $$('.gf', root).forEach(function (g) { g.style.strokeDashoffset = g.getAttribute('data-off'); });
      $$('.bar i, .bar u', root).forEach(function (b) { if (b.hasAttribute('data-w')) b.style.width = b.getAttribute('data-w') + '%'; });
    }, 60);
  }
  function tile(ic, lb, v, c) { return '<div class="tile" style="--t:' + c + '"><i>' + ic + '</i><u>' + v + '</u>' + lb + '</div>'; }
  function demoBadge() { return S.demo ? '<span class="demo">SIMULACIÓN</span>' : ''; }

  /* ---------- imagen oficial del PDI con zonas interactivas ---------- */
  var HS = { calidad: [48.3, 27], experiencia: [71.7, 53.2], expansion: [49.7, 79.2], sostenible: [24.4, 53.2] };
  function hub() {
    var h = '<div class="hub" id="hub"><img src="img/pdi/diagrama.jpg" alt="Plan de Desarrollo Institucional 2026-2030: las cuatro Líneas Estratégicas alrededor de la comunidad universitaria, dentro del ecosistema humano y transformador">';
    L.forEach(function (l) {
      var p = HS[l.id];
      h += '<button class="hs" data-id="' + l.id + '" style="left:' + p[0] + '%;top:' + p[1] + '%;--c:' + l.color + '" aria-label="' + esc(l.nombre) + '"></button>';
      var left = Math.min(Math.max(p[0], 18), 82);
      h += '<div class="tip" id="tip-' + l.id + '" style="left:' + left + '%;top:' + (p[1] - (l.id === 'expansion' ? 25 : 22)) + '%;--c:' + l.color + '"><b>Línea ' + l.n + ' · ' + l.nombre + '</b><span>' + l.resumen + '</span><em>' + pctLinea(l) + '% de avance · clic para entrar →</em></div>';
    });
    h += '<button class="hs core" data-id="core" style="left:48.6%;top:52.9%;--c:#0F385A" aria-label="Comunidad universitaria: filosofía institucional"></button>';
    return h + '</div>';
  }
  function bindHub(root) {
    var hb = $('#hub', root); if (!hb) return;
    function off() { $$('.tip.show', hb).forEach(function (t) { t.classList.remove('show'); }); }
    $$('.hs', hb).forEach(function (e) {
      var id = e.dataset.id, t = $('#tip-' + id, hb);
      function on() { off(); if (t) t.classList.add('show'); }
      e.addEventListener('mouseenter', on); e.addEventListener('focus', on);
      e.addEventListener('mouseleave', off); e.addEventListener('blur', off);
      e.addEventListener('click', function () { go(id === 'core' ? 'balance' : 'linea/' + id); });
    });
    $$('[data-linea]', root).forEach(function (r) {
      r.addEventListener('mouseenter', function () { var b = $('.hs[data-id="' + r.dataset.linea + '"]', hb); if (b) { b.classList.add('act'); $('#tip-' + r.dataset.linea, hb).classList.add('show'); } });
      r.addEventListener('mouseleave', function () { $$('.hs.act', hb).forEach(function (x) { x.classList.remove('act'); }); off(); });
    });
  }

  /* ---------- vistas ---------- */
  var V = {};
  var IC = {
    ciclo: '<path d="M12 4a8 8 0 1 1-7.5 5.2"/><path d="M4 4v5h5"/><circle cx="12" cy="12" r="2.2"/>',
    avances: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1.4"/>',
    logros: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z"/>',
    planes: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h3M13 14h3M8 17h3"/>',
    proyectos: '<path d="M6 21V4"/><path d="M6 5h11l-2 3.5 2 3.5H6"/>',
    balance: '<path d="M12 4v16M6 20h12"/><path d="M5 8h14"/><path d="M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',
    orgullosamente: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
  };
  var BTN = {
    l: [['ciclo', 'Ciclo de la Estrategia', '4 etapas de construcción del PDI', '#E4006D'], ['avances', 'Avance Líneas Estratégicas', '4 Líneas · 10 Objetivos', '#A6CE00'], ['logros', 'Logros por Línea Estratégica', '22 metas por Línea', '#22B2DE']],
    r: [['planes', 'Planes Anuales de Retos', 'Ruta 2026 – 2030', '#0F385A'], ['proyectos', 'Proyectos Estratégicos', 'Iniciativas por Línea', '#15BECE'], ['balance', 'Balance Institucional', 'Visión global y filosofía', '#F7B400'], ['orgullosamente', 'Orgullosamente POLI', 'Edición 2026', '#E4006D']]
  };
  function orbit() {
    var all = BTN.l.concat(BTN.r), CY = [-.62, 0, .62, -.75, -.25, .25, .75];
    return all.map(function (b, i) {
      var sx = i < 3 ? -1 : 1;
      return '<button class="mod orb ' + (sx < 0 ? 'l' : 'r') + '" data-go="' + b[0] + '" style="--c:' + b[3] + ';--sx:' + sx + ';--cy:' + CY[i] + '">' +
        '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + IC[b[0]] + '</svg><u>0' + (i + 1) + '</u></span>' +
        '<span class="tx"><b>' + b[1] + '</b><small>' + b[2] + '</small></span></button>';
    }).join('');
  }

  V.home = function () {
    return '<div class="home"><div class="home-title"><h1>INFORME DE CIERRE PDI 2026</h1><div class="sub">Planeación y Gestión Institucional</div></div>' +
      '<div class="stage">' + hub() + orbit() + '</div></div>';
  };

  V.ciclo = function () {
    var CX = 600, CY = 350, RX = 318, RY = 262;
    var ICO = {
      lupa: '<circle cx="14" cy="14" r="8"/><path d="M20 20l8 8"/><path d="M10 14a4 4 0 0 1 4-4"/>',
      sello: '<path d="M10 24h20M12 20h16v4H12zM17 20v-4a3 3 0 1 1 6 0v4"/><circle cx="20" cy="9" r="3.5"/><path d="M13 30h14"/>',
      engranaje: '<circle cx="20" cy="20" r="5"/><path d="M20 6v4M20 30v4M6 20h4M30 20h4M10 10l3 3M27 27l3 3M30 10l-3 3M13 27l-3 3"/><circle cx="20" cy="20" r="10"/>',
      grafico: '<path d="M7 33V8M7 33h27"/><path d="M12 28l7-8 5 4 9-12"/><path d="M28 12h5v5"/><rect x="11" y="29" width="0.1" height="0.1"/>',
      flag: '<path d="M10 34V6"/><path d="M10 7h20l-4 6 4 6H10"/><circle cx="29" cy="30" r="3"/>'
    };
    var E = [
      { n: '1.', t: ['ANÁLISIS DEL', 'CONTEXTO'], c: '#E4006D', a: -64, ic: 'lupa', tgt: 'contexto' },
      { n: '2.', t: ['DEFINICIÓN Y', 'APROBACIÓN DE', 'METAS Y RECURSOS'], c: '#A6CE00', a: -6, ic: 'sello', tgt: 'avances' },
      { n: '3.', t: ['IMPLEMENTACIÓN DE', 'PLANES Y PROYECTOS'], c: '#F7B400', a: 62, ic: 'engranaje', tgt: 'proyectos' },
      { n: '4.', t: ['SEGUIMIENTO Y', 'REPORTE DE', 'AVANCES'], c: '#0F385A', a: 138, ic: 'grafico', tgt: 'planes/reporte' },
      { n: '5.', t: ['CIERRE DE METAS,', 'PLANES Y PROYECTOS'], c: '#15BECE', a: 212, ic: 'flag', tgt: 'balance' }
    ];
    var rad = function (d) { return d * Math.PI / 180; };
    var svg = '<svg viewBox="0 0 1200 700" class="ciclo-svg" role="img" aria-label="Ciclo de la Estrategia: cinco etapas en espiral alrededor del PDI 2026-2030"><defs><clipPath id="cc"><circle cx="' + CX + '" cy="' + CY + '" r="156"/></clipPath></defs>';
    svg += '<circle class="pulse" cx="' + CX + '" cy="' + CY + '" r="162" fill="none" stroke="#22B2DE" stroke-width="2" stroke-dasharray="3 9"/>';
    E.forEach(function (e, i) {
      var r = 172 + i * 15, a0 = rad(e.a), a1 = rad(e.a + 250);
      var sx = CX + r * Math.cos(a0), sy = CY + r * Math.sin(a0), ex = CX + r * Math.cos(a1), ey = CY + r * Math.sin(a1);
      var ix = CX + RX * Math.cos(a0), iy = CY + RY * Math.sin(a0);
      svg += '<g class="nd" data-go="' + e.tgt + '" tabindex="0" role="link" aria-label="' + e.n + ' ' + e.t.join(' ') + '" style="--c:' + e.c + ';--d:' + (i * .25) + 's">';
      svg += '<path class="ln" d="M' + ix.toFixed(1) + ',' + iy.toFixed(1) + ' L' + sx.toFixed(1) + ',' + sy.toFixed(1) + '" stroke="' + e.c + '"/>';
      svg += '<path class="arc" pathLength="1" d="M' + sx.toFixed(1) + ',' + sy.toFixed(1) + ' A' + r + ',' + r + ' 0 1,1 ' + ex.toFixed(1) + ',' + ey.toFixed(1) + '" stroke="' + e.c + '"/>';
      svg += '<circle class="dot" cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="7" fill="' + e.c + '"/>';
      svg += '<circle class="ib" cx="' + ix.toFixed(1) + '" cy="' + iy.toFixed(1) + '" r="40" fill="#fff" stroke="' + e.c + '" stroke-width="4"/>';
      svg += '<g transform="translate(' + (ix - 20).toFixed(1) + ',' + (iy - 20).toFixed(1) + ')" fill="none" stroke="#0F385A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICO[e.ic] + '</g>';
      var right = Math.cos(a0) > -0.2, tx = ix + (right ? 54 : -54), anc = right ? 'start' : 'end', ty = iy - (e.t.length - 1) * 9 - 10;
      svg += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + anc + '" class="lbl"><tspan class="num" fill="' + e.c + '" x="' + tx.toFixed(1) + '" dy="0">' + e.n + '</tspan>';
      e.t.forEach(function (ln, k) { svg += '<tspan x="' + tx.toFixed(1) + '" dy="' + (k ? 19 : 21) + '">' + ln + '</tspan>'; });
      svg += '</text></g>';
    });
    svg += '<circle cx="' + CX + '" cy="' + CY + '" r="156" fill="#fff"/><image href="img/pdi/diagrama.jpg" x="' + (CX - 0.49 * 330) + '" y="' + (CY - 0.53 * 286) + '" width="330" height="286" clip-path="url(#cc)" preserveAspectRatio="xMidYMid meet"/><circle cx="' + CX + '" cy="' + CY + '" r="154" fill="none" stroke="#fff" stroke-width="3"/></svg>';
    return '<div class="ciclo-page"><div class="ciclo-left"><div class="ciclo-t">Ciclo<br>de la<br>Estrategia</div><div class="ciclo-bar"></div><p>Sigue la espiral: cada etapa lleva a su sección del informe.</p><button class="pill" data-go="proceso" style="margin-top:14px">Cómo se construyó el PDI →</button></div><div class="ciclo-right">' + svg + '</div></div>';
  };

  V.proceso = function () {
    var h = '<div class="eyebrow">Proceso de construcción</div><h1>Así se construyó el PDI 2026-2030</h1><p class="lead">Cuatro etapas durante un año, con la voz de toda la comunidad. Toca una etapa para ver el detalle.</p><div class="ciclo">';
    P.ciclo.forEach(function (c, i) { h += '<button class="card step" data-i="' + i + '"><div class="num">0' + (i + 1) + '</div><h3>' + c.t + '</h3><div class="sub">' + c.d + '</div><div class="x"><p>' + c.x + '</p></div></button>'; });
    h += '</div><div class="grid" style="grid-template-columns:repeat(4,1fr);margin-top:22px">';
    P.hallazgos.forEach(function (k) { h += '<div class="kpi"><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; });
    h += '</div><div class="tl">'; P.hitos.forEach(function (t) { h += '<div><b>' + t[0] + '</b>' + t[1] + '</div>'; });
    return h + '</div><div class="tabs" style="margin-top:26px"><button class="pill" data-go="ciclo">← Ciclo de la Estrategia</button></div>';
  };

  var CI = {
    dofa: '<rect x="6" y="6" width="26" height="26" rx="6" fill="#0F385A"/><rect x="38" y="6" width="26" height="26" rx="6" fill="#22B2DE"/><rect x="6" y="38" width="26" height="26" rx="6" fill="#E4006D"/><rect x="38" y="38" width="26" height="26" rx="6" fill="#F7B400"/><g fill="#fff" font-weight="900" font-size="15" text-anchor="middle" font-family="Montserrat,sans-serif"><text x="19" y="25">F</text><text x="51" y="25">O</text><text x="19" y="57">D</text><text x="51" y="57">A</text></g>',
    pestel: '<polygon points="35,5 61,20 61,50 35,65 9,50 9,20" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><g fill="#fff"><circle cx="35" cy="5" r="5"/><circle cx="61" cy="20" r="5"/><circle cx="61" cy="50" r="5"/><circle cx="35" cy="65" r="5"/><circle cx="9" cy="50" r="5"/><circle cx="9" cy="20" r="5"/></g><circle cx="35" cy="35" r="11" fill="none" stroke="#fff" stroke-width="4"/><path d="M24 35h22M35 24c5 6 5 16 0 22M35 24c-5 6-5 16 0 22" fill="none" stroke="#fff" stroke-width="2.5"/>'
  };
  function ctxHead(k, titulo, sub) {
    var bg = k === 'dofa' ? '#fff' : '#15BECE';
    return '<div class="chead"><span class="cico" style="background:' + (k === 'dofa' ? '#fff;box-shadow:inset 0 0 0 3px #0F385A' : bg) + '"><svg viewBox="0 0 70 70">' + CI[k] + '</svg></span><div><div class="eyebrow">Análisis del contexto</div><h1>' + titulo + '</h1><p class="lead" style="margin-top:6px">' + sub + '</p></div><button class="pill" data-go="contexto" style="margin-left:auto">← DOFA · PESTEL</button></div>';
  }
  V.contexto = function () {
    return '<div class="eyebrow">Etapa 1 · Análisis del contexto</div><h1>Elige el análisis</h1><p class="lead">Diagnóstico estratégico del PDI 2026-2030: insumo para la formulación de las Líneas.</p>' +
      '<div class="pick">' +
      '<button class="pk" data-go="dofa" style="--c:#0F385A"><span class="cico big" style="background:#fff;box-shadow:inset 0 0 0 4px #0F385A"><svg viewBox="0 0 70 70">' + CI.dofa + '</svg></span><b>DOFA</b><small>Fortalezas · Oportunidades · Debilidades · Amenazas<br>30 factores internos y externos</small><i>Abrir →</i></button>' +
      '<button class="pk" data-go="pestel" style="--c:#15BECE"><span class="cico big" style="background:#15BECE"><svg viewBox="0 0 70 70">' + CI.pestel + '</svg></span><b>PESTEL</b><small>Político · Económico · Social · Tecnológico · Ecológico · Legal<br>18 temas con su efecto: oportunidad, amenaza o mixto</small><i>Abrir →</i></button></div>' +
      '<div class="tabs"><button class="pill" data-go="pei">Desafíos del PEI → Líneas</button></div>';
  };
  V.dofa = function () { return ctxHead('dofa', 'DOFA institucional', 'Actualización 2026: factores internos y externos del Poli.') + '<div id="ctx"></div>'; };
  V.pestel = function () { return ctxHead('pestel', 'PESTEL institucional', 'Actualización 2026: impacto político, económico, social, tecnológico, ecológico y legal.') + '<div id="ctx"></div>'; };
  V.pei = function () { return '<div class="eyebrow">Análisis del contexto</div><h1>Desafíos del PEI y las Líneas</h1><div style="margin-top:16px" id="ctx"></div><div class="tabs"><button class="pill" data-go="contexto">← DOFA · PESTEL</button></div>'; };

  /* ---------- DOFA 2026 interactivo (sin códigos ni proyectos) ---------- */
  var DS = { foco: '', sel: '' };
  function dofa() {
    var D = P.dofa26, order = ['F', 'O', 'D', 'A'];
    function quad(k) {
      var q = D[k];
      var rows = q.items.map(function (x) {
        return '<button class="fr' + (DS.sel === x[0] ? ' sel' : '') + '" data-fx="' + x[0] + '"><i class="bd"></i><span class="nm">' + x[1] + '</span></button>';
      }).join('');
      return '<section class="dq' + (DS.foco === k ? ' focus' : '') + '" style="--c:' + q.color + ';--tx:' + q.tx + '"><header><button class="dpill" data-q="' + k + '" title="Enfocar este cuadrante">' + q.nombre + '</button><span class="dmeta">' + q.items.length + ' factores</span><span class="dest">Estrategia · ' + q.estrategia + '</span></header><div class="rows">' + rows + '</div></section>';
    }
    return '<div class="dctl"><span class="dl">DOFA 2026</span><input id="dq" type="search" placeholder="Buscar un factor…" aria-label="Buscar un factor">' +
      (DS.foco ? '<button class="pill" id="dfoco">Ver los 4 cuadrantes</button>' : '<span class="dhint">Toca el nombre de un cuadrante para enfocarlo</span>') + '</div>' +
      '<div class="dgrid' + (DS.foco ? ' has-focus' : '') + '"><div class="dax x1">INTERNO</div><div class="dax x2">EXTERNO</div>' + order.map(quad).join('') + '</div><div class="ddet" id="ddet">' + dofaDet() + '</div>';
  }
  function dofaDet() {
    if (!DS.sel) return '<span>Toca un factor para destacarlo y ver a qué cuadrante y estrategia pertenece.</span>';
    var D = P.dofa26, f, q;
    Object.keys(D).forEach(function (k) { D[k].items.forEach(function (x) { if (x[0] === DS.sel) { f = x; q = D[k]; } }); });
    return '<span class="dchip" style="background:' + q.color + ';color:' + q.tx + '">' + q.nombre + '</span><b>' + f[1] + '</b><span>Estrategia: <strong>' + q.estrategia + '</strong></span>';
  }
  function bindDofa() {
    var re = function () { var v = ($('#dq') || {}).value; ctx('dofa'); if (v) { $('#dq').value = v; filtra(v); } };
    function filtra(v) { v = v.toLowerCase(); $$('.fr').forEach(function (r) { r.style.display = r.textContent.toLowerCase().indexOf(v) < 0 ? 'none' : ''; }); }
    $('#dq').oninput = function () { filtra(this.value); };
    var fo = $('#dfoco'); if (fo) fo.onclick = function () { DS.foco = ''; re(); };
    $$('.dpill').forEach(function (b) { b.onclick = function () { DS.foco = DS.foco === b.dataset.q ? '' : b.dataset.q; re(); }; });
    $$('.fr').forEach(function (b) { b.onclick = function () { DS.sel = DS.sel === b.dataset.fx ? '' : b.dataset.fx; re(); }; });
  }


  /* ---------- PESTEL 2026 interactivo ---------- */
  var PS = { f: 0, tag: '' };
  var TG = { O: ['Oportunidad', '#A6CE00', '#0F385A'], A: ['Amenaza', '#F7B400', '#0F385A'], M: ['Mixto', '#0F385A', '#fff'] };
  var PI = [
    '<path d="M6 16h28M8 16V30M15 16V30M25 16V30M32 16V30M5 32h30M20 6l15 8H5z"/>',
    '<path d="M8 30l8-9 6 5 11-14"/><path d="M26 12h7v7"/><ellipse cx="12" cy="9" rx="6" ry="2.5"/><path d="M6 9v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V9"/>',
    '<circle cx="20" cy="13" r="5"/><circle cx="8" cy="17" r="3.5"/><circle cx="32" cy="17" r="3.5"/><path d="M10 33c0-6 4-10 10-10s10 4 10 10zM2 30c0-4 2-6 6-6M38 30c0-4-2-6-6-6"/>',
    '<rect x="11" y="11" width="18" height="18" rx="3"/><rect x="16" y="16" width="8" height="8" rx="1"/><path d="M15 6v5M20 6v5M25 6v5M15 29v5M20 29v5M25 29v5M6 15h5M6 20h5M6 25h5M29 15h5M29 20h5M29 25h5"/>',
    '<path d="M32 6C14 6 8 16 8 26c0 3 1 5 3 7 2 2 5 3 8 3 10 0 13-12 13-30z"/><path d="M10 32C16 22 22 16 28 12"/>',
    '<path d="M20 6v26M10 34h20M8 12h24"/><path d="M8 12l-5 10a5 5 0 0 0 10 0zM32 12l-5 10a5 5 0 0 0 10 0z"/>'
  ];
  var PC = [['#0F385A', '#fff'], ['#E4006D', '#fff'], ['#22B2DE', '#fff'], ['#15BECE', '#0F385A'], ['#A6CE00', '#0F385A'], ['#F7B400', '#0F385A']];
  function pcount(f) { var c = { O: 0, A: 0, M: 0 }; f.temas.forEach(function (t) { t[1].forEach(function (x) { c[x[1]]++; }); }); return c; }
  function pestel() {
    var F = P.pestel26, cur = F[PS.f], tot = { O: 0, A: 0, M: 0 };
    F.forEach(function (f) { var c = pcount(f); for (var k in c) tot[k] += c[k]; });
    var tabs = F.map(function (f, i) {
      var c = pcount(f), n = c.O + c.A + c.M;
      return '<button class="ptab' + (i === PS.f ? ' on' : '') + '" data-i="' + i + '" style="--pc:' + PC[i][0] + ';--pt:' + PC[i][1] + '"><span class="pic"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + PI[i] + '</svg></span><b>' + f.n + '</b>' +
        '<span class="pmix"><i style="flex:' + c.O + ';background:#A6CE00"></i><i style="flex:' + c.A + ';background:#F7B400"></i><i style="flex:' + c.M + ';background:#0F385A"></i></span><small>' + n + ' factores</small></button>';
    }).join('');
    var chips = ['', 'O', 'A', 'M'].map(function (k) {
      var lb = k ? TG[k][0] + ' (' + tot[k] + ')' : 'Todos (' + (tot.O + tot.A + tot.M) + ')';
      return '<button class="tchip' + (PS.tag === k ? ' on' : '') + '" data-t="' + k + '"' + (k ? ' style="--tc:' + TG[k][1] + ';--tt:' + TG[k][2] + '"' : '') + '>' + lb + '</button>';
    }).join('');
    var cards = cur.temas.map(function (t, ti) {
      return '<article class="ptema" style="--pc:' + PC[PS.f][0] + ';--pt:' + PC[PS.f][1] + '"><header><span class="pic sm"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + PI[PS.f] + '</svg></span><h3>' + t[0] + '</h3></header><ul>' +
        t[1].map(function (x) { var g = TG[x[1]], off = PS.tag && PS.tag !== x[1]; return '<li class="pit' + (off ? ' off' : '') + '"><span class="ptag" style="background:' + g[1] + ';color:' + g[2] + '" title="' + g[0] + '">' + x[1] + '</span><span>' + x[0] + '</span></li>'; }).join('') + '</ul></article>';
    }).join('');
    var c = pcount(cur);
    return '<div class="ptabs">' + tabs + '</div><div class="pbar"><div class="pchips">' + chips + '</div><span class="pleg"><b style="background:#A6CE00"></b>O = Oportunidad <b style="background:#F7B400"></b>A = Amenaza <b style="background:#0F385A"></b>M = Mixto</span></div>' +
      '<h2 class="ptit" style="--pc:' + PC[PS.f][0] + ';--pt:' + PC[PS.f][1] + '"><span>' + cur.l + '</span> Impacto ' + cur.n.toLowerCase() + ' <em>' + c.O + ' O · ' + c.A + ' A · ' + c.M + ' M</em></h2><div class="pgrid">' + cards + '</div>';
  }
  function bindPestel() {
    $$('.ptab').forEach(function (b) { b.onclick = function () { PS.f = +b.dataset.i; ctx('pestel'); }; });
    $$('.tchip').forEach(function (b) { b.onclick = function () { PS.tag = PS.tag === b.dataset.t ? '' : b.dataset.t; ctx('pestel'); }; });
  }
  function ctx(t) {
    var h = '';
    if (t === 'dofa') {
      h = dofa();
    } else if (t === 'pestel') {
      h = pestel();
    } else {
      h = '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">' + P.pei.map(function (p) {
        return '<div class="card"><h3>' + p[0] + '</h3><div class="chips">' + p.slice(1).map(function (id) { var l = lin(id); return '<button class="chip" data-go="linea/' + id + '" style="border-color:' + l.color + ';color:' + l.color + '">' + l.nombre + '</button>'; }).join('') + '</div></div>';
      }).join('') + '</div>';
    }
    $('#ctx').innerHTML = h;
    if (t === 'dofa') bindDofa();
    if (t === 'pestel') bindPestel();
  }

  V.avances = function () {
    var cards = L.map(function (l) {
      var p = Math.min(100, Math.round(cmiProm(l) || 0)), nm = cmiAll(l).length;
      return '<button class="avc" data-linea="' + l.id + '" data-go="linea/' + l.id + '" style="--c:' + l.color + '"><div class="avc-g">' + gauge(p, l.color, 74) + '</div><div class="avc-t"><i>Línea ' + l.n + '</i><b>' + l.nombre + '</b><span>' + l.resumen + '</span><small>' + l.objetivos.length + ' objetivos · ' + nm + ' indicadores CMI</small></div><em>→</em></button>';
    }).join('');
    return '<div class="av-page"><div class="av-band"><h1>AVANCE LÍNEAS ESTRATÉGICAS 2026 ' + demoBadge() + '</h1><span class="av-hint">✦ Clic sobre cada línea del diagrama</span><button class="pill' + (S.demo ? ' on' : '') + '" id="demoBtn">Simular avance (demo)</button><button class="pill" data-go="objetivos">Objetivos estratégicos →</button></div>' +
      '<div class="av-body"><div class="av-hub">' + hub() + '</div><div class="av-cards">' + cards + '</div></div></div>';
  };

  V.logros = function () {
    var h = '<div class="eyebrow">Logros por Línea Estratégica</div><h1>Metas del PDI 2026-2030</h1><p class="lead">Registra el estado y el año objetivo de cada meta; alimentan Avance, Planes Anuales y Balance.</p>';
    L.forEach(function (l) { h += '<h2 style="margin:26px 0 10px;color:' + l.color + '">' + l.n + '. ' + l.nombre + '</h2><div class="card accent" style="--c:' + l.color + '">' + metaList(l) + '</div>'; });
    return h;
  };
  function seg(id) { var v = est(id); return '<div class="seg" data-m="' + id + '">' + [['0', 'Pendiente'], ['1', 'En curso'], ['2', 'Cumplida']].map(function (b) { return '<button data-v="' + b[0] + '" class="' + (v == b[0] ? 'on' : '') + '">' + b[1] + '</button>'; }).join('') + '</div>'; }
  function yearSel(id) { var y = S.anio[id] || ''; return '<select data-y="' + id + '" aria-label="Año objetivo"><option value="">Año…</option>' + [2026, 2027, 2028, 2029, 2030].map(function (a) { return '<option' + (y == a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>'; }
  function metaList(l) {
    return l.objetivos.map(function (o) {
      return '<div class="obj"><h3>Objetivo · ' + o.nombre + '</h3>' + o.metas.map(function (m, i) { var id = o.id + '-' + i; return '<div class="meta"><p>' + m + '</p>' + yearSel(id) + seg(id) + '</div>'; }).join('') + '</div>';
    }).join('');
  }

  V.linea = function (id) {
    var l = lin(id); if (!l) return V.home();
    var ind = cmiAll(l), prom = cmiProm(l), real = pavg(l, 'real'), esp = pavg(l, 'esperado'), nP = pr().filter(function (p) { return p.linea === l.id; }).length;
    var h = '<div class="ln-band" style="--c:' + l.color + '"><span class="ln-no">0' + l.n + '</span><h1>' + l.nombre.toUpperCase() + '</h1><button class="pill" data-go="avances">← Líneas</button></div>' +
      '<div class="ln-top"><div class="card"><h3 class="ln-h">AVANCE</h3><div class="tiles" style="margin:6px 0 14px">' + tile('◔', 'Avance real', real == null ? '—' : real + '%', '#22B2DE') + tile('◐', 'Avance esperado', esp == null ? '—' : esp + '%', '#F7B400') + tile('⚑', 'Cumplimiento CMI', prom == null ? '—' : Math.round(prom) + '%', '#A6CE00') + '</div>' +
      '<p class="note" style="margin:0 0 10px">Avance real y esperado: promedio de los proyectos PMO de la línea (Asana). Cumplimiento: promedio del CMI Estratégico (SGING).</p>' +
      '<div class="ln-cnt"><div><b>' + l.objetivos.length + '</b><span># OBJETIVOS</span></div><div><b>' + ind.length + '</b><span># INDICADORES</span></div><div><b>' + nP + '</b><span># PROYECTOS</span></div></div></div>' +
      '<div class="card accent" style="--c:' + l.color + '"><h3 class="ln-h">PROYECTOS PMO · ' + nP + ' EN ASANA</h3><div id="gwrap">' + gantt(pr().filter(function (p) { return p.linea === l.id; })) + '</div><p class="note" style="margin:10px 0 0">Toca un proyecto para abrir su ficha.</p></div></div>' +
      '<div class="ln-cmi" style="--c:' + l.color + '">CMI ESTRATÉGICO</div><div class="ln-objs">';
    l.objetivos.forEach(function (o) {
      var rows = ind.filter(function (x) { return objDe(l, x.objetivo) === o; });
      if (!rows.length) { h += '<section class="ln-obj" style="--c:' + l.color + '"><header>' + o.nombre + '</header><div class="empty" style="margin:12px">Sin indicadores estratégicos asignados a este objetivo.</div></section>'; return; }
      var metas = {}, orden = [];
      rows.forEach(function (x) { var k = x.meta_estrategica || 'Sin meta estratégica asignada'; if (!metas[k]) { metas[k] = []; orden.push(k); } metas[k].push(x); });
      h += '<section class="ln-obj" style="--c:' + l.color + '"><header>' + o.nombre + '</header><div class="cm-th"><span>Indicador</span><span>Meta</span><span>Ejecución</span><span>Cumplimiento</span></div>';
      orden.forEach(function (k) {
        h += '<div class="cm-meta">' + esc(k) + '</div>';
        metas[k].forEach(function (x) { var hs = cmiHijos(x.id); h += cmRow(x, false, '', hs.length); hs.forEach(function (y) { h += cmRow(y, true, x.id); }); });
      });
      h += '</section>';
    });
    h += '</div><p class="note">Fuente: ' + ((P.cmiMeta && P.cmiMeta.fuente) || 'SGING') + ' · extraído el ' + ((P.cmiMeta && P.cmiMeta.extraido) || '') + '. Semáforo: <b style="color:' + NIVC.Peligro + '">Peligro</b> &lt; 80% · <b style="color:#b98400">Alerta</b> 80–100% · <b style="color:' + NIVC.Cumplimiento + '">Cumplimiento</b> 100–105% · <b style="color:' + NIVC.Sobrecumplimiento + '">Sobrecumplimiento</b> ≥ 105%.</p>';
    return h;
  };

  V.objetivos = function () {
    var h = '<div class="eyebrow">Objetivos Estratégicos</div><h1>10 Objetivos, 4 Líneas</h1><p class="lead">Los Objetivos operacionalizan cada Línea en planes, proyectos e indicadores.</p><div class="tabs"><button class="pill on" data-f="all">Todos</button>' +
      L.map(function (l) { return '<button class="pill" data-f="' + l.id + '" style="border-color:' + l.color + '">' + l.n + ' · ' + l.nombre + '</button>'; }).join('') + '</div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))" id="objs">';
    var n = 0;
    L.forEach(function (l) { l.objetivos.forEach(function (o, i) { n++; h += '<div class="card accent" data-l="' + l.id + '" style="--c:' + l.color + '"><div class="eyebrow" style="color:' + l.color + '">Objetivo ' + n + ' · Línea ' + l.n + '</div><h3>' + o.nombre + '</h3><ul>' + o.metas.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul><div style="margin-top:12px;font-size:11px;display:flex;justify-content:space-between"><span>Avance</span><b>' + pctObj(o) + '%</b></div>' + bar(pctObj(o), l.color) + '</div>'; }); });
    return h + '</div>';
  };

  /* ---------- Reporte anual institucional · Retos (SGING: Plan de retos.xlsx) ---------- */
  function nivelRetos(c) { return c == null ? 'Sin dato' : c < 80 ? 'Peligro' : c < 95 ? 'Alerta' : c <= 100 ? 'Cumplimiento' : 'Sobrecumplimiento'; }
  function pc0(v) { return v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('es-CO') + '%'; }
  function chipC(c) { return '<b class="cm-c ch-n" title="Cumplimiento respecto a lo esperado al corte">' + (c == null ? '—' : Math.round(c) + '%') + '</b>'; }
  function lineaDe(nombre) { return L.filter(function (x) { return x.nombre === nombre; })[0] || { id: '', color: '#0F385A', n: '' }; }

  /* ---------- Planes anuales de retos: menú + 4 secciones (datos: Base de Retos, Excel) ---------- */
  var PT = { tipo: '', orden: 'cum' };
  var PICO = {
    reporte: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    unidades: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="9" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4M12 12v4"/>',
    lineas: '<path d="M3 6l5 6-5 6M10 6l5 6-5 6M17 6l5 6-5 6"/>',
    objetivos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'
  };
  var PSEC = { reporte: ['Reporte anual institucional', '#22B2DE'], unidades: ['Unidad · Área', '#E4006D'], lineas: ['Líneas estratégicas', '#A6CE00'], objetivos: ['Objetivos estratégicos', '#F7B400'] };
  function picoTile(k) { return '<span class="pico" style="--c:' + PSEC[k][1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + PICO[k] + '</svg></span>'; }
  function psHead(k, R) { return '<div class="ps-head"><div class="ps-lab"><span>' + PSEC[k][0] + '</span></div>' + picoTile(k) + '<span class="ps-corte">Corte ' + fcorte(R) + '</span><button class="pill" data-go="planes" style="margin-left:auto">← Menú de retos</button></div>'; }
  function fcorte(R) { return R.corte ? new Date(R.corte + 'T00:00:00Z').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''; }
  function ring(r, sw, pct, color) { var c = 2 * Math.PI * r; return '<circle cx="160" cy="160" r="' + r + '" fill="none" stroke="rgba(15,56,90,.08)" stroke-width="' + sw + '"/><circle class="gf" cx="160" cy="160" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + (c * (1 - Math.min(100, pct || 0) / 100)) + '" style="transition:stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)"/>'; }

  function ssReporte(R) {
    var I = R.institucional, brecha = (I.real != null && I.esperado != null) ? Math.round((I.real - I.esperado) * 10) / 10 : null;
    return psHead('reporte', R) + '<div class="in-wrap"><div class="in-rings"><svg viewBox="0 0 320 320" role="img" aria-label="Avance real ' + pc0(I.real) + ' frente al esperado ' + pc0(I.esperado) + '"><g transform="rotate(-90 160 160)">' + ring(136, 24, I.esperado, '#F7B400') + ring(104, 24, I.real, '#E4006D') + '</g><text x="160" y="158" text-anchor="middle" font-size="46" font-weight="900" fill="#0F385A">' + (I.cumplimiento == null ? '—' : Math.round(I.cumplimiento) + '%') + '</text><text x="160" y="184" text-anchor="middle" font-size="12" font-weight="800" fill="#5b6f86" letter-spacing="2">CUMPLIMIENTO</text></svg>' +
      '<div class="in-leg"><span><i style="background:#E4006D"></i>Avance real ' + pc0(I.real) + '</span><span><i style="background:#F7B400"></i>Avance esperado ' + pc0(I.esperado) + '</span></div></div>' +
      '<div class="in-side"><div class="in-big"><span class="in-flag">⚑</span><div><b>' + I.planes + '</b><small>TOTAL DE PLANES ANUALES</small></div></div>' +
      '<div class="in-st"><div style="--c:#E4006D"><small>Avance real</small><b>' + pc0(I.real) + '</b></div><div style="--c:#F7B400"><small>Avance esperado</small><b>' + pc0(I.esperado) + '</b></div><div style="--c:#0F385A"><small>Cumplimiento</small><b>' + pc0(I.cumplimiento) + '</b></div></div>' +
      '<p class="in-note">' + (brecha == null ? '' : 'Diferencia frente a lo esperado al corte: <b>' + (brecha > 0 ? '+' : '') + brecha.toLocaleString('es-CO') + ' pp</b>. ') + 'El avance se mide contra el cronograma de cada plan, por eso no se clasifica por niveles.</p></div></div>';
  }

  function ssLineas(R) {
    var pos = { sostenible: ['l', 53], expansion: ['l', 79], calidad: ['r', 27], experiencia: ['r', 53] };
    var cs = { l: '', r: '' };
    R.lineas.forEach(function (l) {
      var ln = lineaDe(l.nombre), p = pos[ln.id]; if (!p) return;
      cs[p[0]] += '<button class="lc" data-go="linea/' + ln.id + '" style="--c:' + ln.color + ';top:' + p[1] + '%"><b>' + pc0(l.real) + '</b><span>' + esc(l.nombre) + '</span><i class="bar" style="--c:' + ln.color + '"><u data-w="' + Math.min(100, l.real || 0) + '"></u></i><small>Avance real · esperado ' + pc0(l.esperado) + '</small></button>';
    });
    return psHead('lineas', R) + '<div class="lh"><div class="lh-col l">' + cs.l + '</div><div class="lh-hub"><img src="img/pdi/diagrama.jpg" alt="PDI 2026-2030"></div><div class="lh-col r">' + cs.r + '</div></div><p class="note" style="text-align:center">Toca una línea para abrir su detalle (CMI y proyectos).</p>';
  }

  function ssObjetivos(R) {
    var pos = { sostenible: ['l', 66], calidad: ['r', 17], experiencia: ['r', 52], expansion: ['r', 86] };
    var cs = { l: '', r: '' }, hs = '';
    R.lineas.forEach(function (l) {
      var ln = lineaDe(l.nombre), p = pos[ln.id]; if (!p) return;
      var h = HS[ln.id];
      hs += '<button class="hs" data-id="' + ln.id + '" style="left:' + h[0] + '%;top:' + h[1] + '%;--c:' + ln.color + '" aria-label="' + esc(l.nombre) + '"></button>';
      cs[p[0]] += '<section class="ob-blk" data-linea="' + ln.id + '" style="--c:' + ln.color + ';top:' + p[1] + '%"><ul>' + l.objetivos.map(function (o) { return '<li><span>' + esc(o.nombre) + '</span><b>' + pc0(o.real) + '</b></li>'; }).join('') + '</ul></section>';
    });
    return psHead('objetivos', R) + '<div class="lh ob-stage"><div class="lh-col l">' + cs.l + '</div><div class="lh-hub"><img src="img/pdi/diagrama.jpg" alt="PDI 2026-2030">' + hs + '</div><div class="lh-col r">' + cs.r + '</div></div><p class="note" style="text-align:center">Avance real de cada objetivo al corte. Pasa el cursor por una línea del diagrama o por su bloque para resaltarla.</p>';
  }

  function sgauge(v, color) {
    var d = 'M10 62 A50 50 0 0 1 110 62';
    return '<svg viewBox="0 0 120 72" class="sg"><path d="' + d + '" fill="none" stroke="rgba(15,56,90,.1)" stroke-width="13" stroke-linecap="round"/>' + (v == null ? '' : '<path class="sg-v" d="' + d + '" pathLength="100" fill="none" stroke="' + color + '" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + Math.min(100, v) + ' 100"/>') + '<text x="60" y="58" text-anchor="middle" font-size="25" font-weight="900" fill="#0F385A">' + (v == null ? '—' : Math.round(v) + '%') + '</text></svg>';
  }
  function dif(u) { if (u.real == null || u.esperado == null) return '—'; var d = Math.round((u.real - u.esperado) * 10) / 10; return (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toLocaleString('es-CO') + ' pp'; }
  function ssUnidades(R) {
    var tipos = []; R.unidades.forEach(function (u) { if (u.tipo && tipos.indexOf(u.tipo) < 0) tipos.push(u.tipo); });
    var list = R.unidades.filter(function (u) { return !PT.tipo || u.tipo === PT.tipo; }).slice();
    var key = { cum: 'cumplimiento', real: 'real' }[PT.orden];
    list.sort(function (a, b) { if (!key) return a.nombre.localeCompare(b.nombre, 'es'); var x = a[key], y = b[key]; return (y == null ? -1 : y) - (x == null ? -1 : x); });
    var chT = '<button class="tchip' + (!PT.tipo ? ' on' : '') + '" data-ut="">Todas (' + R.unidades.length + ')</button>' + tipos.map(function (t) { return '<button class="tchip' + (PT.tipo === t ? ' on' : '') + '" data-ut="' + esc(t) + '">' + esc(t) + ' (' + R.unidades.filter(function (u) { return u.tipo === t; }).length + ')</button>'; }).join('');
    var chO = [['cum', 'Cumplimiento'], ['real', 'Avance real'], ['az', 'A – Z']].map(function (o) { return '<button class="' + (PT.orden === o[0] ? 'on' : '') + '" data-uo="' + o[0] + '">' + o[1] + '</button>'; }).join('');
    var chV = [['cards', 'Tarjetas'], ['tabla', 'Tabla']].map(function (o) { return '<button class="' + ((PT.vista || 'cards') === o[0] ? 'on' : '') + '" data-uv="' + o[0] + '">' + o[1] + '</button>'; }).join('');
    var cuerpo;
    if ((PT.vista || 'cards') === 'tabla') {
      cuerpo = '<div class="ut-wrap"><table class="ut"><thead><tr><th>Unidad / área</th><th>Tipo</th><th>Avance real</th><th>Avance esperado</th><th>Diferencia</th><th>Cumplimiento</th></tr></thead><tbody>' + list.map(function (u) { return '<tr><td><b>' + esc(u.nombre) + '</b></td><td>' + esc(u.tipo) + '</td><td>' + pc0(u.real) + '</td><td>' + pc0(u.esperado) + '</td><td>' + dif(u) + '</td><td><b>' + pc0(u.cumplimiento) + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
    } else {
      cuerpo = '<div class="ug">' + list.map(function (u) {
        return '<article class="uc"><header><b>' + esc(u.nombre) + '</b><small>' + esc(u.tipo) + '</small></header><div class="ug2"><figure>' + sgauge(u.real, '#E4006D') + '<figcaption>Avance <b>real</b></figcaption></figure><figure>' + sgauge(u.esperado, '#F7B400') + '<figcaption>Avance <b>esperado</b></figcaption></figure></div>' +
          '<footer><span><small>Diferencia</small><b>' + dif(u) + '</b></span><span><small>Cumplimiento</small><b>' + pc0(u.cumplimiento) + '</b></span></footer></article>';
      }).join('') + '</div>';
    }
    return psHead('unidades', R) + '<div class="pbar"><div class="pchips">' + chT + '</div><div class="seg2" style="margin-left:auto">' + chO + '</div><div class="seg2">' + chV + '</div></div>' + cuerpo +
      '<p class="note">Diferencia = avance real − avance esperado al corte, en puntos porcentuales. El avance depende del cronograma de cada plan.</p>';
  }

  function menuRetos(R) {
    var I = R.institucional, reales = R.lineas.map(function (l) { return l.real; }).filter(function (v) { return v != null; });
    var nObj = R.lineas.reduce(function (a, l) { return a + l.objetivos.length; }, 0), oreal = [].concat.apply([], R.lineas.map(function (l) { return l.objetivos.map(function (o) { return o.real; }); })).filter(function (v) { return v != null; });
    var rng = function (v) { return v.length ? Math.round(Math.min.apply(null, v)) + '% – ' + Math.round(Math.max.apply(null, v)) + '%' : '—'; };
    var P4 = [
      ['reporte', pc0(I.cumplimiento), 'cumplimiento · ' + I.planes + ' planes anuales'],
      ['lineas', rng(reales), 'avance real en las ' + R.lineas.length + ' líneas'],
      ['objetivos', nObj + ' objetivos', 'avance real de ' + rng(oreal)],
      ['unidades', R.unidades.length + ' unidades', 'rectoría, vicerrectorías, gerencias y direcciones']
    ];
    return '<div class="rm-top"><div class="ps-lab"><span>Planes anuales de retos</span></div><span class="ps-corte">PDI 2026-2030 · Corte ' + fcorte(R) + '</span></div><h1 class="rm-h">¿Qué quieres revisar?</h1>' +
      '<div class="rm-grid">' + P4.map(function (x, i) { return '<button class="rm" data-go="planes/' + x[0] + '" style="--c:' + PSEC[x[0]][1] + '"><span class="rm-no">0' + (i + 1) + '</span>' + picoTile(x[0]) + '<b class="rm-t">' + PSEC[x[0]][0] + '</b><span class="rm-k">' + x[1] + '</span><small>' + x[2] + '</small><i class="rm-go">Abrir →</i></button>'; }).join('') + '</div>';
  }

  V.planes = function (sec) {
    var R = P.retos;
    if (!R) return '<div class="eyebrow">Planes Anuales de Retos</div><h1>Retos</h1><div class="empty" style="margin-top:20px">No hay datos de retos cargados (2026/retos.js).</div>';
    var f = { reporte: ssReporte, lineas: ssLineas, objetivos: ssObjetivos, unidades: ssUnidades }[sec];
    return f ? f(R) : menuRetos(R);
  };

  /* ---------- CMI Estratégico (SGING) ---------- */
  var NIVC = { 'Peligro': '#D33', 'Alerta': '#F7B400', 'Cumplimiento': '#3A9D23', 'Sobrecumplimiento': '#2F6FD6', 'Sin dato': '#9AA9BA' };
  function esHijo(x) { var i = x.id.indexOf('.'); return i > 0 && (P.cmi || []).some(function (y) { return y.id === x.id.slice(0, i); }); }
  function cmiHijos(id) { return (P.cmi || []).filter(function (x) { return x.id.indexOf(id + '.') === 0; }); }
  function cmiAll(l) { return (P.cmi || []).filter(function (x) { return (!l || x.linea === l.id) && !esHijo(x); }); }
  function cmRow(x, sub, padre, nh) {
    var c = x.cumplimiento, col = NIVC[x.nivel] || '#9AA9BA';
    var tg = nh ? '<button class="cm-tg" data-cm="' + x.id + '" aria-expanded="false" aria-label="Ver desgloses de ' + esc(x.indicador) + '"><i>▸</i></button>' : '';
    return '<div class="cm-row' + (sub ? ' cm-sub' : '') + '"' + (sub ? ' data-p="' + padre + '" hidden' : '') + '><span class="cm-i">' + tg + '<span class="cm-n">' + esc(x.indicador) + (nh ? ' <em class="cm-bd">' + nh + ' desgloses</em>' : '') + '<small>' + (x.corte ? 'Corte ' + x.corte + ' ' + (P.cmiMeta ? P.cmiMeta.anio : '') : 'Pendiente de reporte') + '</small></span></span><span>' + fv(x.meta, x.signo, x.dec_meta) + '</span><span>' + fv(x.ejecucion, x.signo_ej || x.signo, x.dec_ej) + '</span><b class="cm-c" style="--n:' + col + '" title="' + x.nivel + '">' + (c == null ? '—' : Math.round(c) + '%') + '</b></div>';
  }
  function cmiProm(l) { var v = cmiAll(l).filter(function (x) { return x.cumplimiento != null; }); return v.length ? v.reduce(function (a, x) { return a + x.cumplimiento; }, 0) / v.length : null; }
  function cmiTxt(l) { var p = cmiProm(l); return p == null ? 'Sin datos del CMI' : Math.round(p) + '% de cumplimiento CMI'; }
  function fv(v, signo, dec) {
    if (v == null) return '—';
    var n = Number(v).toLocaleString('es-CO', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    return signo === '%' ? n + '%' : signo === '$' ? '$ ' + n : n;
  }
  function objDe(l, texto) { var k = String(texto || '').slice(0, 40).toLowerCase(); return l.objetivos.filter(function (o) { return o.nombre.slice(0, 40).toLowerCase() === k; })[0]; }
  function pavg(l, campo) { var v = pr().filter(function (p) { return p.linea === l.id && p[campo] != null; }); return v.length ? Math.round(v.reduce(function (a, p) { return a + p[campo]; }, 0) / v.length) : null; }

  /* ---------- Proyectos PMO (instantánea de Asana: portafolio PDI 2026 - 2030) ---------- */
  var PJ = { l: '', e: '', sel: -1 };
  var ESTC = { 'Planeación': '#F7B400', 'Ejecución': '#22B2DE', 'Cierre': '#A6CE00' };
  function pr() { return (P.proyectos || []).map(function (p, i) { p._i = i; return p; }); }
  function pd(x) { return x ? Date.parse(x) : NaN; }
  function fdate(x) { if (!x) return '—'; var d = new Date(Date.parse(x)); return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function gantt(list) {
    if (!list.length) return '<div class="empty">Sin proyectos registrados en Asana para esta selección.</div>';
    var all = pr(), t0 = Math.min.apply(null, all.map(function (p) { return pd(p.inicio); })), t1 = Math.max.apply(null, all.map(function (p) { return pd(p.fin); }));
    var y0 = new Date(t0).getUTCFullYear(), y1 = new Date(t1).getUTCFullYear() + 1, A = Date.UTC(y0, 0, 1), B = Date.UTC(y1, 0, 1), W = B - A;
    var pc = function (t) { return ((t - A) / W * 100).toFixed(2); };
    var ticks = ''; for (var y = y0; y < y1; y++) ticks += '<span style="left:' + pc(Date.UTC(y, 0, 1)) + '%;width:' + (100 / (y1 - y0)).toFixed(2) + '%">' + y + '</span>';
    var seg = P.proyectosMeta && P.proyectosMeta.seguimiento ? pd(P.proyectosMeta.seguimiento) : NaN;
    var rows = list.map(function (p) {
      var l = lin(p.linea) || { color: '#0F385A', n: '' }, st = pd(p.inicio), en = pd(p.fin), real = Math.max(0, Math.min(100, p.real || 0));
      return '<button class="gr' + (PJ.sel === p._i ? ' sel' : '') + '" data-pi="' + p._i + '" style="--c:' + l.color + '"><span class="gn">' + esc(p.nombre) + '</span><span class="gt"><i class="gb" style="left:' + pc(st) + '%;width:' + Math.max(1.2, (en - st) / W * 100).toFixed(2) + '%"><u style="width:' + real + '%"></u><b>' + Math.round(real) + '%</b></i></span></button>';
    }).join('');
    var today = isNaN(seg) ? '' : '<span class="gtoday" style="left:' + pc(seg) + '%"><em>Seguimiento ' + fdate(P.proyectosMeta.seguimiento) + '</em></span>';
    return '<div class="gantt"><div class="gax"><span class="gn"></span><span class="gt">' + ticks + '</span></div><div class="gbody">' + rows + '<div class="gover"><span class="gn"></span><span class="gt">' + today + '</span></div></div></div>';
  }
  function prjDetail(i) {
    var p = pr()[i]; if (!p) return '<span class="note" style="margin:0">Toca un proyecto de la línea de tiempo para ver su avance.</span>';
    var l = lin(p.linea) || { color: '#0F385A', nombre: 'Sin línea' }, ec = ({ 'Planeación': '#7FD0EA', 'Ejecución': '#22B2DE', 'Cierre': '#15BECE', 'Finalizado': '#4A6FA5', 'Stand by': '#8A9BB0', 'Cancelado': '#B8C2CE' })[p.estado] || '#0F385A';
    return '<div class="pdet" style="--c:' + l.color + '"><div class="pd1"><span class="dchip" style="background:' + l.color + ';color:#fff">' + l.nombre + '</span><span class="dchip" style="background:' + ec + ';color:#0F385A">' + esc(p.estado) + '</span><h3>' + esc(p.nombre) + '</h3><button class="pill on" data-go="proyecto/' + p.gid + '">Ver ficha →</button></div>' +
      '<div class="pd2"><div><small>Avance real</small><b>' + Math.round(p.real || 0) + '%</b>' + bar(p.real || 0, l.color) + '</div><div><small>Avance esperado</small><b>' + Math.round(p.esperado || 0) + '%</b>' + bar(p.esperado || 0, '#F7B400') + '</div><div><small>SPI</small><b>' + (p.spi == null ? '—' : Math.round(p.spi * 100) + '%') + '</b></div>' +
      '<div><small>Inicio → Fin</small><b class="sm">' + fdate(p.inicio) + ' → ' + fdate(p.fin) + '</b></div><div><small>Unidad</small><b class="sm">' + esc(p.unidad || '—') + '</b></div></div></div>';
  }

  /* ---------- Proyectos PDI 2026-2030: menú + vistas + ficha (solo avances y entregables; fuente Asana) ---------- */
  var PF = { u: '', l: '', i: '' }, PY = { linea: '', vista: 'crono' };
  var UCOL = { 'Rectoría': '#263A58', 'Vicerrectoría Académica': '#E4006D', 'Vicerrectoría de Crecimiento': '#F7B400', 'Vicerrectoría del Estudiante': '#22B2DE', 'Vicerrectoría Administrativa y Financiera': '#B1C900' };
  var ECOL = { 'Planeación': '#7FD0EA', 'Ejecución': '#22B2DE', 'Cierre': '#15BECE', 'Finalizado': '#4A6FA5', 'Stand by': '#8A9BB0', 'Cancelado': '#B8C2CE' };
  var EORD = ['Planeación', 'Ejecución', 'Cierre', 'Finalizado', 'Stand by', 'Cancelado'];
  var FASEC = ['#E4006D', '#22B2DE', '#F7B400', '#A6CE00', '#15BECE', '#263A58', '#7FD0EA', '#8A9BB0'];
  var PYICO = {
    portafolio: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    lineas: PICO.lineas, unidades: PICO.unidades,
    cronograma: '<path d="M3 5h11M7 12h14M3 19h9"/><circle cx="18" cy="5" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="17" cy="19" r="1.6"/>'
  };
  var PYSEC = { portafolio: ['Portafolio', '#22B2DE'], lineas: ['Por línea estratégica', '#A6CE00'], unidades: ['Por unidad', '#E4006D'], cronograma: ['Cronograma', '#F7B400'] };
  function ucol(u) { return UCOL[u] || '#8A9BB0'; }
  function fFull(x) { return x ? new Date(x + (String(x).length === 10 ? 'T00:00:00Z' : '')).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'; }
  function fCorta(x) { return x ? new Date(x + 'T00:00:00Z').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' }) : '—'; }
  function pyTile(k) { return '<span class="pico" style="--c:' + PYSEC[k][1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + PYICO[k] + '</svg></span>'; }
  function pyCorte() { var M = P.proyectosMeta || {}, FM = P.fichasMeta || {}; return M.seguimiento || FM.corte; }
  function pyHead(k) { var t = [['lineas', 'Por línea'], ['proyectos', 'Por proyecto']]; return '<div class="ps-head"><div class="ps-lab"><span>Proyectos estratégicos</span></div><div class="seg2 py-tabs">' + t.map(function (x) { return '<button class="' + (k === x[0] ? 'on' : '') + '" data-go="' + (x[0] === 'lineas' ? 'proyectos' : 'proyectos/proyectos') + '">' + x[1] + '</button>'; }).join('') + '</div><span class="ps-corte">Datos al ' + fFull(pyCorte()) + '</span></div>'; }
  function pavgL(list, k) { var v = list.filter(function (p) { return p[k] != null; }); return v.length ? v.reduce(function (a, p) { return a + p[k]; }, 0) / v.length : null; }
  function pjCard(p) {
    var l = lin(p.linea) || { color: '#8A9BB0' };
    return '<button class="pj" data-go="proyecto/' + p.gid + '" style="--c:' + l.color + '"><span class="pj-n">' + esc(p.nombre) + '</span><span class="est" style="--c:' + (ECOL[p.estado] || '#8A9BB0') + '">' + esc(p.estado) + '</span><span class="pj-v"><b>' + pc0(p.real) + '</b><small>avance real</small></span><span class="pj-v"><b>' + pc0(p.esperado) + '</b><small>esperado</small></span></button>';
  }

  function ssPorLinea() {
    var all = pr(), pos = { sostenible: ['l', 53], expansion: ['l', 79], calidad: ['r', 27], experiencia: ['r', 53] }, cs = { l: '', r: '' };
    L.forEach(function (l) {
      var mine = all.filter(function (p) { return p.linea === l.id; }), p = pos[l.id];
      cs[p[0]] += '<button class="lc' + (PY.linea === l.id ? ' on' : '') + '" data-pl="' + l.id + '" style="--c:' + l.color + ';top:' + p[1] + '%"><b>' + mine.length + '</b><span>' + esc(l.nombre) + '</span><small>' + (mine.length ? 'Avance promedio ' + pc0(pavgL(mine, 'real')) + ' · esperado ' + pc0(pavgL(mine, 'esperado')) : 'Sin proyectos en Asana') + '</small></button>';
    });
    var sel = L.filter(function (l) { return l.id === PY.linea; })[0], det = '';
    if (sel) { var m = all.filter(function (p) { return p.linea === sel.id; }); det = '<div class="py-lst" style="--c:' + sel.color + '"><h3>' + esc(sel.nombre) + ' · ' + m.length + ' proyecto' + (m.length === 1 ? '' : 's') + '</h3>' + (m.length ? m.map(pjCard).join('') : '<div class="empty">Esta línea no tiene proyectos en el portafolio.</div>') + '</div>'; }
    return pyHead('lineas') + '<div class="lh"><div class="lh-col l">' + cs.l + '</div><div class="lh-hub"><img src="img/pdi/diagrama.jpg" alt="PDI 2026-2030"></div><div class="lh-col r">' + cs.r + '</div></div>' + (det || '<p class="note" style="text-align:center">Toca una línea para ver sus proyectos y abrir la ficha de cada uno.</p>');
  }

  function ssPorProyecto() {
    var all = pr(), bloques = L.map(function (l) {
      var mine = all.filter(function (p) { return p.linea === l.id; }).sort(function (a, b) { return a.inicio.localeCompare(b.inicio); });
      var cab = '<h3><i class="dot" style="background:' + l.color + '"></i>' + esc(l.nombre) + ' <small>' + mine.length + ' proyecto' + (mine.length === 1 ? '' : 's') + (mine.length ? ' · avance real ' + pc0(pavgL(mine, 'real')) + ' · esperado ' + pc0(pavgL(mine, 'esperado')) : '') + '</small></h3>';
      if (!mine.length) return '<section class="pl-s">' + cab + '<div class="empty">Esta línea no tiene proyectos en el portafolio.</div></section>';
      return '<section class="pl-s">' + cab + (PY.vista === 'tarj' ? '<div class="py-lst" style="--c:' + l.color + '">' + mine.map(pjCard).join('') + '</div>' : '<div class="card">' + gantt(mine) + '</div>') + '</section>';
    }).join('');
    return pyHead('proyectos') + '<div class="pi-vt"><b>Cada proyecto, agrupado por línea</b><div class="seg2">' + [['crono', 'Cronograma'], ['tarj', 'Tarjetas']].map(function (o) { return '<button class="' + (PY.vista === o[0] ? 'on' : '') + '" data-pv="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>' + bloques +
      '<p class="note">Barra clara: duración del proyecto; parte oscura: avance real. Toca un proyecto para abrir su ficha.</p>';
  }

  V.proyectos = function (sec) {
    if (!pr().length) return '<div class="eyebrow">Proyectos Estratégicos</div><h1>Proyectos</h1><div class="empty" style="margin-top:20px">No hay datos de Asana cargados (2026/proyectos.js).</div>';
    return sec === 'proyectos' ? ssPorProyecto() : ssPorLinea();
  };

  V.proyecto = function (gid) {
    var p = pr().filter(function (x) { return x.gid === gid; })[0], f = (P.fichas || {})[gid], FM = P.fichasMeta || {};
    if (!p || !f) return '<div class="eyebrow">Ficha de proyecto</div><h1>Proyecto no encontrado</h1><button class="pill" data-go="proyectos" style="margin-top:14px">← Proyectos</button>';
    var l = lin(p.linea) || { color: '#8A9BB0', nombre: 'Sin línea' }, ec = ECOL[p.estado] || '#8A9BB0', t = f.tareas;
    var chip = function (lab, val, col) { return '<div class="fc"><small>' + lab + '</small><b>' + (col ? '<i class="dot" style="background:' + col + '"></i>' : '') + esc(val) + '</b></div>'; };
    var fs = f.fases, g = '';
    if (fs.length) {
      var t0 = Math.min.apply(null, fs.map(function (x) { return Date.parse(x.inicio); })), t1 = Math.max.apply(null, fs.map(function (x) { return Date.parse(x.fin); })), sp = Math.max(1, t1 - t0);
      var pos = function (d) { return ((Date.parse(d) - t0) / sp * 100).toFixed(2); };
      var marcas = [0, 1, 2, 3, 4].map(function (k) { return '<span style="left:' + (k * 25) + '%">' + fCorta(new Date(t0 + sp * k / 4).toISOString().slice(0, 10)) + '</span>'; }).join('');
      var hoy = FM.corte && Date.parse(FM.corte) >= t0 && Date.parse(FM.corte) <= t1 ? '<i class="fg-hoy" style="left:' + pos(FM.corte) + '%"><em>Corte</em></i>' : '';
      g = '<div class="fg"><div class="fg-ax"><span class="fg-n"></span><span class="fg-t">' + marcas + '</span></div>' + fs.map(function (x, i) {
        var c = FASEC[i % FASEC.length], w = Math.max(1.2, (Date.parse(x.fin) - Date.parse(x.inicio)) / sp * 100), pc = x.tareas ? Math.round(x.completadas / x.tareas * 100) : 0;
        return '<div class="fg-r"><span class="fg-n"><b>' + esc(x.nombre) + '</b><small>' + fCorta(x.inicio) + ' → ' + fCorta(x.fin) + ' · ' + x.completadas + '/' + x.tareas + ' tareas · ' + pc + '%</small></span><span class="fg-t"><i class="fg-b" style="left:' + pos(x.inicio) + '%;width:' + w.toFixed(2) + '%;background:color-mix(in srgb,' + c + ' 30%,#fff)"><u style="width:' + pc + '%;background:' + c + '"></u></i>' + hoy + '</span></div>';
      }).join('') + '</div>';
    } else g = '<div class="empty">Sin fases con fechas en Asana.</div>';
    var tabla = function (cols, rows, vacio) { return rows.length ? '<div class="ft-w"><table class="ft"><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<div class="empty">' + vacio + '</div>'; };
    var tProx = tabla(['Actividad', 'Fase', 'Vence'], f.proximas.map(function (x) { return '<tr><td>' + esc(x.actividad) + '</td><td>' + esc(x.fase) + '</td><td>' + fCorta(x.vence) + '</td></tr>'; }), 'Sin actividades que venzan en los próximos 30 días.');
    var tVenc = tabla(['Actividad', 'Días de atraso', 'Vence'], f.vencidas.map(function (x) { return '<tr><td>' + esc(x.actividad) + '</td><td class="n">' + x.dias + '</td><td>' + fCorta(x.vence) + '</td></tr>'; }), 'Sin actividades vencidas.');
    var rep = f.reporte, txt = function (v) { return v ? '<p>' + esc(v).replace(/\n+/g, '<br>') + '</p>' : '<p class="vacio">Sin información registrada</p>'; };
    var pend = f.pendientes.slice(0, 6).map(function (x) { return '<li>' + esc(x.actividad) + (x.vence ? ' <small>' + fCorta(x.vence) + '</small>' : '') + '</li>'; }).join('');
    return '<div class="fi-top"><button class="pill" data-go="proyectos">← Por línea</button><button class="pill" data-go="proyectos/proyectos">← Por proyecto</button><span class="pf-corte" style="margin-left:auto">Datos al ' + fFull(FM.corte) + '</span></div>' +
      '<h1 class="fi-h">' + esc(p.nombre) + '</h1><div class="fi-chips fi-chips3">' + chip('Unidad', p.unidad || '—', ucol(p.unidad)) + chip('Línea estratégica', l.nombre, l.color) + chip('Estado', p.estado, ec) + '</div>' +
      '<div class="fi-main"><section class="card fi-gantt"><h3>Cronograma por fases <small>la parte oscura es el avance de cada fase</small></h3>' + g + '</section>' +
      '<aside class="fi-side"><div class="fi-kp"><div style="--c:#E4006D"><small>Avance real</small><b>' + (p.real == null ? '—' : Math.round(p.real) + '%') + '</b></div><div style="--c:#F7B400"><small>Avance esperado</small><b>' + (p.esperado == null ? '—' : Math.round(p.esperado) + '%') + '</b></div><div style="--c:#0F385A"><small>SPI</small><b>' + (p.spi == null ? '—' : Math.round(p.spi * 100) + '%') + '</b></div></div>' +
      '<div class="fi-ta"><div><b>' + t.total + '</b><small>Tareas totales</small></div><div><b>' + t.completadas + '</b><small>Completadas</small></div><div><b>' + t.proximas + '</b><small>Próximas</small></div><div><b>' + t.vencidas + '</b><small>Vencidas</small></div></div>' +
      '<section class="card"><h3>Entregables</h3>' + (f.entregables.length ? '<ul class="fi-ul">' + f.entregables.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="vacio">Sin información registrada</p>') + '</section></aside></div>' +
      '<div class="fi-3"><section class="card"><h3>Actividades del próximo mes <small>Asana</small></h3>' + tProx + '</section><section class="card"><h3>Actividades vencidas <small>Asana</small></h3>' + tVenc + '</section><section class="card"><h3>Actividades pendientes <small>' + f.pendientes.length + ' en Asana</small></h3>' + (pend ? '<ul class="fi-ul">' + pend + '</ul>' + (f.pendientes.length > 6 ? '<p class="note">y ' + (f.pendientes.length - 6) + ' más…</p>' : '') : '<p class="vacio">Sin actividades pendientes</p>') + '</section></div>' +
      '<div class="fi-2"><section class="card"><h3>Último reporte de avance' + (rep ? ' <small>' + esc(rep.titulo) + '</small>' : '') + '</h3>' + txt(rep && rep.resumen) + '</section><section class="card"><h3>Próximos pasos</h3>' + txt(rep && rep.proximos) + '</section></div>' +
      '<p class="note">Fuente: ' + (FM.fuente || 'Asana') + '. Próximas = abiertas que vencen en los 30 días siguientes al corte.</p>';
  };

  V.balance = function () {
    var cum = metas.filter(function (m) { return est(m.id) === 2; }).length, cur = metas.filter(function (m) { return est(m.id) === 1; }).length;
    var h = '<div class="eyebrow">Balance Institucional 2026</div><h1>Balance ' + demoBadge() + '</h1><div class="grid" style="grid-template-columns:auto 1fr;align-items:center;margin-top:18px"><div class="card" style="display:flex;gap:22px;align-items:center">' + gauge(pctTotal(), '#22B2DE', 170) + '<div><h3>Avance global</h3><p>' + cum + ' cumplidas · ' + cur + ' en curso · ' + (metas.length - cum - cur) + ' pendientes</p></div></div>' +
      '<div class="grid">' + L.map(function (l) { var p = pctLinea(l); return '<div class="card"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:8px"><span style="color:' + l.color + '">' + l.n + '. ' + l.nombre + '</span><b>' + p + '%</b></div>' + bar(p, l.color) + '</div>'; }).join('') + '</div></div>' +
      '<h2 style="margin:28px 0 12px">Filosofía institucional</h2><div class="grid" style="grid-template-columns:1fr 1fr"><div class="card accent"><h3>Misión</h3><p>' + P.mision + '</p></div><div class="card accent" style="--c:#F7B400"><h3>Visión 2030</h3><p>' + P.vision + '</p></div></div><div class="chips">' + P.valores.map(function (v) { return '<span class="chip" title="' + esc(v[1]) + '"><b style="color:var(--gold)">' + v[0] + '</b></span>'; }).join('') + '</div>';
    return h;
  };

  V.orgullosamente = function () {
    return '<div class="eyebrow">Orgullosamente POLI</div><h1>Orgullosamente POLI 2026</h1><p class="lead">Espacio para la jornada de homenaje a la excelencia institucional de 2026. Cuando haya video, noticia y fotografías de la edición, se publican aquí.</p><div class="empty" style="margin-top:20px">Contenido de la edición 2026 por definir. La edición 2025 se conserva en <a href="https://planeacionpoli.github.io/Informe_Interactivo_Poli_2025/" style="color:var(--cyan)">el informe anterior</a>.</div>';
  };

  /* ---------- router ---------- */
  var NAV = [['proceso', '', 'Proceso'], ['proyecto', '', 'Ficha de proyecto'], ['dofa', '', 'DOFA'], ['pestel', '', 'PESTEL'], ['pei', '', 'Desafíos PEI'], ['home', '◉', 'Inicio'], ['ciclo', '↻', 'Ciclo'], ['contexto', '▦', 'Contexto'], ['avances', '◔', 'Avance'], ['logros', '★', 'Logros'], ['objetivos', '◎', 'Objetivos'], ['planes', '▤', 'Planes'], ['proyectos', '⚑', 'Proyectos'], ['balance', '⚖', 'Balance'], ['orgullosamente', '♥', 'Orgullosamente POLI']];
  var _unused = NAV.map(function (n) { return '<button data-go="' + n[0] + '"><i>' + n[1] + '</i>' + n[2] + '</button>'; }).join('');
  var hist = [];
  function go(r) { if (location.hash.slice(1) !== r) { hist.push(location.hash.slice(1) || 'home'); location.hash = r; } else render(); }
  function render() {
    var r = location.hash.slice(1) || 'home', p = r.split('/'), name = p[0];
    if (!V[name]) name = 'home';
    var label = (NAV.filter(function (n) { return n[0] === name; })[0] || ['', '', 'Línea'])[2];
    if (name === 'linea') label = (lin(p[1]) || {}).nombre || 'Línea';
    crumb.innerHTML = 'PDI 2026-2030 · <b>' + label + '</b>';
    main.innerHTML = '<section class="view">' + V[name](p[1]) + '</section>'; main.scrollTop = 0;
    $('#btnBack').disabled = !hist.length;
    bind(name); animate(main);
  }
  function bind(name) {
    if (name === 'home') { bindHub(main); $$('.mod').forEach(function (m) {
      m.addEventListener('pointermove', function (e) { var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; m.style.transform = 'perspective(600px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-3px)'; });
      m.addEventListener('pointerleave', function () { m.style.transform = ''; });
    }); }
    if (name === 'dofa' || name === 'pestel' || name === 'pei') ctx(name);
    if (name === 'avances') bindHub(main);
    if (false) $$('.cm-tg[data-rt]').forEach(function (b) { b.onclick = function () { var abre = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', abre); $$('.rt-sub[data-p="' + b.dataset.rt + '"]').forEach(function (r) { r.hidden = !abre; }); }; });
    if (name === 'planes') {
      $$('[data-ut]').forEach(function (b) { b.onclick = function () { PT.tipo = b.dataset.ut; render(); }; });
      $$('[data-uo]').forEach(function (b) { b.onclick = function () { PT.orden = b.dataset.uo; render(); }; });
      $$('[data-uv]').forEach(function (b) { b.onclick = function () { PT.vista = b.dataset.uv; render(); }; });
      var st = $('.ob-stage');
      if (st) { var marca = function (id, on) { $$('.ob-blk', st).forEach(function (c) { c.classList.toggle('act', on && c.dataset.linea === id); c.classList.toggle('dim', on && c.dataset.linea !== id); }); $$('.hs', st).forEach(function (h) { h.classList.toggle('act', on && h.dataset.id === id); }); };
        $$('.hs', st).forEach(function (h) { h.onmouseenter = function () { marca(h.dataset.id, true); }; h.onmouseleave = function () { marca('', false); }; });
        $$('.ob-blk', st).forEach(function (c) { c.onmouseenter = function () { marca(c.dataset.linea, true); }; c.onmouseleave = function () { marca('', false); }; }); }
    }
    if (name === 'linea') $$('.cm-tg').forEach(function (b) { b.onclick = function () { var abre = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', abre); $$('.cm-sub[data-p="' + b.dataset.cm + '"]').forEach(function (r) { r.hidden = !abre; }); }; });
    if (name === 'proyectos' || name === 'linea') {
      $$('#fu').forEach(function (e) { e.onchange = function () { PF.u = e.value; render(); }; });
      $$('#fl').forEach(function (e) { e.onchange = function () { PF.l = e.value; render(); }; });
      $$('#fi').forEach(function (e) { e.onchange = function () { PF.i = e.value; render(); }; });
      $$('[data-pv]').forEach(function (b) { b.onclick = function () { PY.vista = b.dataset.pv; render(); }; });
      $$('.lc[data-pl]').forEach(function (b) { b.onclick = function () { PY.linea = PY.linea === b.dataset.pl ? '' : b.dataset.pl; render(); }; });
      $$('.pt-r').forEach(function (r) { r.onclick = function () { go('proyecto/' + r.dataset.g); }; r.onkeydown = function (ev) { if (ev.key === 'Enter') go('proyecto/' + r.dataset.g); }; });
      var showDet = function () { var d = $('#pdet'); if (d) { d.innerHTML = prjDetail(PJ.sel); $$('[data-go]', d).forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; }); } $$('.gr').forEach(function (g) { g.classList.toggle('sel', +g.dataset.pi === PJ.sel); }); };
      $$('.gr').forEach(function (g) { g.onclick = function () { var q = pr()[+g.dataset.pi]; if (q) go('proyecto/' + q.gid); }; });
    }
    $$('.step').forEach(function (s) { s.onclick = function () { s.classList.toggle('on'); }; });
    $$('.pst').forEach(function (s) { s.onclick = function () { s.classList.toggle('on'); }; });
    var db = $('#demoBtn'); if (db) db.onclick = function () { S.demo = !S.demo; render(); };
    var tabs = $$('[data-f]'); tabs.forEach(function (b) { b.onclick = function () { tabs.forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); $$('#objs .card').forEach(function (c) { c.style.display = (b.dataset.f === 'all' || c.dataset.l === b.dataset.f) ? '' : 'none'; }); }; });
    $$('.seg button').forEach(function (b) { b.onclick = function () { if (S.demo) { S.demo = false; } S.estado[b.parentNode.dataset.m] = +b.dataset.v; save(); var y = main.scrollTop; render(); main.scrollTop = y; }; });
    $$('select[data-y]').forEach(function (s) { s.onchange = function () { S.anio[s.dataset.y] = s.value; save(); }; });
    var pf = $('#pf'); if (pf) pf.onsubmit = function (e) { e.preventDefault(); var f = new FormData(pf), o = ''; L.forEach(function (l) { l.objetivos.forEach(function (x) { if (x.id === f.get('o')) o = x.nombre; }); }); S.proyectos.push({ n: f.get('n'), l: f.get('l'), o: o }); save(); render(); };
    $$('[data-del]').forEach(function (b) { b.onclick = function () { S.proyectos.splice(+b.dataset.del, 1); save(); render(); }; });
    $$('[data-go]').forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
  }
  $('#btnHome').onclick = function () { hist = []; go('home'); };
  $('#btnBack').onclick = function () { var r = hist.pop(); if (r) { location.hash = r; } };
  document.addEventListener('keydown', function (e) {
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'h' || e.key === 'H') $('#btnHome').click();
    if (e.key === 'Escape') $('#btnBack').click();
  });
  window.addEventListener('hashchange', render);
  render();
})();
