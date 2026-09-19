/* Embat X-Ray — modelo y gráficos.
   El health score se llama PULSE. Dos lecturas en todo el producto:
   pulse observado (reconstruido de transacciones) y pulse previsto
   (proyección del modelo a seis meses, con banda).
   Fuente única para el prototipo y para la página de sistema.
   Sustituir buildUniverse/FIXED por fetch('/data/index.json') y
   fetch('/data/company/{id}.json'); el resto no se toca. */

export const MONTHS = (() => {
  const out = [], names = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  let y = 2024, m = 9;
  for (let i = 0; i < 24; i++){ out.push({ k:i, label:names[m] + " " + String(y).slice(2), long:names[m] + " " + y }); m++; if (m > 11){ m = 0; y++; } }
  return out;
})();

export const PILLARS = [
  { k:"liq", n:"Liquidez",  d:"Días de caja, mínimo intramensual, descubiertos" },
  { k:"deu", n:"Deuda",     d:"Utilización de líneas, servicio de deuda, coste medio" },
  { k:"cob", n:"Cobros",    d:"DSO, aging, concentración de clientes" },
  { k:"pag", n:"Pagos",     d:"DPO, retrasos a proveedores, plazo concedido" },
  { k:"act", n:"Actividad", d:"Facturación desestacionalizada, flujo neto" },
  { k:"gru", n:"Grupo",     d:"Dependencia de flujos intragrupo" }
];

export const STOPS_DARK  = [[138,47,83],[194,85,60],[217,160,63],[127,174,113],[73,200,190]];
export const STOPS_LIGHT = [[138,47,83],[184,74,49],[185,130,42],[79,140,82],[30,143,138]];

export const SPECTRUM_STOPS = [
  { at:0,   hex:"#8A2F53", n:"ciruela" },
  { at:30,  hex:"#C2553C", n:"brasa" },
  { at:50,  hex:"#D9A03F", n:"ámbar" },
  { at:70,  hex:"#7FAE71", n:"celadón" },
  { at:100, hex:"#49C8BE", n:"aguamarina" }
];

export function makeSpectrum(dark){
  const st = dark ? STOPS_DARK : STOPS_LIGHT;
  return function (score){
    const t = Math.max(0, Math.min(1, score / 100)) * (st.length - 1);
    const i = Math.min(st.length - 2, Math.floor(t)), f = t - i;
    const a = st[i], b = st[i + 1];
    return "rgb(" + a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",") + ")";
  };
}

export const BANDS = [
  { lo:85, hi:101, n:"Holgada" },
  { lo:70, hi:85,  n:"Estable" },
  { lo:50, hi:70,  n:"Vigilancia" },
  { lo:30, hi:50,  n:"Tensión" },
  { lo:0,  hi:30,  n:"Crítica" }
];
export function bandName(s){ return s < 30 ? "Crítica" : s < 50 ? "Tensión" : s < 70 ? "Vigilancia" : s < 85 ? "Estable" : "Holgada"; }
export function fmtDelta(d){ const v = Math.round(d); return (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v); }
export function fmtPts(d){ const v = Math.round(d * 10) / 10; const s = Math.abs(v).toFixed(1).replace(".", ","); return (v > 0 ? "+" : v < 0 ? "−" : "±") + s; }

function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SECTORS = ["Industrial","Distribución","Alimentación","Construcción","Logística","Servicios","Retail","Química","Automoción","Agro"];
const HEADS = ["Velasco","Northbrook","Arcela","Mendive","Torralba","Kestrel","Bonaval","Aridane","Lumbrera","Saldaña","Verdeña","Ormaza","Cintruénigo","Baltar","Norteña","Peñalba","Olivares","Ribamar","Quintanar","Teverga","Aldabe","Cerezal","Fontela","Miramar","Nogueira","Sarrión","Vallcarca","Ardanza","Brezal","Caldera","Duranguesa","Espadán","Finisterre","Gaztelu","Hontanar","Iraeta","Jarama","Lastanosa","Monteagudo","Navacerrada"];
const TAILS = ["Industrial","Grupo","Logística","Ibérica","Distribución","Partners","Servicios","Agro","Sistemas","Europa","Levante","Norte"];

/* El score de una cartera real de pymes no es uniforme: se acumula en
   Vigilancia y Tensión, con cola corta arriba y cola larga abajo por shock.
   Suma de tres uniformes (campana, media 0,5) desplazada, más el shock. */
