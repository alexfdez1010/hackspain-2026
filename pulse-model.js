/* PULSE — modelo.
   Reconstruido del producto en pulse-embat.vercel.app:

     PULSE(mes)  = Σ(peso · score) / Σ(pesos con dato)
     aporte(var) = peso · score / Σ(pesos con dato)
     confianza   = Σ(pesos con dato) / 100

   Con eso los aportes suman siempre el PULSE del mes, y el score de cada
   pilar es la media de sus variables ponderada por peso. No hay ningún
   número suelto: todo se deriva de VARS y de los scores de pilar. */

export const COMPANY = {
  id:"COMP_0001", name:"Atresmedia Labs", group:"Grupo Ebro",
  obsFrom:"ene 2026", obsTo:"ago 2026", obsCount:8, fcTo:"ago 2027", universe:1285
};

export const BANDS = [
  { k:"critico", n:"Crítico",  range:"< 35",  lo:0,  hi:35,  c:"#C62A2F" },
  { k:"fragil",  n:"Frágil",   range:"35-50", lo:35, hi:50,  c:"#B06F00" },
  { k:"neutro",  n:"Neutro",   range:"50-65", lo:50, hi:65,  c:"#6E7488" },
  { k:"solido",  n:"Sólido",   range:"> 65",  lo:65, hi:101, c:"#12A150" }
];
export const NO_DATA = "#9AA1B4";
export function bandOf(s){
  if (s == null) return { k:"sindato", n:"sin datos", range:"", c:NO_DATA };
  return BANDS.find(b => s >= b.lo && s < b.hi) || BANDS[BANDS.length - 1];
}
export function bandLabel(s){
  const b = bandOf(s);
  return s == null ? "sin datos" : b.n + " (" + b.range.replace(" ", "") + ")";
}

export const PILLARS = [
  { k:"cobro", n:"Calidad de cobro",       weight:36 },
  { k:"liq",   n:"Liquidez",               weight:26 },
  { k:"deuda", n:"Deuda y servicio",       weight:26 },
  { k:"pago",  n:"Comportamiento de pago", weight:12 }
];

/* Las 11 variables. `ago` es el score del último cierre y `valor` su magnitud
   real; el resto de los meses se derivan de ahí conservando proporciones. */
export const VARS = [
  { k:"tramo90", i:8,  n:"Tramo +90 días",                 pillar:"cobro", weight:12, ago:71.8, real:"10 % vencido",      valor:"10,0 % de la cartera a más de 90 días" },
  { k:"contra",  i:12, n:"Exposición a contrapartes",       pillar:"cobro", weight:10, ago:63.0, real:"63 de 100",         valor:"salud media de tus clientes, 63 sobre 100" },
  { k:"topcli",  i:9,  n:"Caída del cliente top",           pillar:"cobro", weight:8,  ago:34.0, real:"−37 %",             valor:"−37,0 % de facturación del cliente principal en un trimestre" },
  { k:"dso",     i:7,  n:"DSO real",                        pillar:"cobro", weight:6,  ago:33.6, real:"32 días",           valor:"31,9 días en cobrar una factura" },
  { k:"minintra",i:2,  n:"Mínimo intramensual de caja",     pillar:"liq",   weight:14, ago:30.4, real:"8.700 €",           valor:"8.700 € el día más bajo del mes, 0,11 × las salidas mensuales" },
  { k:"diascaja",i:1,  n:"Días de caja",                    pillar:"liq",   weight:12, ago:39.0, real:"14 días",           valor:"14,0 días de pagos cubiertos con la caja de hoy" },
  { k:"util",    i:3,  n:"Utilización de líneas",           pillar:"deuda", weight:12, ago:null, real:"—",                 valor:"sin datos" },
  { k:"venc6",   i:10, n:"Vencimientos 6 m sobre caja",     pillar:"deuda", weight:8,  ago:34.0, real:"Sin detectar",      valor:"0 € a vencer en 6 meses según los datos conectados" },
  { k:"acel",    i:4,  n:"Aceleración de utilización",      pillar:"deuda", weight:6,  ago:null, real:"—",                 valor:"sin datos" },
  { k:"dpo",     i:5,  n:"DPO real y su variación",         pillar:"pago",  weight:6,  ago:68.7, real:"24 días",           valor:"24,4 días en pagar a un proveedor" },
  { k:"plazo",   i:6,  n:"Plazo concedido por proveedores", pillar:"pago",  weight:6,  ago:33.5, real:"17 días",           valor:"16,8 días de plazo que te conceden" }
];
export const VAR_BY_K = Object.fromEntries(VARS.map(v => [v.k, v]));

