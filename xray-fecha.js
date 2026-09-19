/* X-Ray — modelo de la fecha.
   El objeto del producto es una FECHA: el primer día en que el saldo cruza la
   barrera (first-passage time). No hay score. Todo se mide en días.

   Sustituir PERIMS / buildGroups / FICHAS por fetch('/data/…') cuando el
   pipeline escriba los JSON; las firmas de los gráficos no cambian. */

export const TODAY = new Date(2026, 8, 19);
const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MES_C = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export function addDays(base, n){ const d = new Date(base.getTime()); d.setDate(d.getDate() + n); return d; }
export function dayDiff(a, b){ return Math.round((a - b) / 86400000); }
export function fmtLong(d){ return d.getDate() + " de " + MES[d.getMonth()] + " de " + d.getFullYear(); }
export function fmtShort(d){ return d.getDate() + " " + MES_C[d.getMonth()] + " " + String(d.getFullYear()).slice(2); }
export function fmtDays(n){ const v = Math.round(n); return (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v) + " días"; }
export function fmtDaysBare(n){ const v = Math.round(n); return (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v); }

/* Los tres niveles de cobertura. La desigualdad es la arquitectura: qué dato
   hay decide qué precisión se puede prometer, y eso va en la cara de la UI. */
export const LEVELS = {
  1:{ n:"Nivel 1", empresas:1158, pct:90, has:"Saldo diario reconstruido", gives:"La fecha existe", lacks:"Sin facturas: las obligaciones futuras son estimadas" },
  2:{ n:"Nivel 2", empresas:609,  pct:47, has:"+ facturas emitidas y recibidas", gives:"La fecha se afina con obligaciones ciertas", lacks:"Sin líneas de crédito: la barrera se supone en cero" },
  3:{ n:"Nivel 3", empresas:192,  pct:15, has:"+ líneas de crédito disponibles", gives:"La barrera no es cero, es el límite real", lacks:null }
};

export const COBERTURA = [
  { lvl:3, empresas:192,  pct:15 },
  { lvl:2, empresas:609,  pct:47 },
  { lvl:1, empresas:1158, pct:90 }
];

/* Los cuatro perímetros de visión sobre el mismo grupo. La fecha real es la
   del consolidado; las otras tres son lo que ve quien mira un trozo. */
export const PERIMS = [
  { id:"san",  n:"Banco Santander",   sees:"1 de las 7 cuentas",  accounts:1, days:19,  level:1, barrier:0,
    note:"Ve la nómina y una cuenta operativa. No ve los cobros que entran por CaixaBank." },
  { id:"cax",  n:"CaixaBank",         sees:"2 de las 7 cuentas",  accounts:2, days:61,  level:1, barrier:0,
    note:"Ve los cobros de clientes, pero no el vencimiento de deuda que está en Santander." },
  { id:"fil",  n:"Velasco Industrial, en solitario", sees:"4 de las 7 cuentas", accounts:4, days:106, level:2, barrier:0,
    note:"La filial completa, sin el grupo. No ve los 1,4 M€ que le puede barrer la matriz." },
  { id:"gru",  n:"Grupo Velasco consolidado", sees:"las 7 cuentas, en 4 bancos", accounts:7, days:176, level:3, barrier:-0.3,
    note:"Las siete cuentas, el flujo intragrupo y las líneas disponibles. La barrera no es cero.", real:true }
];

export const PERIM_GAP = PERIMS[PERIMS.length - 1].days - PERIMS[0].days;
export const CREDIT_LINE = "−480 k€ de línea disponible";

/* Curva de saldo de un perímetro, normalizada a [barrier, 1].
   Los dientes son los días de nómina: la empresa no muere por su saldo medio,
   muere el día 28. Por construcción el último diente ES el cruce, así que la
   fecha que sale del gráfico y la fecha del titular son la misma. */
const DIP = 0.19;
export function laneCurve(days, barrier){
  barrier = barrier || 0;
  const dips = [];
  for (let d = days; d > 0; d -= 30) dips.push(d);
  const pts = [];
  for (let t = 0; t <= days; t++){
    const base = 1 + (barrier + DIP - 1) * (t / days);
    let dip = 0;
    for (const dd of dips) dip = Math.max(dip, DIP * Math.max(0, 1 - Math.abs(t - dd) / 2.6));
    pts.push(base - dip);
  }
  return pts;
}