export function buildUniverse(){
  const r = rng(20260919), list = [];
  for (let i = 0; i < 1286; i++){
    const u = (r() + r() + r()) / 3;
    const base = 16 + 74 * Math.pow(u, 1.06);
    const trend = (r() - .52) * 2.1;
    const shock = r() < .13 ? { at:8 + Math.floor(r() * 11), size:-(8 + r() * 20) } : null;
    const seas = 2 + r() * 5, phase = r() * 6.28, noise = 1.1 + r() * 2.1;
    const series = [];
    for (let m = 0; m < 24; m++){
      let v = base + trend * m + Math.sin(m / 12 * 6.283 + phase) * seas + (r() - .5) * noise * 2;
      if (shock && m >= shock.at) v += shock.size * Math.min(1, (m - shock.at + 1) / 3);
      series.push(Math.max(4, Math.min(98, v)));
    }
    const score = series[23], d3 = score - series[20], d6 = score - series[17];
    list.push({
      id:"C" + String(1000 + i), name:HEADS[Math.floor(r() * HEADS.length)] + " " + TAILS[Math.floor(r() * TAILS.length)],
      sector:SECTORS[Math.floor(r() * SECTORS.length)],
      group:"G" + String(100 + Math.floor(i / 5.15)),
      series, score, d3, d6,
      cashDays:Math.max(3, Math.round(7 + score * .85 + (r() - .5) * 22)),
      structural:!!shock && shock.at <= 20 && d6 < -9,
      seed:Math.floor(r() * 1e9)
    });
  }
  const velasco = list.find(c => c.name.startsWith("Velasco")) || list[0];
  const north = list.find(c => c.name.startsWith("Northbrook")) || list[1];
  Object.assign(velasco, {
    id:"C0001", name:"Velasco Industrial", sector:"Industrial", group:"G101", pinned:true,
    series:[80,82,81,83,82,83,82,84,83,82,83,82,83,84,83,83,83,82,82,80,77,74,71,68],
    structural:true, cashDays:26
  });
  Object.assign(north, {
    id:"C0002", name:"Northbrook Distribución", sector:"Distribución", group:"G102", pinned:true,
    series:[52,50,48,47,46,45,44,45,45,44,45,46,47,48,50,52,54,56,58,60,62,63,64,65],
    structural:false, cashDays:61
  });
  for (const c of [velasco, north]){ c.score = c.series[23]; c.d3 = c.score - c.series[20]; c.d6 = c.score - c.series[17]; }
  return list;
}

export const FIXED = {
  C0001:{
    pillars:{liq:54,deu:22,cob:71,pag:31,act:76,gru:64},
    prev:   {liq:71,deu:68,cob:74,pag:70,act:78,gru:66},
    signal:{month:18,label:"abr 2026"},
    /* La atribución suma exactamente la variación dibujada en la serie:
       82 (abr) → 68 (sep) = −14 puntos. El 61% del texto es esta barra. */
    attrib:{ horizon:"seis meses", from:82, to:68, total:-14, items:[
      { n:"Deuda", pts:-8.5, pct:61 },
      { n:"Pagos", pts:-3.4, pct:24 },
      { n:"Liquidez", pts:-1.4, pct:10 },
      { n:"Grupo", pts:-0.4, pct:3 },
      { n:"Cobros", pts:-0.3, pct:2 },
      { n:"Actividad", pts:0, pct:0 }
    ]},
    disclosure:{ opened:"23 de septiembre de 2026", release:"23 de octubre de 2026", windowDays:30, daysLeft:23,
      rule:"La ventana se abre cuando dispara el cuarto test, no cuando cae el Pulse. Disparó el 23 de septiembre; son 30 días; al cierre del 30 de septiembre quedan 23." },
    events:[
      {m:18,t:"La utilización de la línea de crédito pasa del 34% al 51%",s:"Primera señal detectable. El Pulse seguía en 82 y no se había movido."},
      {m:19,t:"El DPO se alarga de 42 a 53 días",s:"Segundo pilar afectado. El detector de régimen deja de leerlo como estacional."},
      {m:20,t:"Vence el tramo bullet de 1,2 M€ con Banco Norte",s:"Servicio de deuda a 12 meses sube al 41% del flujo operativo."},
      {m:21,t:"Utilización al 79%, DPO en 67 días",s:"Tres de los cuatro tests cumplidos. Todavía no se escala."},
      {m:23,t:"Mínimo intramensual de caja: 310 k€ el día 28",s:"Con un outflow medio diario de 92 k€ quedan 26 días de caja."},
      {m:23,t:"CUSUM dispara el 23 de septiembre: 4 de 4 tests",s:"Se abre la ventana de disclosure. La señal llega a los financiadores el 23 de octubre."}
    ],
    actions:[
      {t:"Adelantar el cobro de 3 facturas de Aldabe Europa",s:"340 k€ en el tramo de más de 90 días. Confirming disponible al 4,1%.",g:22},
      {t:"Disponer 600 k€ de la línea de Banco Sur",s:"Es la más barata de las cinco: 3,4% frente al 5,9% de la que está al 79%.",g:31},
      {t:"Renegociar el vencimiento de febrero con Banco Norte",s:"Alargar 18 meses cuesta 14 k€ y quita el pico de tesorería.",g:18},
      {t:"Barrido a la cuenta principal",s:"Hay 410 k€ dispersos en cinco bancos sin remunerar.",g:9},
      {t:"Contrato de Miramar Ibérica cayendo un 31%",s:"El score no arregla esto. Es una conversación comercial, esta semana.",g:0}
    ],
    explanation:"Velasco Industrial baja de 82 a 68 en seis meses. El 61% de la caída viene del pilar Deuda: la utilización de la línea de crédito pasa del 34% al 79% entre marzo y julio. El segundo factor es Pagos, con el DPO alargándose de 42 a 67 días. Ventas y cobros están estables, así que no es un problema de demanda, es un problema de caja. Primera señal detectable en abril de 2026, cinco meses antes de que el score bajara de 70."
  },
  C0002:{
    pillars:{liq:69,deu:74,cob:62,pag:71,act:58,gru:55},
    prev:   {liq:51,deu:49,cob:44,pag:52,act:47,gru:53},
    signal:{month:12,label:"oct 2025"},
    attrib:{ horizon:"dieciocho meses", from:45, to:65, total:20, items:[
      { n:"Deuda", pts:7.6, pct:38 },
      { n:"Cobros", pts:5.4, pct:27 },
      { n:"Liquidez", pts:4.2, pct:21 },
      { n:"Pagos", pts:1.6, pct:8 },
      { n:"Actividad", pts:0.8, pct:4 },
      { n:"Grupo", pts:0.4, pct:2 }
    ]},
    disclosure:{ opened:null, release:null, windowDays:30, daysLeft:0,
      rule:"No hay ventana abierta: la mejora se comunica sin retardo. El retardo protege a la empresa de una señal negativa, no a nadie de una positiva." },
    events:[
      {m:12,t:"La utilización de líneas baja del 72% al 58%",s:"Primera señal de mejora. El Pulse todavía marcaba 47."},
      {m:15,t:"El DSO se acorta de 74 a 61 días",s:"Músculo para exigir cobro: la otra cara de la misma medida."},
      {m:18,t:"Cancelación anticipada del factoring caro",s:"Coste medio ponderado de la deuda del 6,8% al 5,1%."},
      {m:22,t:"Nueve meses consecutivos de flujo neto positivo",s:"La mejora supera la banda de ruido de su propia historia."}
    ],
    actions:[
      {t:"Reabrir el límite preaprobado en 1,8 M€",s:"La mejora sostenida cambia la banda. El precio baja 150 pb.",g:0},
      {t:"Sustituir el confirming restante por línea propia",s:"Ahorro estimado de 31 k€ al año sobre el circulante actual.",g:12},
      {t:"Mantener el barrido diario",s:"Ya activo. Aporta 9 días de caja frente a la dispersión anterior.",g:9}
    ],
    explanation:"Northbrook Distribución sube de 45 a 65 en dieciocho meses. La mejora está repartida: Deuda aporta el 38% (la utilización de líneas cae del 72% al 31%), Cobros el 27% (DSO de 74 a 61 días) y Liquidez el 21%. La misma medida que detecta el deterioro detecta la recuperación, con la misma sensibilidad. Primera señal detectable en octubre de 2025."
  }
};

