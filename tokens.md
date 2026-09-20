# X-Ray — tokens

Sistema de una sola regla: **el color significa exactamente dos cosas**.
`truth` es la fecha real y lo que la calcula bien. `act` es lo que se puede
hacer y lo que dispara un aviso. Todo lo demás es acromático. Nada de
rojo/verde como portador único de significado: la posición, el tamaño y el
peso llevan el signo.

## tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground:   "#0E1615",   // fondo de la aplicación
        raised:   "#141F1E",   // panel
        sunken:   "#0A100F",   // campos, código, fondo de barra
        ink:      "#E9EEEC",   // texto principal
        "ink-2":  "#A6B3B0",   // lectura secundaria
        "ink-3":  "#8A9893",   // etiquetas, ejes, notas al pie
        rule:     "rgba(233,238,236,0.15)",
        "rule-soft": "rgba(233,238,236,0.07)",
        lift:     "rgba(255,255,255,0.05)",
        truth:    "#2CC0BC",   // la fecha real / el consolidado
        act:      "#D8A354"    // acción, días ganados, alerta disparada
      },
      fontFamily: {
        sans: ["Barlow", "system-ui", "sans-serif"],
        cond: ["Barlow Condensed", "Barlow", "sans-serif"]
      },
      fontSize: {
        // escala de producto
        note:  ["13px",   { lineHeight: "1.55" }],
        body:  ["14.5px", { lineHeight: "1.6"  }],
        lead:  ["16px",   { lineHeight: "1.5"  }],
        // escala de fecha, siempre en font-cond
        "d-sm": ["19px", { lineHeight: "1",   letterSpacing: "0"       }],
        "d-md": ["28px", { lineHeight: "1",   letterSpacing: "-.01em"  }],
        "d-lg": ["46px", { lineHeight: ".9",  letterSpacing: "-.015em" }],
        "d-xl": ["74px", { lineHeight: ".86", letterSpacing: "-.015em" }],
        "d-2xl":["118px",{ lineHeight: ".84", letterSpacing: "-.02em"  }]
      },
      borderRadius: { panel: "8px", pill: "999px" },
      spacing: { panel: "1.375rem", gutter: "0.875rem" }
    }
  }
};
```

## Fuentes

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet">
```

Barlow para la interfaz, Barlow Condensed **solo** para fechas y cifras de días.
La condensada es lo que permite poner «118 px» de fecha sin que rompa línea, y
lo que la hace legible a cinco metros. `font-variant-numeric: tabular-nums` en
el `body`, siempre: las columnas de días tienen que alinearse.

## Reglas que no se negocian

1. **La fecha es el héroe.** En cualquier pantalla donde aparezca es el elemento
   tipográficamente dominante. Nunca compite con un score.
2. **Todo en días.** Si algo está en puntos, va traducido debajo en la misma
   tarjeta: «−14 puntos son −94 días de margen».
3. **La banda, no el punto.** P10 en `act`, mediana en `truth`, P90 en `ink-3`.
   El nivel de cobertura (1/2/3) es texto visible, no un asterisco.
4. **Ningún aviso sin acción cuantificada en días.** Cuando no hay palanca de
   tesorería se dice: la conversación es comercial.
5. **Sin sombras.** El volumen lo da una línea de luz de 1 px (`lift`) en el
   borde superior del panel.
6. **Sentence case.** Mayúsculas solo en el eyebrow, con `tracking` .04em.

## Piezas

```tsx
// Panel
<section className="relative rounded-panel border border-rule-soft bg-raised p-panel
                    before:absolute before:inset-x-0 before:top-0 before:h-px
                    before:rounded-t-panel before:bg-lift before:content-['']">

// Fecha héroe
<b className="font-cond text-d-xl font-bold text-truth">14 de marzo de 2027</b>

// Días, junto a la fecha
<b className="font-cond text-d-md font-semibold">176 días</b>
<span className="text-[12.5px] text-ink-3">de margen desde hoy</span>

// Días ganados por una acción en curso
<b className="font-cond text-d-md font-bold text-act">+41 días</b>

// Eyebrow
<span className="text-[12.5px] uppercase tracking-[.04em] text-ink-3">
  Velasco Industrial · 7 cuentas en 4 bancos · nivel 3 de cobertura
</span>

// Acción (un solo nivel de botón en toda la app: el sistema no empuja ninguna)
<button className="rounded-pill border border-rule px-4 py-1.5 text-[13px]
                   hover:border-ink-3">Ejecutar</button>
<button className="rounded-pill border border-transparent bg-sunken px-4 py-1.5
                   text-[13px] text-ink-3">En curso</button>

// Fila de tabla pinchable
<button className="-mx-2 grid w-full grid-cols-[minmax(0,1fr)_96px_78px_54px] items-baseline
                   gap-3 rounded-md border-b border-rule-soft px-2 py-2.5
                   text-left text-[14px] hover:bg-sunken">
```

## Los cinco gráficos

Todos son SVG generado a mano, sin librería, con `preserveAspectRatio="none"` y
el ancho medido del contenedor. Ninguno depende del bucle de frames: si
`clientWidth` es 0 (documento oculto, impresión, captura) se resuelve subiendo
por los ancestros. Están en `xray-fecha.js`, función `charts(React)`:

| función | dónde | qué demuestra |
| --- | --- | --- |
| `runway` | La fecha falsa | Cuatro perímetros, cuatro cruces, el diferencial |
| `strip` | Cartera | 250 grupos por movimiento de fecha, umbral marcado |
| `dateTrack` | Ficha, Comparación | La fecha que predecíamos cada mes |
| `daysFall` | Ficha | Qué movió la fecha, en días, con el neto |
| `bandBar` | Ficha | P10 / mediana / P90 |
| `coverage` | Cartera | Niveles 1/2/3 a escala real |

En `runway`, los dientes de sierra de cada carril son los días de nómina, y por
construcción **el último diente es el cruce**: la fecha que sale del gráfico y la
del titular son el mismo número. Si cambias `laneCurve`, esa invariante se
mantiene sola.

## Contrato de datos

El front no calcula nada. Lee `index.json` (los 250 grupos) y
`group/{id}.json` (fecha, banda, track de 13 meses, causas en días, acciones en
días, perímetros, nivel de cobertura). Sustituir `buildGroups` / `FICHAS` en
`xray-fecha.js` por los `fetch` y no tocar nada más.