/* Qué faltaba cada mes. Los pesos que faltan explican la confianza publicada:
   ene 32 pts → 68 %, feb y mar 26 → 74 %, de abr en adelante 18 → 82 %. */
const MISSING = {
  "2026-01":["util","acel","topcli","dso"],
  "2026-02":["util","acel","topcli"],
  "2026-03":["util","acel","topcli"],
  "2026-04":["util","acel"], "2026-05":["util","acel"], "2026-06":["util","acel"],
  "2026-07":["util","acel"], "2026-08":["util","acel"]
};

export const OBS = [
  { k:"2026-01", label:"ene 2026", pulse:64.8, delta:null,  pillars:{ cobro:32.4, liq:78.3, deuda:100.0, pago:71.5 }, caja:35200 },
  { k:"2026-02", label:"feb 2026", pulse:53.1, delta:-11.7, pillars:{ cobro:29.7, liq:58.1, deuda:100.0, pago:65.8 }, caja:44900 },
  { k:"2026-03", label:"mar 2026", pulse:42.7, delta:-10.4, pillars:{ cobro:29.7, liq:49.2, deuda:34.6,  pago:64.5 }, caja:43700 },
  { k:"2026-04", label:"abr 2026", pulse:46.9, delta:4.2,   pillars:{ cobro:55.0, liq:33.1, deuda:32.1,  pago:62.4 }, caja:17300 },
  { k:"2026-05", label:"may 2026", pulse:47.5, delta:0.6,   pillars:{ cobro:59.3, liq:41.7, deuda:35.5,  pago:32.5 }, caja:66200 },
  { k:"2026-06", label:"jun 2026", pulse:42.1, delta:-5.4,  pillars:{ cobro:51.9, liq:35.8, deuda:32.3,  pago:32.8 }, caja:18300 },
  { k:"2026-07", label:"jul 2026", pulse:38.1, delta:-4.0,  pillars:{ cobro:53.0, liq:26.6, deuda:30.6,  pago:23.3 }, caja:8888 },
  { k:"2026-08", label:"ago 2026", pulse:45.6, delta:7.5,   pillars:{ cobro:54.6, liq:34.3, deuda:34.0,  pago:51.1 }, caja:37000 }
];
OBS.forEach(m => {
  m.missing = MISSING[m.k] || [];
  m.missWeight = m.missing.reduce((a, k) => a + VAR_BY_K[k].weight, 0);
  m.conf = 100 - m.missWeight;
});
export const LAST = OBS[OBS.length - 1];

/* Catálogo y riesgo, de la página de recomendaciones del producto. */
export const RISK = { tension6m:28, portfolio:22, euribor12:"2,95 %" };
export const CATALOG = 7;
export const FIT_MIN = 40;
export const PRODUCTS = [
  { n:"Línea de crédito", cat:"Circulante", amount:"45.000 €", term:"12 meses", rate:"10,02 %", spread:"+707 pb", fit:85,
    desc:"Dispones solo cuando necesitas; pagas únicamente lo dispuesto." },
  { n:"Confirming de proveedores", cat:"Pagos", amount:"90.000 €", term:"12 meses", rate:"7,60 %", spread:"+465 pb", fit:65,
    desc:"El banco paga a tus proveedores en la fecha pactada y tú liquidas más tarde." },
  { n:"Anticipo de facturas", cat:"Cobros", amount:"130.000 €", term:"12 meses", rate:"6,50 %", spread:"+355 pb", fit:50,
    desc:"Cobras hoy las facturas que tus clientes pagarán en 30-90 días." }
];
export const REJECTED = [
  { n:"Ampliación de línea de crédito", why:"No tienes ninguna línea de crédito que ampliar." },
  { n:"Préstamo a plazo", why:"Tu PULSE es 46, por debajo del mínimo de 60 para este producto." },
  { n:"Reestructuración de vencimientos", why:"No vemos vencimientos en los próximos seis meses, así que no hay calendario que reestructurar." },
  { n:"Depósito de excedentes", why:"Tu caja cubre 14 días de pagos, por debajo de los 180 que consideramos excedente." }
];
/* La palanca que conecta el PULSE con el precio. */
export const LEVER = { pillar:"liquidez", from:34, to:60, bp:395, tensionFrom:28, tensionTo:7 };