export function detail(c){
  if (FIXED[c.id]) return Object.assign({}, FIXED[c.id], { company:c });
  const r = rng(c.seed), p = {}, prev = {};
  for (const pl of PILLARS){
    const v = Math.max(6, Math.min(96, c.score + (r() - .5) * 34));
    p[pl.k] = Math.round(v);
    prev[pl.k] = Math.round(Math.max(4, Math.min(98, v - c.d6 * (.5 + r()))));
  }
  const sm = Math.max(2, 23 - Math.round(3 + r() * 5));
  const raw = PILLARS.map(pl => ({ n:pl.n, v:p[pl.k] - prev[pl.k] }));
  const sum = raw.reduce((a, b) => a + b.v, 0) || 1;
  const items = raw.map(x => ({ n:x.n, pts:x.v / sum * c.d6 }))
    .sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts))
    .map(x => ({ n:x.n, pts:x.pts, pct:Math.round(Math.abs(x.pts) / Math.abs(c.d6 || 1) * 100) }));
  const dir = c.d6 < 0 ? "deterioro" : "mejora";
  const escalate = c.structural && c.d6 < 0;
  return {
    company:c, pillars:p, prev,
    signal:{ month:sm, label:MONTHS[sm].long },
    attrib:{ horizon:"seis meses", from:Math.round(c.series[17]), to:Math.round(c.score), total:c.d6, items:items },
    disclosure:escalate
      ? { opened:"cierre de septiembre de 2026", release:"cierre de octubre de 2026", windowDays:30, daysLeft:1 + (c.seed % 29),
          rule:"La ventana se abre cuando dispara el cuarto test, no cuando cae el Pulse. Son 30 días desde el disparo." }
      : { opened:null, release:null, windowDays:30, daysLeft:0,
          rule:"Régimen transitorio: no se escala a los financiadores. Sin los cuatro tests no hay ventana." },
    events:[
      {m:sm,t:"Cambio de régimen detectado en el pilar Deuda",s:"Primera señal por encima del umbral de la propia empresa."},
      {m:Math.min(23, sm + 2),t:"Segundo pilar afectado: Pagos",s:"El detector pasa de transitorio a " + (c.structural ? "estructural" : "vigilado") + "."},
      {m:23,t:"Pulse de cierre " + Math.round(c.score),s:"Banda " + bandName(c.score) + ", " + dir + " de " + Math.abs(Math.round(c.d6)) + " puntos en seis meses."}
    ],
    actions:[
      {t:"Adelantar el cobro de las facturas de más de 90 días",s:"Hay " + (120 + Math.round(r() * 400)) + " k€ en ese tramo.",g:9 + Math.round(r() * 18)},
      {t:"Disponer de la línea más barata antes que de la habitual",s:"Diferencial de " + (140 + Math.round(r() * 160)) + " pb entre la mejor y la que se está usando.",g:7 + Math.round(r() * 22)},
      {t:"Barrido a la cuenta principal",s:"Saldo disperso en " + (3 + Math.round(r() * 3)) + " bancos.",g:4 + Math.round(r() * 9)}
    ],
    explanation:c.name + " cierra en " + Math.round(c.score) + " puntos, con una variación de " + fmtDelta(c.d6) + " en seis meses. El movimiento se concentra en " + items[0].n + " (" + items[0].pct + "% de la variación) y " + items[1].n + " (" + items[1].pct + "%), que son los pilares que se mueven primero cuando la tensión es de caja y no de demanda."
  };
}