function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const HEADS = ["Velasco","Northbrook","Arcela","Mendive","Torralba","Kestrel","Bonaval","Aridane","Lumbrera","Saldaña","Verdeña","Ormaza","Baltar","Peñalba","Olivares","Ribamar","Quintanar","Teverga","Aldabe","Cerezal","Fontela","Miramar","Nogueira","Sarrión","Vallcarca","Ardanza","Brezal","Caldera","Espadán","Finisterre","Gaztelu","Hontanar","Iraeta","Jarama","Lastanosa","Monteagudo","Navacerrada","Sotillo","Trévago","Urbión"];
const TAILS = ["Grupo","Holding","Industrial","Ibérica","Partners","Agro","Levante","Norte","Sistemas","Europa"];
const SECTORS = ["Industrial","Distribución","Alimentación","Construcción","Logística","Servicios","Retail","Química","Automoción","Agro"];

/* 250 grupos. El orden natural de la cartera es cuánto se ha movido la fecha,
   no dónde está: un grupo con 400 días de margen estable no necesita a nadie. */
export function buildGroups(){
  const r = rng(20260919), out = [];
  for (let i = 0; i < 250; i++){
    const lr = r();
    const level = lr < .15 ? 3 : lr < .47 ? 2 : 1;
    const hasDate = r() < .90;
    const empresas = 1 + Math.floor(r() * 9);
    const runway = Math.round(40 + Math.pow(r(), .7) * 560);
    /* El movimiento de la fecha es de cola: casi todo el mundo se mueve poco y
       unos pocos mucho. Calibrado para que a 30 días disparen ~20 grupos de 250
       (no caben en un presupuesto de 5) y a 60 días disparen ~3 (sí caben). */
    const up = r() < .48;
    const mag = -Math.log(1 - r() * .999) * (up ? 14 : 14.5);
    const shift = Math.round(up ? mag : -mag);
    const intragroup = empresas > 1 && r() < .88;
    out.push({
      id:"G" + String(100 + i),
      name:HEADS[Math.floor(r() * HEADS.length)] + " " + TAILS[Math.floor(r() * TAILS.length)],
      sector:SECTORS[Math.floor(r() * SECTORS.length)],
      empresas:empresas, level:level, hasDate:hasDate,
      runway:runway, date:addDays(TODAY, runway),
      shift:shift, prevDate:addDays(TODAY, runway - shift),
      intragroup:intragroup,
      intraShare:intragroup ? Math.round(12 + r() * 46) : 0,
      seed:Math.floor(r() * 1e9)
    });
  }
  const velasco = out[0], north = out[1];
  Object.assign(velasco, {
    id:"G001", name:"Grupo Velasco", sector:"Industrial", empresas:4, level:3, hasDate:true,
    runway:176, date:addDays(TODAY, 176), shift:-94, prevDate:addDays(TODAY, 270),
    intragroup:true, intraShare:38, pinned:true
  });
  Object.assign(north, {
    id:"G002", name:"Northbrook Foods", sector:"Alimentación", empresas:3, level:2, hasDate:true,
    runway:288, date:addDays(TODAY, 288), shift:68, prevDate:addDays(TODAY, 220),
    intragroup:true, intraShare:21, pinned:true
  });
  return out;
}