export const FC = [
  { h:1,  label:"sep 2026", v:45.1, p10:36.7, p90:53.5, d:-0.53 },
  { h:2,  label:"oct 2026", v:45.0, p10:33.0, p90:56.1, d:-0.68 },
  { h:3,  label:"nov 2026", v:45.0, p10:31.1, p90:58.2, d:-0.62 },
  { h:4,  label:"dic 2026", v:45.0, p10:30.4, p90:58.9, d:-0.61 },
  { h:5,  label:"ene 2027", v:45.0, p10:29.3, p90:59.4, d:-0.61 },
  { h:6,  label:"feb 2027", v:45.1, p10:28.4, p90:59.8, d:-0.59 },
  { h:7,  label:"mar 2027", v:45.1, p10:27.6, p90:60.3, d:-0.59 },
  { h:8,  label:"abr 2027", v:45.1, p10:27.1, p90:61.0, d:-0.58 },
  { h:9,  label:"may 2027", v:45.1, p10:26.7, p90:61.5, d:-0.57 },
  { h:10, label:"jun 2027", v:45.1, p10:26.3, p90:61.7, d:-0.57 },
  { h:11, label:"jul 2027", v:45.1, p10:25.8, p90:62.4, d:-0.57 },
  { h:12, label:"ago 2027", v:45.1, p10:25.9, p90:62.8, d:-0.57 }
];

/* Descomposición de la previsión a +12 m, tal y como la publica el producto.
   Para los demás horizontes se reescala para que las 13 barras sigan sumando
   exactamente el cambio previsto de ese horizonte. */
const FC_PARTS_12 = [
  { n:"Base del modelo",                        d:-2.26, base:true },
  { n:"Contexto: flujos, calendario y grupo",   d:-1.17, base:true },
  { n:"Mínimo intramensual de caja",            d:1.00,  k:"minintra" },
  { n:"Días de caja",                           d:0.68,  k:"diascaja" },
  { n:"Tramo +90 días",                         d:-0.68, k:"tramo90" },
  { n:"Vencimientos 6 m sobre caja",            d:0.43,  k:"venc6" },
  { n:"Utilización de líneas",                  d:0.36,  k:"util" },
  { n:"Caída del cliente top",                  d:0.36,  k:"topcli" },
  { n:"Plazo concedido por proveedores",        d:0.24,  k:"plazo" },
  { n:"Aceleración de utilización",             d:0.16,  k:"acel" },
  { n:"DPO real y su variación",                d:0.12,  k:"dpo" },
  { n:"Exposición a contrapartes",              d:0.12,  k:"contra" },
  { n:"DSO real",                               d:0.07,  k:"dso" }
];
const FC12_SUM = FC_PARTS_12.reduce((a, p) => a + p.d, 0);