/* Señal hacia el financiador: suavizada, con tope de movimiento por periodo.
   Sigue a la interna con retardo, para no sincronizar a todos los acreedores. */
export function lenderScore(c){
  const cap = 4;
  const move = Math.max(-cap, Math.min(cap, c.d3));
  return Math.round(c.score - c.d3 + move * .55);
}

/* Pulse previsto. Momento reciente amortiguado mes a mes; la banda se abre
   con el horizonte. No es una extrapolación lineal: el amortiguamiento evita
   prometer caídas infinitas y es lo que hace defendible el número a 6 meses. */
export const FC_MONTHS = 6;
export const FC_DAMP = 0.82;
export function forecast(c, n){
  n = n || FC_MONTHS;
  const mom = c.d3 / 3;
  const v = [], lo = [], hi = [];
  let cur = c.score;
  for (let i = 1; i <= n; i++){
    cur = Math.max(4, Math.min(98, cur + mom * Math.pow(FC_DAMP, i)));
    const spread = 2.2 + 1.55 * i;
    v.push(cur);
    lo.push(Math.max(2, cur - spread));
    hi.push(Math.min(99, cur + spread));
  }
  const at = v[v.length - 1];
  return {
    v:v, lo:lo, hi:hi, months:n,
    at:Math.round(at), delta:at - c.score,
    band:bandName(at), bandChange:bandName(at) !== bandName(c.score),
    spread:Math.round(2.2 + 1.55 * n)
  };
}

/* Lo que ve cada banco por separado: la misma empresa, pero solo su trozo.
   La visibilidad es la fracción del movimiento consolidado que asoma en sus
   cuentas; el offset, el sesgo de su propia posición. Ninguno ve el total. */
export function bankViews(c){
  const defs = [
    { n:"Banco Norte",      share:41, vis:.42, off:2, sees:"Tiene la póliza que está al 79%, pero ve ingresos regulares y no ve el tramo bullet del otro banco" },
    { n:"Banco Sur",        share:24, vis:.31, off:4, sees:"Ve el vencimiento de 1,2 M€ y una cuenta con saldo holgado, porque el barrido no pasa por aquí" },
    { n:"Caja Levante",     share:21, vis:.22, off:7, sees:"Solo domiciliaciones y nóminas. Todo puntual, todos los meses" },
    { n:"Banco Atlántico",  share:14, vis:.35, off:1, sees:"Ve el alargamiento del pago a proveedores, pero sin las compras no sabe si es tensión o negociación" }
  ];
  const base = c.series[0];
  const views = defs.map(d => {
    const series = c.series.map(v => Math.max(4, Math.min(98, base + (v - base) * d.vis + d.off)));
    return { n:d.n, share:d.share, sees:d.sees, series:series, pulse:Math.round(series[series.length - 1]) };
  });
  const weighted = views.reduce((a, v) => a + v.pulse * v.share, 0) / views.reduce((a, v) => a + v.share, 0);
  const consolidated = Math.round(c.score);
  const crossed = views.filter(v => v.pulse < 70).length;
  return {
    views:views,
    weighted:Math.round(weighted),
    consolidated:consolidated,
    gap:Math.round(weighted) - consolidated,
    best:views.slice().sort((a, b) => b.pulse - a.pulse)[0],
    crossed:crossed
  };
}