/* Fichas fijas: las dos empresas del propio enunciado de Embat. */
export const FICHAS = {
  G001:{
    empresa:"Velasco Industrial", grupo:"Grupo Velasco", cuentas:7, bancos:4, level:3,
    median:176, p10:136, p90:214,
    scoreFrom:82, scoreTo:68,
    /* La traducción obligatoria: los puntos no son el producto, los días sí. */
    scoreInDays:-94,
    barrier:CREDIT_LINE,
    /* Cómo se ha movido la fecha que predecíamos, mes a mes. */
    track:[386,392,381,375,370,362,341,318,296,270,241,212,176],
    causes:[
      { n:"Póliza 34→79%", d:-38 },
      { n:"Bullet feb", d:-31 },
      { n:"DPO 42→67 d", d:19 },
      { n:"Aldabe +18 d", d:-27 },
      { n:"Miramar −31%", d:-17 }
    ],
    actions:[
      { t:"Barrer la caja del grupo a la cuenta de nóminas", s:"1,4 M€ dispersos en 5 bancos sin remunerar. El grupo tiene el dinero; la filial no lo tiene donde hace falta.", d:41, kind:"intragrupo" },
      { t:"Adelantar el cobro de 3 facturas de Aldabe Europa", s:"340 k€ en el tramo de más de 90 días. Confirming al 4,1%.", d:22, kind:"cobros" },
      { t:"Disponer 600 k€ de la línea de Banco Sur", s:"Al 3,4% frente al 5,9% de la póliza que está al 79%.", d:31, kind:"deuda" },
      { t:"Renegociar el vencimiento de febrero", s:"Alargar 18 meses cuesta 14 k€ y quita el pico.", d:36, kind:"deuda" },
      { t:"Contrato de Miramar Ibérica cayendo un 31%", s:"Aquí no hay palanca de tesorería. Es una conversación comercial, esta semana.", d:0, kind:"comercial" }
    ]
  },
  G002:{
    empresa:"Northbrook Foods", grupo:"Northbrook Foods", cuentas:4, bancos:2, level:2,
    median:288, p10:241, p90:332,
    scoreFrom:45, scoreTo:65,
    scoreInDays:68,
    barrier:"cero: sin líneas de crédito en el dato",
    track:[214,208,216,221,219,227,236,244,251,262,270,279,288],
    causes:[
      { n:"Líneas 72→31%", d:34 },
      { n:"DSO 74→61 d", d:26 },
      { n:"Factoring fuera", d:11 },
      { n:"Estacionalidad", d:-9 },
      { n:"Barrido diario", d:6 }
    ],
    actions:[
      { t:"Reabrir el límite preaprobado en 1,8 M€", s:"La mejora sostenida cambia el precio 150 pb.", d:0, kind:"deuda" },
      { t:"Sustituir el confirming restante por línea propia", s:"31 k€ al año sobre el circulante actual.", d:12, kind:"deuda" },
      { t:"Mantener el barrido diario", s:"Ya activo. Aporta 9 días frente a la dispersión anterior.", d:9, kind:"intragrupo" }
    ]
  }
};

export function ficha(g){
  const f = FICHAS[g.id];
  if (f) return Object.assign({}, f, { group:g });
  const r = rng(g.seed);
  const med = g.runway;
  const causes = [
    { n:"Líneas de crédito", d:Math.round((r() - .62) * 70) },
    { n:"Vencim. a 90 d", d:Math.round((r() - .7) * 52) },
    { n:"Plazo proveedores", d:Math.round((r() - .4) * 34) },
    { n:"Cobro cliente 1", d:Math.round((r() - .68) * 40) },
    { n:"Estacionalidad", d:Math.round((r() - .5) * 18) }
  ].sort((a, b) => a.d - b.d);
  const track = [];
  for (let i = 12; i >= 0; i--) track.push(Math.max(20, Math.round(med - g.shift * (i / 12) + (r() - .5) * 14)));
  return {
    empresa:g.name, grupo:g.name, cuentas:2 + Math.round(r() * 6), bancos:1 + Math.round(r() * 3),
    level:g.level, median:med,
    p10:Math.max(12, Math.round(med * (.72 - r() * .08))), p90:Math.round(med * (1.16 + r() * .1)),
    scoreFrom:null, scoreTo:null, scoreInDays:g.shift,
    barrier:g.level === 3 ? CREDIT_LINE : "cero: sin líneas de crédito en el dato",
    track:track, causes:causes,
    actions:[
      { t:"Barrer la caja del grupo", s:"Saldo disperso en " + (3 + Math.round(r() * 3)) + " bancos.", d:8 + Math.round(r() * 30), kind:"intragrupo" },
      { t:"Adelantar el cobro de las facturas de más de 90 días", s:"Hay " + (120 + Math.round(r() * 400)) + " k€ en ese tramo.", d:7 + Math.round(r() * 18), kind:"cobros" },
      { t:"Disponer de la línea más barata antes que de la habitual", s:"Diferencial de " + (140 + Math.round(r() * 160)) + " pb.", d:6 + Math.round(r() * 22), kind:"deuda" }
    ],
    group:g
  };
}