export function fcParts(h){
  const row = FC.find(f => f.h === h) || FC[FC.length - 1];
  const scale = row.d / FC12_SUM;
  return FC_PARTS_12.map(p => Object.assign({}, p, { d:p.d * scale }));
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* Detalle de un mes: reparte el score de cada pilar entre sus variables con
   dato, conservando las proporciones del último cierre y corrigiendo para que
   la media ponderada del pilar sea exactamente la publicada. */
export function monthDetail(mk){
  const m = OBS.find(x => x.k === mk) || LAST;
  const rows = [];
  for (const p of PILLARS){
    const vs = VARS.filter(v => v.pillar === p.k && m.missing.indexOf(v.k) === -1 && v.ago != null);
    if (!vs.length) continue;
    const wsum = vs.reduce((a, v) => a + v.weight, 0);
    const target = m.pillars[p.k];
    const baseAvg = vs.reduce((a, v) => a + v.weight * v.ago, 0) / wsum;
    let sc = vs.map(v => clamp(v.ago * (target / baseAvg), 2, 100));
    for (let pass = 0; pass < 3; pass++){
      const avg = vs.reduce((a, v, i) => a + v.weight * sc[i], 0) / wsum;
      const shift = target - avg;
      if (Math.abs(shift) < .01) break;
      sc = sc.map(x => clamp(x + shift, 2, 100));
    }
    vs.forEach((v, i) => rows.push(Object.assign({}, v, { score:sc[i] })));
  }
  const wData = rows.reduce((a, v) => a + v.weight, 0);
  rows.forEach(v => { v.aporte = v.weight * v.score / wData; });
  for (const k of m.missing) rows.push(Object.assign({}, VAR_BY_K[k], { score:null, aporte:null }));
  for (const v of VARS) if (!rows.some(r => r.k === v.k)) rows.push(Object.assign({}, v, { score:null, aporte:null }));
  rows.sort((a, b) => b.weight - a.weight || a.i - b.i);
  const pillars = PILLARS.map(p => {
    const inP = rows.filter(r => r.pillar === p.k);
    const withData = inP.filter(r => r.score != null);
    const wp = withData.reduce((a, r) => a + r.weight, 0);
    return {
      k:p.k, n:p.n, weight:p.weight,
      score:wp ? withData.reduce((a, r) => a + r.weight * r.score, 0) / wp : null,
      aporte:inP.reduce((a, r) => a + (r.aporte || 0), 0)
    };
  });
  return { month:m, rows:rows, pillars:pillars, wData:wData, total:rows.reduce((a, r) => a + (r.aporte || 0), 0) };
}

export function pillarSeries(pk){ return OBS.map(m => m.pillars[pk]); }

export function fmtNum(v, dec){
  if (v == null) return "sin datos";
  return v.toFixed(dec == null ? 1 : dec).replace(".", ",");
}
export function fmtSigned(v, dec){
  if (v == null) return "—";
  const d = dec == null ? 1 : dec;
  return (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toFixed(d).replace(".", ",");
}
/* Tinte de un hex de la paleta, para fondos de celda. */
export function tint(hex, a){
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}
export function fmtMiles(v){
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
export function fmtEur(v){
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
}

/* ------------------------------------------------------------------ gráficos */
export function charts(React){
  const E = React.createElement;
  const INK3 = "var(--text-secondary)", RULE = "var(--data-grid)";
  const root = (w, h, kids, label) => E("svg", {
    viewBox:"0 0 " + w + " " + h, width:"100%", height:h, preserveAspectRatio:"none",
    role:"img", "aria-label":label || undefined, style:{ display:"block", overflow:"visible" }
  }, kids);
  const txt = (key, x, y, anchor, children, fill, size, weight) => E("text", {
    key:key, x:x, y:y, textAnchor:anchor, fill:fill || INK3, fontSize:size || 11,
    fontWeight:weight || 400, fontFamily:"var(--font-sans)"
  }, children);

  /* Regla de bandas: dónde cae el PULSE en la escala 0-100 y de dónde viene.
     Sustituye al velocímetro: misma lectura, sin adorno y con los cortes. */
  function bandRuler(value, prev, w, h){
    const kids = [], barY = 34, barH = 16;
    const X = v => w * v / 100;
    BANDS.forEach(b => {
      const x0 = X(b.lo), x1 = X(Math.min(100, b.hi));
      kids.push(E("rect", { key:"b" + b.k, x:x0, y:barY, width:x1 - x0, height:barH, rx:4, fill:b.c, opacity:.18 }));
      kids.push(txt("bl" + b.k, (x0 + x1) / 2, barY + barH + 15, "middle", b.n, b.c, 11, 600));
      if (b.lo > 0) kids.push(txt("bv" + b.k, x0, barY - 6, "middle", String(b.lo), INK3, 10.5));
    });
    if (prev != null){
      kids.push(E("line", { key:"pv", x1:X(prev), x2:X(prev), y1:barY - 2, y2:barY + barH + 2, stroke:"var(--text-muted)", strokeWidth:1.5, strokeDasharray:"2 2" }));
      kids.push(txt("pvl", X(prev), 11, "middle", "mes anterior " + fmtNum(prev), INK3, 10.5));
    }
    const bc = bandOf(value).c;
    kids.push(E("rect", { key:"mk", x:X(value) - 1.6, y:barY - 5, width:3.2, height:barH + 10, rx:1.6, fill:bc }));
    return root(w, h, kids, "PULSE " + fmtNum(value) + " sobre la escala de bandas");
  }

  /* Trayectoria: continua lo observado, discontinua la previsión, área la
     banda p10-p90. El punto que se señala se lee arriba, no en un tooltip. */
  function trajectory(obs, fc, w, h, hover){
    const kids = [], padT = 14, padB = 22, padL = 26;
    const n = obs.length + fc.length;
    const X = i => padL + (w - padL) * i / (n - 1);
    const lo = 20, hi = 72;
    const Y = v => padT + (h - padT - padB) * (1 - (clamp(v, lo, hi) - lo) / (hi - lo));
    [35, 50, 65].forEach(gv => {
      kids.push(E("line", { key:"g" + gv, x1:padL, x2:w, y1:Y(gv), y2:Y(gv), stroke:RULE, strokeWidth:1 }));
      kids.push(txt("gl" + gv, padL - 6, Y(gv) + 3.5, "end", String(gv), INK3, 10.5));
    });
    kids.push(E("line", { key:"g50", x1:padL, x2:w, y1:Y(50), y2:Y(50), stroke:"var(--text-muted)", strokeWidth:1, strokeDasharray:"3 3", opacity:.6 }));

    let band = "M" + X(obs.length - 1).toFixed(1) + " " + Y(obs[obs.length - 1].pulse).toFixed(1) + " ";
    fc.forEach((f, i) => { band += "L" + X(obs.length + i).toFixed(1) + " " + Y(f.p90).toFixed(1) + " "; });
    for (let i = fc.length - 1; i >= 0; i--) band += "L" + X(obs.length + i).toFixed(1) + " " + Y(fc[i].p10).toFixed(1) + " ";
    band += "Z";
    kids.push(E("path", { key:"band", d:band, fill:"var(--data-forecast)", opacity:.34 }));

    let d = "";
    obs.forEach((m, i) => { d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(m.pulse).toFixed(1) + " "; });
    kids.push(E("path", { key:"obs", d:d, fill:"none", stroke:"var(--data-balance)", strokeWidth:2.4, strokeLinejoin:"round" }));
    let f = "M" + X(obs.length - 1).toFixed(1) + " " + Y(obs[obs.length - 1].pulse).toFixed(1) + " ";
    fc.forEach((x, i) => { f += "L" + X(obs.length + i).toFixed(1) + " " + Y(x.v).toFixed(1) + " "; });
    kids.push(E("path", { key:"fc", d:f, fill:"none", stroke:"var(--data-forecast-line)", strokeWidth:2, strokeDasharray:"5 4" }));

    kids.push(E("line", { key:"split", x1:X(obs.length - 1), x2:X(obs.length - 1), y1:padT, y2:h - padB, stroke:"var(--border-subtle)", strokeWidth:1 }));
    kids.push(txt("splitl", X(obs.length - 1) + 6, padT + 9, "start", "previsión", INK3, 10.5));

    obs.forEach((m, i) => kids.push(E("circle", { key:"o" + i, cx:X(i), cy:Y(m.pulse), r:i === obs.length - 1 ? 4 : 3.5, fill:"var(--data-balance)" })));
    if (hover != null && hover >= 0 && hover < n){
      const isObs = hover < obs.length;
      const v = isObs ? obs[hover].pulse : fc[hover - obs.length].v;
      kids.push(E("line", { key:"hv", x1:X(hover), x2:X(hover), y1:padT, y2:h - padB, stroke:"var(--border-strong)", strokeWidth:1 }));
      kids.push(E("circle", { key:"hd", cx:X(hover), cy:Y(v), r:5, fill:"var(--surface-raised)", stroke:bandOf(v).c, strokeWidth:2.5 }));
    }
    const ticks = [0, 2, 4, 7, 9, 13, 17, 19];
    ticks.forEach(i => {
      if (i >= n) return;
      const lbl = i < obs.length ? obs[i].label.slice(0, 3) : fc[i - obs.length].label.slice(0, 3);
      const anchor = i === 0 ? "start" : i === ticks[ticks.length - 1] ? "end" : "middle";
      kids.push(txt("t" + i, X(i), h - 6, anchor, lbl, INK3, 10.5));
    });
    return root(w, h, kids, "Trayectoria del PULSE observada y prevista");
  }

  /* Mapa de calor: columnas por pilar con el ancho del peso del pilar, filas
     con la altura del peso de cada variable. El área es peso y el color banda. */
  function heatmap(detail, w, h, hoverKey, onHover){
    const kids = [], gap = 3, headH = 22;
    let x = 0;
    PILLARS.forEach(p => {
      const cw = (w - gap * (PILLARS.length - 1)) * p.weight / 100;
      const pil = detail.pillars.find(q => q.k === p.k);
      /* El 4.º pilar pesa 12 %, así que su columna no llega a 100 px: el
         encabezado se corta a la anchura de la columna igual que las celdas. */
      const cut = (s, px) => { const max = Math.max(4, Math.floor(px / 5.9)); return s.length > max ? s.slice(0, max - 1) + "\u2026" : s; };
      kids.push(txt("ph" + p.k, x, 11, "start", cut(p.n, cw), "var(--text-primary)", 13, 600));
      kids.push(txt("ps" + p.k, x, 11 + 14, "start", cut(pil.score == null ? "sin datos" : fmtNum(pil.score) + " · " + bandLabel(pil.score), cw), "var(--text-secondary)", 11.5));
      const vs = detail.rows.filter(r => r.pillar === p.k);
      const wsum = vs.reduce((a, v) => a + v.weight, 0);
      let y = headH + 10;
      vs.forEach(v => {
        const rh = (h - headH - 10 - gap * (vs.length - 1)) * v.weight / wsum;
        const b = bandOf(v.score);
        const on = hoverKey === v.k;
        kids.push(E("rect", {
          key:"r" + v.k, x:x, y:y, width:cw, height:Math.max(3, rh), rx:4,
          fill:v.score == null ? "var(--surface-deep)" : b.c,
          opacity:v.score == null ? 1 : (on ? 1 : .9),
          stroke:on ? "var(--text-primary)" : (v.score == null ? "var(--border-strong)" : "none"),
          strokeWidth:on ? 1.6 : 1,
          style:{ cursor:"pointer" },
          onMouseEnter:onHover ? () => onHover(v.k) : null
        }));
        if (rh > 15){
          const tc = v.score == null ? INK3 : "#fff";
          const nm = v.n.length > Math.floor(cw / 5.4) ? v.n.slice(0, Math.max(4, Math.floor(cw / 5.4) - 1)) + "…" : v.n;
          kids.push(txt("rn" + v.k, x + 7, y + 14, "start", nm, tc, 10.5, 500));
          if (rh > 28) kids.push(txt("rv" + v.k, x + 7, y + 27, "start", v.score == null ? "sin datos" : fmtNum(v.score) + "  ·  " + v.weight + " pts", tc, 10, 400));
        }
        y += rh + gap;
      });
      x += cw + gap;
    });
    return root(w, h, kids, "Mapa de calor de las once variables por pilar");
  }

  /* Pilar: misma escala en los cuatro, guías en 35, 50 y 65. */
  function pillarSpark(series, w, h){
    const kids = [], padT = 8, padB = 8, lo = 20, hi = 105;
    const Y = v => padT + (h - padT - padB) * (1 - (clamp(v, lo, hi) - lo) / (hi - lo));
    const X = i => w * i / (series.length - 1);
    [35, 50, 65].forEach(gv => kids.push(E("line", { key:"g" + gv, x1:0, x2:w, y1:Y(gv), y2:Y(gv), stroke:RULE, strokeWidth:1 })));
    let d = "";
    series.forEach((v, i) => { d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1) + " "; });
    kids.push(E("path", { key:"a", d:d + "L" + w + " " + (h - padB) + " L0 " + (h - padB) + " Z", fill:bandOf(series[series.length - 1]).c, opacity:.13 }));
    kids.push(E("path", { key:"l", d:d, fill:"none", stroke:bandOf(series[series.length - 1]).c, strokeWidth:2, strokeLinejoin:"round" }));
    series.forEach((v, i) => kids.push(E("circle", { key:"p" + i, cx:X(i), cy:Y(v), r:i === series.length - 1 ? 3.5 : 2, fill:bandOf(v).c })));
    return root(w, h, kids);
  }

  /* Aportes: barras horizontales en puntos de PULSE, con el peso al lado. */
  function contribBars(rows, w, h, hoverKey, onHover){
    const kids = [], labelW = 186, valW = 62, rowH = h / rows.length;
    const plotW = Math.max(40, w - labelW - valW - 86);
    const max = Math.max.apply(null, rows.map(r => r.aporte || 0)) || 1;
    rows.forEach((r, i) => {
      const y = i * rowH, bh = Math.min(13, rowH - 5);
      const on = hoverKey === r.k;
      kids.push(E("rect", {
        key:"hit" + i, x:0, y:y, width:w, height:rowH, fill:"transparent",
        style:{ cursor:"pointer" }, onMouseEnter:onHover ? () => onHover(r.k) : null
      }));
      kids.push(txt("n" + i, labelW - 10, y + rowH / 2 + 3.5, "end", r.n.length > 30 ? r.n.slice(0, 29) + "…" : r.n, on ? "var(--text-primary)" : "var(--text-secondary)", 12.5, on ? 500 : 400));
      if (r.aporte == null){
        kids.push(E("rect", { key:"e" + i, x:labelW, y:y + (rowH - bh) / 2, width:plotW * .16, height:bh, rx:4, fill:"var(--surface-deep)", stroke:"var(--border-strong)", strokeWidth:1 }));
        kids.push(txt("v" + i, labelW + plotW * .16 + 8, y + rowH / 2 + 3.5, "start", "sin datos", "var(--text-muted)", 12));
      } else {
        const bw = plotW * (r.aporte / max);
        kids.push(E("rect", { key:"b" + i, x:labelW, y:y + (rowH - bh) / 2, width:Math.max(2, bw), height:bh, rx:4, fill:bandOf(r.score).c, opacity:on ? 1 : .86 }));
        /* La cifra va dentro solo si la barra la contiene de verdad: medida
           por glifos, no por un umbral a ojo. Fuera, a la derecha. */
        const lbl = fmtNum(r.aporte, 2) + " pts";
        const inside = bw > lbl.length * 6.6 + 18;
        kids.push(txt("v" + i, inside ? labelW + bw - 9 : labelW + bw + 8, y + rowH / 2 + 3.5,
          inside ? "end" : "start", lbl, inside ? "#fff" : "var(--text-primary)", 12.5, 500));
      }
      kids.push(txt("w" + i, w, y + rowH / 2 + 3.5, "end", r.weight + " pts de peso", "var(--text-muted)", 11.5));
    });
    return root(w, h, kids, "Puntos de PULSE que aporta cada variable");
  }

  /* Previsión desglosada: barras a los dos lados del cero, positivas a la
     derecha. Las 13 suman exactamente el cambio previsto del horizonte. */
  function forecastFall(parts, w, h){
    const kids = [], labelW = 208, rowH = h / parts.length;
    const plotW = Math.max(60, w - labelW - 54);
    const max = Math.max.apply(null, parts.map(p => Math.abs(p.d))) || 1;
    const zero = labelW + plotW * .34;
    const negW = plotW * .34, posW = plotW * .66;
    kids.push(E("line", { key:"z", x1:zero, x2:zero, y1:0, y2:h, stroke:"var(--border-strong)", strokeWidth:1 }));
    parts.forEach((p, i) => {
      const y = i * rowH, bh = Math.min(12, rowH - 4);
      const pos = p.d >= 0;
      const bw = (pos ? posW : negW) * (Math.abs(p.d) / max);
      kids.push(txt("n" + i, labelW - 12, y + rowH / 2 + 3.5, "end", p.n.length > 30 ? p.n.slice(0, 29) + "…" : p.n, p.base ? "var(--text-primary)" : "var(--text-secondary)", 12.5, p.base ? 500 : 400));
      kids.push(E("rect", {
        key:"b" + i, x:pos ? zero : zero - bw, y:y + (rowH - bh) / 2,
        width:Math.max(1.5, bw), height:bh, rx:4,
        fill:pos ? BANDS[3].c : BANDS[0].c, opacity:p.base ? .92 : .74
      }));
      /* La cifra va dentro de la barra negativa solo si cabe medida por
         glifos; si no, fuera y a la izquierda. */
      const lbl = fmtSigned(p.d, 2);
      const inside = !pos && bw > lbl.length * 6.4 + 16;
      kids.push(txt("v" + i,
        pos ? zero + bw + 7 : (inside ? zero - bw + 8 : zero - bw - 7),
        y + rowH / 2 + 3.5,
        pos ? "start" : (inside ? "start" : "end"),
        lbl, inside ? "#fff" : "var(--text-primary)", 12, 500));
    });
    return root(w, h, kids, "Descomposición del cambio previsto en puntos de PULSE");
  }

  return { bandRuler, trajectory, heatmap, pillarSpark, contribBars, forecastFall };
}