/* ---------------------------------------------------------------- gráficos */
export function charts(React, spectrum){
  const E = React.createElement;
  const INK3 = "var(--ink-3)", RULE = "var(--rule-soft)";
  const root = (w, h, kids, label) => E("svg", {
    viewBox:"0 0 " + w + " " + h, width:"100%", height:h, preserveAspectRatio:"none",
    role:"img", "aria-label":label || undefined, style:{ display:"block", overflow:"visible" }
  }, kids);
  const txt = (key, x, y, anchor, children, fill, size) =>
    E("text", { key:key, x:x, y:y, textAnchor:anchor, fill:fill || INK3, fontSize:size || 10.5 }, children);

  /* Campo de espectro: una línea por empresa. Posición = score, altura = días de caja.
     Las encendidas (más de 6 puntos en tres meses) son sujetos individuales y
     se pueden señalar; el resto es contexto. */
  const FIELD_PAD = 26;
  function isMover(c){ return Math.abs(c.d3) > 6; }
  function fieldScoreAt(px, w){ return (px - FIELD_PAD) / Math.max(1, w - FIELD_PAD * 2) * 100; }
  function nearestMover(list, px, w){
    const target = fieldScoreAt(px, w);
    let best = null, bestD = Infinity;
    for (const c of list){
      if (!isMover(c)) continue;
      const d = Math.abs(c.score - target);
      if (d < bestD){ bestD = d; best = c; }
    }
    return bestD <= 2.2 ? best : null;
  }

  function field(list, w, h, activeId){
    const kids = [], pad = FIELD_PAD, innerW = w - pad * 2, base = h - 24;
    for (const b of BANDS){
      if (b.lo === 0) continue;
      const x = pad + innerW * b.lo / 100;
      kids.push(E("line", { key:"b" + b.lo, x1:x, x2:x, y1:2, y2:base, stroke:RULE, strokeWidth:1 }));
    }
    for (const b of BANDS){
      const mid = pad + innerW * ((b.lo + Math.min(100, b.hi)) / 2) / 100;
      kids.push(txt("bn" + b.lo, mid, h - 8, "middle", b.n));
    }
    const sorted = list.slice().sort((a, b) => a.score - b.score);
    const dim = activeId ? .55 : 1;
    let hit = null;
    sorted.forEach((c, i) => {
      const x = pad + innerW * (c.score / 100);
      const len = 16 + Math.min(1, c.cashDays / 110) * (base - 26);
      const moved = isMover(c), on = activeId && c.id === activeId;
      if (on){ hit = { c:c, x:x, len:len }; return; }
      kids.push(E("line", { key:"l" + i, x1:x, x2:x, y1:base, y2:base - len,
        stroke:spectrum(c.score), strokeWidth:moved ? 1.6 : 1, opacity:(moved ? .95 : .45) * dim }));
      if (moved) kids.push(E("line", { key:"t" + i, x1:x, x2:x + (c.d3 > 0 ? 3.4 : -3.4),
        y1:base - len - 4, y2:base - len - 4 + (c.d3 > 0 ? -5 : 5),
        stroke:spectrum(c.score), strokeWidth:1.4, opacity:.9 * dim }));
    });
    if (hit){
      const c = hit.c, x = hit.x, len = hit.len;
      kids.push(E("line", { key:"hg", x1:x, x2:x, y1:2, y2:base, stroke:"currentColor", strokeWidth:1, opacity:.22 }));
      kids.push(E("line", { key:"hl", x1:x, x2:x, y1:base, y2:base - len, stroke:spectrum(c.score), strokeWidth:2.6 }));
      kids.push(E("line", { key:"ht", x1:x, x2:x + (c.d3 > 0 ? 4.6 : -4.6),
        y1:base - len - 5, y2:base - len - 5 + (c.d3 > 0 ? -6.5 : 6.5), stroke:spectrum(c.score), strokeWidth:1.8 }));
      kids.push(E("circle", { key:"hd", cx:x, cy:base - len, r:3, fill:spectrum(c.score) }));
    }
    const med = sorted[Math.floor(sorted.length / 2)].score;
    const mx = pad + innerW * med / 100;
    kids.push(E("line", { key:"med", x1:mx, x2:mx, y1:2, y2:base, stroke:"currentColor", strokeWidth:1, strokeDasharray:"2 3", opacity:.5 }));
    kids.push(txt("medl", mx + 5, 11, "start", "mediana " + Math.round(med), "currentColor"));
    return root(w, h, kids, "Distribución de las " + list.length + " empresas por Pulse");
  }

  /* Serie de 24 meses de pulse observado, trazo coloreado mes a mes.
     opts.fc = {v,lo,hi} añade el pulse previsto: banda + trazo discontinuo. */
  function trace(series, w, h, opts){
    opts = opts || {};
    const fc = opts.fc || null;
    const nH = series.length, nF = fc ? fc.v.length : 0, total = nH + nF;
    const kids = [], pad = { t:10, b:opts.axis ? 18 : 6 };
    const innerH = h - pad.t - pad.b;
    const X = i => w * i / (total - 1);
    const Y = v => pad.t + innerH * (1 - v / 100);
    if (opts.axis) [25, 50, 75].forEach(g => kids.push(E("line", { key:"g" + g, x1:0, x2:w, y1:Y(g), y2:Y(g), stroke:RULE, strokeWidth:1 })));
    if (fc){
      let band = "M" + X(nH - 1).toFixed(1) + " " + Y(series[nH - 1]).toFixed(1) + " ";
      fc.hi.forEach((v, i) => { band += "L" + X(nH + i).toFixed(1) + " " + Y(v).toFixed(1) + " "; });
      for (let i = fc.lo.length - 1; i >= 0; i--) band += "L" + X(nH + i).toFixed(1) + " " + Y(fc.lo[i]).toFixed(1) + " ";
      band += "Z";
      kids.push(E("path", { key:"fcb", d:band, fill:spectrum(fc.v[fc.v.length - 1]), opacity:.14 }));
      let fl = "M" + X(nH - 1).toFixed(1) + " " + Y(series[nH - 1]).toFixed(1) + " ";
      fc.v.forEach((v, i) => { fl += "L" + X(nH + i).toFixed(1) + " " + Y(v).toFixed(1) + " "; });
      kids.push(E("path", { key:"fcl", d:fl, fill:"none", stroke:spectrum(fc.v[fc.v.length - 1]), strokeWidth:1.8, strokeDasharray:"4 3.5", strokeLinecap:"round" }));
      kids.push(E("line", { key:"fcd", x1:X(nH - 1), x2:X(nH - 1), y1:pad.t, y2:h - pad.b, stroke:"currentColor", strokeWidth:1, opacity:.3 }));
      kids.push(E("circle", { key:"fce", cx:X(total - 1), cy:Y(fc.v[fc.v.length - 1]), r:3, fill:"none", stroke:spectrum(fc.v[fc.v.length - 1]), strokeWidth:1.6 }));
      if (opts.axis) kids.push(txt("fct", X(total - 1), pad.t + 10, "end", "previsto", "currentColor"));
    }
    let d = "";
    series.forEach((v, i) => { d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " "; });
    const gid = "xr-" + (opts.id || "t") + "-" + (opts.rev || 0);
    const stops = [];
    series.forEach((v, i) => { if (i % 3 === 0 || i === series.length - 1) stops.push(E("stop", { key:"s" + i, offset:(i / (series.length - 1) * 100) + "%", stopColor:spectrum(v) })); });
    kids.push(E("defs", { key:"d" }, E("linearGradient", { id:gid, x1:"0", x2:"1", y1:"0", y2:"0" }, stops)));
    if (opts.fill) kids.push(E("path", { key:"a", d:d + "L" + X(nH - 1).toFixed(1) + " " + (h - pad.b) + " L0 " + (h - pad.b) + " Z", fill:"url(#" + gid + ")", opacity:.12 }));
    kids.push(E("path", { key:"l", d:d, fill:"none", stroke:"url(#" + gid + ")", strokeWidth:opts.thin ? 1.6 : 2.2, strokeLinejoin:"round", strokeLinecap:"round" }));
    if (opts.mark != null){
      kids.push(E("line", { key:"m", x1:X(opts.mark), x2:X(opts.mark), y1:pad.t, y2:h - pad.b, stroke:"currentColor", strokeWidth:1, strokeDasharray:"2 3", opacity:.45 }));
      kids.push(txt("ml", X(opts.mark) + 5, pad.t + 10, "start", opts.markLabel || "", "currentColor"));
    }
    const last = series[nH - 1];
    kids.push(E("circle", { key:"c", cx:X(nH - 1), cy:Y(last), r:3.2, fill:spectrum(last) }));
    if (opts.axis) [0, 6, 12, 18, 23].forEach(i => kids.push(txt("ax" + i,
      Math.min(w - 14, Math.max(0, X(i))), h - 4, i === 0 ? "start" : (i === 23 && !fc) ? "end" : "middle", MONTHS[i].label)));
    if (fc && opts.axis) kids.push(txt("axf", w, h - 4, "end", "+" + fc.v.length + " m"));
    return root(w, h, kids);
  }

  /* Fragmentación: lo que ve cada banco por separado frente al consolidado.
     Dominio ampliado (58–92) porque todo el argumento vive en 15 puntos y
     un eje de 0 a 100 lo aplanaría hasta hacerlo invisible. */
  function frag(fragData, series, w, h){
    const kids = [], pad = { t:12, b:20, r:104 };
    const lo = 58, hi = 92, n = series.length;
    const iw = w - pad.r;
    const X = i => iw * i / (n - 1);
    const Y = v => pad.t + (h - pad.t - pad.b) * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo));
    [70, 85].forEach(gv => {
      kids.push(E("line", { key:"g" + gv, x1:0, x2:iw, y1:Y(gv), y2:Y(gv), stroke:RULE, strokeWidth:1, strokeDasharray:gv === 70 ? "3 3" : null }));
      kids.push(txt("gl" + gv, 2, Y(gv) - 4, "start", gv === 70 ? "umbral de vigilancia" : bandName(gv + 1)));
    });
    fragData.views.forEach((v, k) => {
      let d = "";
      v.series.forEach((val, i) => { d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(val).toFixed(1) + " "; });
      kids.push(E("path", { key:"b" + k, d:d, fill:"none", stroke:"currentColor", strokeWidth:1.2, opacity:.34 }));
    });
    let d = "";
    series.forEach((val, i) => { d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(val).toFixed(1) + " "; });
    kids.push(E("path", { key:"cons", d:d, fill:"none", stroke:spectrum(series[n - 1]), strokeWidth:2.6, strokeLinejoin:"round" }));
    kids.push(E("circle", { key:"cd", cx:X(n - 1), cy:Y(series[n - 1]), r:3.4, fill:spectrum(series[n - 1]) }));

    /* Dos bancos pueden acabar en el mismo punto (77 y 77): los rótulos se
       separan un mínimo legible y una guía fina los devuelve a su línea. */
    const GAP = 13.5, top = pad.t + 4, bot = h - pad.b - 2;
    const labels = fragData.views.map(v => ({
      t:v.n + "  " + v.pulse, at:Y(v.series[n - 1]), weight:"400", fill:"currentColor", op:.72
    })).concat([{ t:"Consolidado  " + Math.round(series[n - 1]), at:Y(series[n - 1]), weight:"600", fill:"currentColor", op:1 }]);
    labels.sort((a, b) => a.at - b.at);
    labels.forEach((l, i) => { l.y = i === 0 ? l.at : Math.max(l.at, labels[i - 1].y + GAP); });
    if (labels[labels.length - 1].y > bot){
      labels[labels.length - 1].y = bot;
      for (let i = labels.length - 2; i >= 0; i--) labels[i].y = Math.min(labels[i].y, labels[i + 1].y - GAP);
    }
    labels.forEach((l, i) => { l.y = Math.max(top, l.y); });
    labels.forEach((l, i) => {
      if (Math.abs(l.y - l.at) > 2) kids.push(E("path", {
        key:"ld" + i, d:"M" + iw + " " + l.at.toFixed(1) + " L" + (iw + 5) + " " + l.y.toFixed(1),
        stroke:"currentColor", strokeWidth:1, fill:"none", opacity:.3
      }));
      kids.push(E("text", {
        key:"lb" + i, x:iw + 9, y:l.y + 3.5, fontSize:11.5, fill:l.fill,
        fontWeight:l.weight, opacity:l.op
      }, l.t));
    });

    [0, 8, 16, 23].forEach(i => kids.push(txt("ax" + i, Math.min(iw, X(i)), h - 4,
      i === 0 ? "start" : i === 23 ? "end" : "middle", MONTHS[i].label)));
    return root(w, h, kids, "Pulse de la misma empresa visto por cada banco frente al consolidado");
  }

  /* Waterfall: puntos de score, con el peso en % debajo del nombre.
     Las barras suman el total dibujado; el % del texto se lee aquí. */
  function waterfall(attrib, w, h){
    const kids = [], items = attrib.items;
    /* Bandas reservadas: arriba para la cifra del pilar que sube,
       abajo para el nombre y el peso. El total entra en la escala:
       si no, la barra de total se sale del lienzo. */
    const pad = { t:18, b:34 }, gutter = 14;
    const plot = h - pad.t - pad.b, half = plot / 2, mid = pad.t + half;
    const colW = w / (items.length + 1);
    const maxAbs = Math.max(1, ...items.map(i => Math.abs(i.pts)), Math.abs(attrib.total));
    const scale = Math.max(0.5, (half - gutter) / maxAbs);
    kids.push(E("line", { key:"z", x1:0, x2:w, y1:mid, y2:mid, stroke:"currentColor", opacity:.28, strokeWidth:1 }));
    const bar = (i, n, pct, pts, fill, opacity) => {
      const x = colW * i + colW * .16, bw = colW * .68;
      const hgt = Math.min(half - 2, Math.abs(pts) * scale);
      kids.push(E("rect", { key:"r" + i, x:x, y:pts >= 0 ? mid - hgt : mid, width:bw, height:Math.max(1.5, hgt), rx:2, fill:fill, opacity:opacity }));
      const vy = pts >= 0
        ? Math.max(pad.t - 5, mid - hgt - 5)
        : Math.min(h - pad.b, mid + hgt + 12);
      kids.push(txt("v" + i, x + bw / 2, vy, "middle", fmtPts(pts), "currentColor"));
      kids.push(txt("n" + i, x + bw / 2, h - 18, "middle", n));
      if (pct != null) kids.push(txt("p" + i, x + bw / 2, h - 5, "middle", pct + "%", "currentColor"));
    };
    items.forEach((it, i) => bar(i, it.n, it.pct, it.pts, spectrum(it.pts >= 0 ? 82 : 22), .9));
    bar(items.length, "Total", 100, attrib.total, "currentColor", .5);
    return root(w, h, kids);
  }

  /* Antelación: meses. No es un score, así que no lleva color. */
  function histogram(bins, w, h){
    const kids = [], max = Math.max(...bins.map(b => b.v)), pad = { t:14, b:26 }, colW = w / bins.length;
    bins.forEach((b, i) => {
      const hgt = (h - pad.t - pad.b) * b.v / max;
      kids.push(E("rect", { key:"r" + i, x:colW * i + colW * .16, y:h - pad.b - hgt, width:colW * .68, height:hgt, rx:2, fill:"currentColor", opacity:b.v === max ? .5 : .26 }));
      kids.push(txt("k" + i, colW * i + colW * .5, h - 10, "middle", b.k));
      kids.push(txt("v" + i, colW * i + colW * .5, h - pad.b - hgt - 5, "middle", b.v + "%", "currentColor"));
    });
    return root(w, h, kids);
  }

  /* Cobertura frente a falsas alarmas, con los dos puntos de operación. */
  function tradeoff(w, h){
    const kids = [], pad = { l:34, r:14, t:14, b:30 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const X = v => pad.l + iw * v / 2.4, Y = v => pad.t + ih * (1 - v / 100);
    [0, 25, 50, 75, 100].forEach(g => {
      kids.push(E("line", { key:"g" + g, x1:pad.l, x2:w - pad.r, y1:Y(g), y2:Y(g), stroke:RULE, strokeWidth:1 }));
      kids.push(txt("gl" + g, pad.l - 7, Y(g) + 3.5, "end", String(g)));
    });
    [0, .8, 1.6, 2.4].forEach(g => kids.push(txt("x" + g, X(g), h - 10, "middle", String(g).replace(".", ","))));
    let d = "";
    for (let i = 0; i <= 60; i++){
      const fa = i / 60 * 2.4, cov = 100 * (1 - Math.exp(-1.55 * fa)) * .93;
      d += (i ? "L" : "M") + X(fa).toFixed(1) + " " + Y(cov).toFixed(1) + " ";
    }
    kids.push(E("path", { key:"c", d:d, fill:"none", stroke:"currentColor", strokeWidth:2, opacity:.55 }));
    const pts = [
      { fa:1.9, cov:94, lbl:"Hacia la empresa", fill:"currentColor", op:1 },
      { fa:.8,  cov:74, lbl:"Hacia el financiador", fill:"var(--raised)", op:1 }
    ];
    pts.forEach((p, i) => {
      kids.push(E("circle", { key:"p" + i, cx:X(p.fa), cy:Y(p.cov), r:4.5, fill:p.fill, stroke:"currentColor", strokeWidth:1.5 }));
      kids.push(E("circle", { key:"h" + i, cx:X(p.fa), cy:Y(p.cov), r:9, fill:"none", stroke:"currentColor", opacity:.3 }));
      kids.push(txt("pl" + i, X(p.fa) - 12, Y(p.cov) - 14, "end", p.lbl, "currentColor"));
    });
    kids.push(txt("yl", pad.l - 7, pad.t - 3, "end", "% cobertura"));
    kids.push(txt("xl", w - pad.r, h - 10, "end", "falsas alarmas por empresa y año"));
    return root(w, h, kids);
  }

  /* Camino de vuelta: el modelo invertido. Sí es score, sí lleva color. */
  function rehab(from, w, h){
    const kids = [], pad = { t:12, b:26 }, n = 14;
    const X = i => w * i / (n - 1), Y = v => pad.t + (h - pad.t - pad.b) * (1 - v / 100);
    [50, 70, 85].forEach(g => {
      kids.push(E("line", { key:"g" + g, x1:0, x2:w, y1:Y(g), y2:Y(g), stroke:RULE, strokeWidth:1 }));
      kids.push(txt("gl" + g, 2, Y(g) - 4, "start", bandName(g + 1)));
    });
    let d = "", pts = [];
    for (let i = 0; i < n; i++){
      const v = Math.min(92, from + (92 - from) * (1 - Math.exp(-i / 4.4)));
      pts.push(v); d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " ";
    }
    kids.push(E("path", { key:"p", d:d, fill:"none", stroke:spectrum(80), strokeWidth:2, strokeDasharray:"5 4" }));
    [[0,"hoy"],[4,"4 meses"],[8,"8 meses"],[13,"13 meses"]].forEach(pair => {
      const i = pair[0];
      kids.push(E("circle", { key:"c" + i, cx:X(i), cy:Y(pts[i]), r:3.4, fill:spectrum(pts[i]) }));
      kids.push(txt("l" + i, Math.min(w - 4, X(i)), h - 9, i === 0 ? "start" : i === 13 ? "end" : "middle", pair[1]));
    });
    return root(w, h, kids);
  }

  return { field, trace, waterfall, histogram, tradeoff, rehab, frag, nearestMover, isMover };
}