/* ------------------------------------------------------------------ gráficos */
export function charts(React){
  const E = React.createElement;
  const INK3 = "var(--ink-3)", RULE = "var(--rule-soft)";
  const root = (w, h, kids, label) => E("svg", {
    viewBox:"0 0 " + w + " " + h, width:"100%", height:h, preserveAspectRatio:"none",
    role:"img", "aria-label":label || undefined, style:{ display:"block", overflow:"visible" }
  }, kids);
  const txt = (key, x, y, anchor, children, fill, size, weight) => E("text", {
    key:key, x:x, y:y, textAnchor:anchor, fill:fill || INK3, fontSize:size || 11,
    fontWeight:weight || 400, fontFamily:"Barlow, sans-serif"
  }, children);

  const MONTH_TICKS = [
    { d:12,  l:"oct" }, { d:43,  l:"nov" }, { d:73,  l:"dic" },
    { d:104, l:"ene" }, { d:135, l:"feb" }, { d:163, l:"mar" }
  ];

  /* EL gráfico. Cuatro perímetros, cuatro saldos, cuatro fechas de cruce.
     La longitud de cada carril ES el margen que cree tener quien mira ese
     trozo, así que el argumento se lee de un vistazo desde el fondo. */
  function runway(perims, w, h, activeId){
    const padL = 186, padR = 148, padB = 58, gap = 9;
    const plotW = Math.max(120, w - padL - padR);
    const maxDays = 188;
    const X = d => padL + plotW * d / maxDays;
    const laneH = (h - padB - gap * (perims.length - 1)) / perims.length;
    const kids = [];

    MONTH_TICKS.forEach(m => {
      kids.push(E("line", { key:"mt" + m.d, x1:X(m.d), x2:X(m.d), y1:0, y2:h - padB + 5, stroke:RULE, strokeWidth:1 }));
      kids.push(txt("ml" + m.d, X(m.d), h - padB + 18, "middle", m.l));
    });

    perims.forEach((p, i) => {
      const top = i * (laneH + gap);
      const zeroY = top + laneH * (1 / 1.42);
      const Y = v => top + laneH * ((1.06 - v) / 1.42);
      const dim = activeId && activeId !== p.id;
      const col = p.real ? "var(--truth)" : "var(--ink-2)";
      const op = dim ? .3 : 1;

      kids.push(E("line", { key:"z" + i, x1:padL, x2:X(p.days) + 4, y1:zeroY, y2:zeroY, stroke:"currentColor", strokeWidth:1, opacity:.3 * op }));
      if (p.barrier < 0){
        kids.push(E("line", { key:"bl" + i, x1:padL, x2:X(p.days) + 4, y1:Y(p.barrier), y2:Y(p.barrier), stroke:"var(--truth)", strokeWidth:1, strokeDasharray:"3 3", opacity:.6 * op }));
      }

      const pts = laneCurve(p.days, p.barrier);
      let d = "", area = "";
      pts.forEach((v, t) => {
        const x = X(t * p.days / (pts.length - 1)).toFixed(1), y = Y(v).toFixed(1);
        d += (t ? "L" : "M") + x + " " + y + " ";
      });
      area = d + "L" + X(p.days).toFixed(1) + " " + zeroY.toFixed(1) + " L" + padL + " " + zeroY.toFixed(1) + " Z";
      kids.push(E("path", { key:"a" + i, d:area, fill:col, opacity:(p.real ? .2 : .1) * op }));
      kids.push(E("path", { key:"l" + i, d:d, fill:"none", stroke:col, strokeWidth:p.real ? 2.2 : 1.5, strokeLinejoin:"round", opacity:op }));

      kids.push(E("line", { key:"x" + i, x1:X(p.days), x2:X(p.days), y1:top + 2, y2:top + laneH - 2, stroke:col, strokeWidth:p.real ? 2 : 1.2, opacity:op }));

      kids.push(txt("n" + i, padL - 14, top + laneH * .42, "end", p.n, p.real ? "var(--ink)" : "var(--ink-2)", 12.5, p.real ? 600 : 500));
      kids.push(txt("s" + i, padL - 14, top + laneH * .42 + 14, "end", p.sees, INK3, 11));

      kids.push(txt("dl" + i, X(p.days) + 11, top + laneH * .42, "start", p.dateShort, p.real ? "var(--truth)" : "var(--ink)", p.real ? 15 : 13.5, p.real ? 700 : 600));
      kids.push(txt("dd" + i, X(p.days) + 11, top + laneH * .42 + 14, "start", p.days + " días", INK3, 11));
    });

    const x0 = X(perims[0].days), x1 = X(perims[perims.length - 1].days);
    const by = h - 20;
    kids.push(E("path", { key:"br", d:"M" + x0 + " " + (by - 6) + " L" + x0 + " " + by + " L" + x1 + " " + by + " L" + x1 + " " + (by - 6), fill:"none", stroke:"var(--act)", strokeWidth:1.4 }));
    kids.push(txt("brl", (x0 + x1) / 2, h - 4, "middle", PERIM_GAP + " días de diferencia", "var(--act)", 13, 600));
    return root(w, h, kids, "Saldo de cuatro perímetros de visión y el día en que cada uno cruza su barrera");
  }

  /* Cartera: 250 grupos por cuánto se ha movido su fecha. Cero en el centro;
     a la izquierda la fecha se ha adelantado. La posición ya lleva el signo,
     así que el color solo marca lo que dispara una acción. */
  function strip(groups, w, h, threshold, activeId){
    const padB = 26, lo = -120, hi = 80;
    const kids = [], plotH = h - padB;
    const X = v => (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * w;
    [-90, -60, -30, 0, 30, 60].forEach(g => {
      const on = g === 0;
      kids.push(E("line", { key:"g" + g, x1:X(g), x2:X(g), y1:0, y2:plotH, stroke:on ? "currentColor" : RULE, strokeWidth:1, opacity:on ? .4 : 1 }));
      kids.push(txt("gl" + g, X(g), h - 9, "middle", g === 0 ? "sin cambio" : fmtDaysBare(g)));
    });
    kids.push(E("rect", { key:"th", x:0, y:0, width:X(-threshold), height:plotH, fill:"var(--act)", opacity:.06 }));
    kids.push(E("line", { key:"thl", x1:X(-threshold), x2:X(-threshold), y1:0, y2:plotH, stroke:"var(--act)", strokeWidth:1, strokeDasharray:"3 3", opacity:.7 }));
    kids.push(txt("tht", X(-threshold) - 6, 12, "end", "umbral de alerta", "var(--act)", 11));

    const rr = rng(4242);
    groups.forEach((g, i) => {
      if (!g.hasDate) return;
      const x = X(g.shift);
      const y = 16 + rr() * (plotH - 26);
      const fires = g.shift <= -threshold;
      const on = activeId === g.id;
      kids.push(E("circle", {
        key:"p" + i, cx:x, cy:y, r:on ? 4.2 : (g.empresas > 4 ? 2.6 : 1.9),
        fill:fires ? "var(--act)" : "var(--ink-2)",
        opacity:on ? 1 : (fires ? .85 : .42),
        stroke:on ? "var(--ink)" : null, strokeWidth:on ? 1.2 : null
      }));
    });
    return root(w, h, kids, "Distribución de 250 grupos por el movimiento de su fecha en días");
  }

  /* La fecha que predecíamos cada mes. Si baja, el margen se está comiendo
     sin que nadie haya pedido nada. El eje y son días de margen. */
  function dateTrack(track, w, h){
    const kids = [], padL = 4, padB = 22, padT = 12;
    const n = track.length;
    const lo = Math.min.apply(null, track), hi = Math.max.apply(null, track);
    const min = Math.max(0, lo - (hi - lo) * .22), max = hi + (hi - lo) * .12;
    const X = i => padL + (w - padL) * i / (n - 1);
    const Y = v => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
    [lo, hi].forEach((v, k) => {
      kids.push(E("line", { key:"g" + k, x1:padL, x2:w, y1:Y(v), y2:Y(v), stroke:RULE, strokeWidth:1 }));
      kids.push(txt("gl" + k, padL, Y(v) - 5, "start", v + " días de margen"));
    });
    let d = "";
    track.forEach((v, i) => { d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " "; });
    kids.push(E("path", { key:"area", d:d + "L" + w + " " + (h - padB) + " L" + padL + " " + (h - padB) + " Z", fill:"var(--truth)", opacity:.1 }));
    kids.push(E("path", { key:"l", d:d, fill:"none", stroke:"var(--truth)", strokeWidth:2.2, strokeLinejoin:"round" }));
    kids.push(E("circle", { key:"e", cx:X(n - 1), cy:Y(track[n - 1]), r:3.4, fill:"var(--truth)" }));
    kids.push(txt("t0", padL, h - 6, "start", "hace 12 meses"));
    kids.push(txt("t1", w, h - 6, "end", "hoy"));
    return root(w, h, kids, "Evolución de la fecha prevista en los últimos doce meses");
  }

  /* Qué movió la fecha, en días. La unidad es la de la decisión del CFO. */
  function daysFall(items, w, h){
    const kids = [], padT = 16, padB = 36;
    const mid = padT + (h - padT - padB) / 2;
    const colW = w / (items.length + 1);
    const total = items.reduce((a, b) => a + b.d, 0);
    const maxAbs = Math.max(1, Math.max.apply(null, items.map(i => Math.abs(i.d))), Math.abs(total));
    const scale = Math.max(.5, ((h - padT - padB) / 2 - 13) / maxAbs);
    kids.push(E("line", { key:"z", x1:0, x2:w, y1:mid, y2:mid, stroke:"currentColor", strokeWidth:1, opacity:.3 }));
    const bar = (i, label, d, fill, opacity, weight) => {
      const x = colW * i + colW * .17, bw = colW * .66;
      const hgt = Math.min((h - padT - padB) / 2 - 2, Math.abs(d) * scale);
      kids.push(E("rect", { key:"r" + i, x:x, y:d >= 0 ? mid - hgt : mid, width:bw, height:Math.max(1.5, hgt), rx:2, fill:fill, opacity:opacity }));
      const vy = d >= 0 ? Math.max(padT - 4, mid - hgt - 5) : Math.min(h - padB + 10, mid + hgt + 13);
      kids.push(txt("v" + i, x + bw / 2, vy, "middle", fmtDaysBare(d), "var(--ink)", 12, weight || 600));
      const words = label.split(" ");
      let line = "", lines = [];
      for (const word of words){
        if ((line + " " + word).trim().length > 20){ lines.push(line.trim()); line = word; }
        else line += " " + word;
      }
      lines.push(line.trim());
      lines.slice(0, 2).forEach((ln, k) => kids.push(txt("n" + i + "_" + k, x + bw / 2, h - padB + 24 + k * 11, "middle", ln, INK3, 10.5)));
    };
    items.forEach((it, i) => bar(i, it.n, it.d, it.d >= 0 ? "var(--truth)" : "var(--ink-2)", .8));
    bar(items.length, "Neto", total, "var(--act)", .85, 700);
    return root(w, h, kids);
  }

  /* La banda, no el punto. P10 es el escenario pesimista y es el que importa:
     nadie planifica una nómina contra la mediana. */
  function bandBar(p10, median, p90, w, h){
    const kids = [], padR = 2, lo = 0, hi = p90 * 1.12;
    const X = v => (w - padR) * v / hi;
    const y = h * .46, bh = 12;
    kids.push(E("rect", { key:"b", x:X(p10), y:y - bh / 2, width:Math.max(2, X(p90) - X(p10)), height:bh, rx:2, fill:"var(--truth)", opacity:.18 }));
    kids.push(E("rect", { key:"c", x:X(p10), y:y - bh / 2, width:Math.max(2, X(median) - X(p10)), height:bh, rx:2, fill:"var(--truth)", opacity:.22 }));
    [[p10, "P10", "var(--act)", 700], [median, "mediana", "var(--truth)", 700], [p90, "P90", INK3, 400]].forEach((s, i) => {
      kids.push(E("line", { key:"m" + i, x1:X(s[0]), x2:X(s[0]), y1:y - bh / 2 - 5, y2:y + bh / 2 + 5, stroke:s[2], strokeWidth:i === 2 ? 1 : 1.8 }));
      kids.push(txt("ml" + i, X(s[0]), y - bh / 2 - 10, i === 0 ? "start" : i === 2 ? "end" : "middle", s[1], s[2], 11, s[3]));
      kids.push(txt("mv" + i, X(s[0]), y + bh / 2 + 19, i === 0 ? "start" : i === 2 ? "end" : "middle", s[0] + " d", s[2], 11.5, s[3]));
    });
    return root(w, h, kids, "Banda de incertidumbre de la fecha, del percentil 10 al 90");
  }

  /* Cobertura: la desigualdad del dato, a escala. */
  function coverage(rows, w, h){
    const kids = [], rowH = h / rows.length, total = 1286;
    rows.forEach((r, i) => {
      const y = i * rowH, bw = (w - 92) * r.empresas / total;
      kids.push(E("rect", { key:"r" + i, x:0, y:y + rowH * .26, width:Math.max(2, bw), height:rowH * .34, rx:2, fill:r.lvl === 3 ? "var(--truth)" : "var(--ink-2)", opacity:r.lvl === 3 ? .8 : .34 }));
      kids.push(txt("l" + i, bw + 8, y + rowH * .52, "start", "Nivel " + r.lvl, "var(--ink)", 12, 600));
      kids.push(txt("v" + i, bw + 8, y + rowH * .52 + 13, "start", r.empresas.toLocaleString("es-ES") + " empresas · " + r.pct + "%", INK3, 11));
    });
    return root(w, h, kids);
  }

  return { runway, strip, dateTrack, daysFall, bandBar, coverage };
}
