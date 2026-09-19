# Design system

This document is the single source of truth for the product's visual language,
interaction model, and component decisions. It complements HeroUI; it does not
replace HeroUI's accessible primitives.

## Mandatory design rules

These rules apply to every product task, including when this template still has
unresolved placeholders. Keep them when completing or updating this document.

- **Every word must add information.** Never add filler copy, decorative labels,
  generic slogans, redundant headings, or descriptions that repeat what is
  already clear. Text must help users understand content, make a decision, take
  an action, or understand a state. Remove text that serves none of these
  purposes; preserve necessary instructions and accessible labels.
- **Every border or line must have a purpose.** Avoid unnecessary card outlines,
  panel borders, dividers, and decorative rules. Establish hierarchy with spacing,
  alignment, typography, and grouping first. Use a border or separator only when
  it materially improves comprehension or control recognition. The marketing
  `SiteFrame` is the exception: its 1px gutters and center axis are the page
  columns (sangría), not card chrome. Preserve visible focus indicators and
  boundaries needed for accessibility.
- **Treat space as part of the design.** Use a consistent spacing scale and
  deliberate padding, gaps, margins, and line heights. Keep related elements
  closer together than unrelated groups. Balance density and breathing room;
  avoid cramped controls, arbitrary gaps, and oversized empty areas. Check
  alignment, readable line lengths, and spacing at mobile and desktop widths,
  including when text wraps or expands.

## 1. Product foundation

- Product name: Embat Pulse
- One-sentence promise: cada mes, saber qué empresas de la cartera están
  empeorando, si el cambio es estructural y cuánto circulante se les puede
  ofrecer.
- Primary audience: equipos de riesgo y producto de Embat; bancos socios que
  aportan balance a la línea de circulante; aseguradoras de crédito que ajustan
  prima y límite con la misma señal.
- Key user needs: ordenar 1.286 empresas por movimiento y no por nivel;
  distinguir un bache pasajero de una caída estructural; explicar el score ante
  un comité; traducir el score en un límite y un precio defendibles.
- Brand personality: financiero y sobrio. Muestra el número y su procedencia;
  no persuade, informa.
- Words and patterns to avoid: «revolucionario», «IA», «potenciado por», iconos
  decorativos, tarjetas con borde que sólo envuelven una cifra, títulos que
  repiten el nombre de la sección, porcentajes sin base ni horizonte.

## 2. Visual direction

- Design principles, in priority order: (1) el dato manda —cada cifra lleva su
  unidad, su base y su horizonte—; (2) el color sólo codifica score, dirección o
  severidad, nunca decora; (3) jerarquía por espacio y tipografía antes que por
  líneas; (4) densidad alta pero legible: es una herramienta de trabajo, no un
  folleto.
- Reference products or visual inspirations: terminales de riesgo bancario y
  paneles de tesorería; tablas densas con tipografía tabular.
- What makes this product recognisable: la escala de color del score aplicada de
  forma idéntica en tabla, gráficos, mapa de calor y línea de crédito, y los
  gráficos SVG propios, sin librería ni cromos.
- Density: compact en tablas y listas; balanced en cabeceras y textos.
- Shape language: mixed —radios suaves de HeroUI en controles, rectángulos
  netos en barras y celdas de datos.
- Site frame: cuatro columnas (`gutter | 1fr | 1fr | gutter`). El gutter es
  `clamp(1rem, 6vw, 4.5rem)` (`--site-gutter`). Líneas de `--separator` a todo
  el alto: interior de cada gutter y, en la landing, el eje central (oculto
  bajo `lg`). La landing son tres bandas `h-dvh` (hero / cuerpo / pie); el pie
  llena la tercera banda: columna izquierda reservada; Platform / Docs y
  franja legal en el cuadrante derecho, con aire a eje y gutter.
- `/` es marketing. El producto empieza en `/radar`.

## 3. Foundations

### Color

Tokens semánticos de HeroUI v3 (`background`, `foreground`, `surface`, `muted`,
`accent`, `danger`…), más una escala propia del score. El tema oscuro se activa
con `prefers-color-scheme` redefiniendo únicamente los tokens primitivos en
`globals.css`; los derivados de HeroUI se recalculan solos. En la landing el
esquema no sigue al sistema: banda 0 (hero) y 2 (pie) fuerzan oscuro; la banda
1 (medio) fuerza claro, vía `data-band-theme` en el scroller.

| Token               | Light value            | Dark value             | Usage                        |
| ------------------- | ---------------------- | ---------------------- | ---------------------------- |
| `background`        | `#fbfbfc`              | `#050b2c`              | Lienzo de la aplicación      |
| `foreground`        | `#050b2c`              | `#ffffff`              | Texto principal              |
| `surface`           | `#ffffff`              | `#232845`              | Tarjetas y paneles           |
| `surface-secondary` | `#f3f4f6`              | `#41465f`              | Fondo de barras y celdas     |
| `accent`            | `#3878f6`              | `#5c92fe`              | Acción primaria y foco       |
| `muted`             | `#6e707c`              | `#afafbb`              | Texto secundario y etiquetas |
| `danger`            | `#c2401f`              | `#c2401f`              | Estados destructivos         |
| `--separator`       | `#d2d2db`              | `#373c56`              | Guías de columna y ejes      |
| `--score-critical`  | `oklch(0.6 0.21 26)`   | `oklch(0.68 0.2 26)`   | Score < 35                   |
| `--score-fragile`   | `oklch(0.72 0.15 72)`  | `oklch(0.79 0.15 76)`  | Score 35-50                  |
| `--score-neutral`   | `oklch(0.62 0.03 262)` | `oklch(0.72 0.03 262)` | Score 50-65                  |
| `--score-solid`     | `oklch(0.63 0.15 156)` | `oklch(0.74 0.16 157)` | Score > 65                   |

Contrast requirements: WCAG AA (4,5:1) para texto sobre `background` y
`surface`; 3:1 para bordes de control y elementos gráficos portadores de
información. El color nunca es el único portador de significado: el score
siempre se acompaña del número y de la banda en texto accesible, y las alertas
llevan etiqueta de severidad además de color.

### Typography

- Display family and weights: Aktiv Grotesk 700 en `h1`/`h2`, 500 en `h3`
  (`--font-display`), `tracking-tight`. No hay SemiBold: 600 resuelve a Bold.
- Body family and weights: DM Sans 400 (texto), 500 (énfasis) y 600 (cifras
  destacadas) (`--font-sans`). Cuerpo, tablas y enlaces de navegación.
- Identifiers (`COMP_0001`) and raw figures use DM Sans with `tabular-nums`.
  There is no dedicated mono face.
- Wordmark: custom geometric SVG spelling `PULSE` in uppercase. Nav:
  `PulseWordmark`, un fill `currentColor`, 24px. Hero: `PulseHeroMark` a
  escala de columna, las mismas geometrías, `currentColor`. La U es el asta
  izquierda y un cuenco corto (sin asta derecha) para leerse como U y no como
  L; LSE se apartan lo justo para no solapar. Variante inversa: `tone="white"`
  y `public/pulse-wordmark-white.svg` (`#ffffff`). El `h1` accesible es «Embat
  Pulse»; el SVG del hero es presentacional.
- Type scale: 12 / 14 / 16 / 18 / 24 / 30 / 36 px (`text-xs` … `text-4xl`).
  Toda cifra comparable usa `tabular-nums`.
- Line-height rules: 1,5 en texto corrido; 1,25 en titulares y cifras.
- Maximum readable line length: 70-75 caracteres (`max-w-3xl`).

### Spacing, shape, and elevation

- Base spacing unit: 4 px (`--spacing` de HeroUI).
- Spacing scale: 2, 3, 4, 5, 6, 8, 10 → gaps dentro de un grupo ≤ 4; entre
  grupos 6-8; entre secciones de página 10.
- Border radii: `--radius` 0,5 rem en controles; 2 px en celdas de datos.
- Border treatment: sin contornos decorativos en el producto. En marketing, las
  únicas líneas son las del `SiteFrame` (gutters, eje, cortes entre bandas).
  En datos, sólo se dibuja una línea cuando separa lecturas (guías 35/50/65,
  changepoint, eje cero).
- Shadow/elevation levels: sólo la sombra propia de HeroUI en `Card` y en
  overlays; ningún nivel adicional.
- Focus ring treatment: anillo de HeroUI (`--focus`, 2 px de offset), nunca
  suprimido.

### Motion

- Motion principles: la interfaz de producto no anima datos. Sólo transiciones
  de estado de control (hover, foco, apertura de popover). La landing pagina
  una banda por gesto con un tween `ease-in-out` cúbico; el snap nativo queda
  como respaldo antes de hidratar. El lienzo (`background` / `foreground` /
  `--separator`) cambia de esquema a la vez que la banda. Un pulso de 12 s
  recorre la línea derecha del `SiteFrame` (`foreground` al 35 %); no usa
  score ni `accent`. El subrayado de `HeroAccess` se oculta de izquierda a
  derecha y se vuelve a dibujar (500 ms); no usa score ni `accent`.
- Duration scale: 120 ms para hover y color; 200 ms para overlays; 500 ms para
  el recorte del subrayado del hero; 900 ms para el cambio de banda en
  marketing; 12 s para el pulso del gutter.
- Easing curves: las de HeroUI (`ease-out` a la entrada, `ease-in` a la salida)
  en producto; `ease-in-out` cúbico en el paging de la landing, el pulso y el
  subrayado del hero.
- Reduced-motion behavior: se respeta `prefers-reduced-motion`; el paging de la
  landing salta sin tween (ni de scroll ni de color), el pulso del gutter no
  recorre y el subrayado del hero queda estático.

## 4. Component system

Use HeroUI v3 components first. Document any wrapper or new primitive before
adding it to the codebase.

| Component/pattern | HeroUI primitive                       | Approved variants            | Usage guidance                                                                |
| ----------------- | -------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Button            | `Button`                               | `secondary`, `tertiary`      | Sólo acciones de la propia vista (paginar, invertir orden).                   |
| Link              | `Link` / `next/link`                   | por defecto                  | `next/link` para navegación interna; `Link` de HeroUI cuando lleva icono.     |
| Card              | `Card`                                 | `secondary`                  | Únicamente la tarjeta de Embat Capital, que agrupa oferta y evolución.        |
| Form field        | `SearchField`, `Select` + `ListBox`    | por defecto                  | Filtros del radar; cada control lleva `aria-label`, no etiqueta visible.      |
| Feedback          | `Chip`                                 | `soft` con `color` semántico | Dirección, régimen, severidad y estado de la línea.                           |
| Data              | `Table`                                | por defecto                  | Tabla de cartera, dentro de `Table.ScrollContainer`.                          |
| Wordmark          | SVG propio (`PulseWordmark`)           | `currentColor`               | Marca en la nav; el enlace lleva `aria-label="Embat Pulse"`.                  |
| Hero mark         | SVG propio (`PulseHeroMark`)           | tokens de score + accent     | Solo en `/`. El `h1` es «Embat Pulse»; el SVG es `aria-hidden`.               |
| Site frame        | `SiteFrame`                            | `split`, `pulse`             | Gutters y eje; `pulse` solo en `/`, sobre la línea derecha existente.         |
| Landing scroll    | `LandingScroll`                        | paging 900 ms                | Un gesto, una banda; tween propio, no snap nativo.                            |
| Landing footer    | `LandingFooter`                        | cuadrante derecho            | Listas Platform/Docs a media altura; copyright y legal abajo.                 |
| Footer heatmap    | Paper `Heatmap` (`PulseFooterHeatmap`) | rampa Embat                  | Columna izquierda, solo `lg+`; `aria-hidden`; `speed={0}` con reduced motion. |
| Hero access       | `HeroAccess`                           | cuadrícula 2×2               | Radar, PULSE, Capital, Monitor (`HERO_SECTIONS`); subrayado animado.          |

Component rules:

- Composition rule: los gráficos son componentes SVG propios en
  `src/components/charts`, sin librería externa; reciben datos ya calculados y
  no acceden a la fuente de datos.
- Loading and pending states: las páginas son Server Components que leen datos
  locales; no hay estados de carga que mostrar.
- Empty states: siempre texto que explica qué falta y qué aparecerá cuando
  llegue (feed de alertas, anticipación, historial de límite).
- Error states: una empresa desconocida devuelve 404 de Next.js; un backend
  caído degrada a lista vacía con su texto, nunca a excepción.
- Destructive actions: no existen en este producto.
- Responsive behavior: rejillas de una columna por debajo de `sm`; la tabla y el
  mapa de calor scrollan en horizontal dentro de su contenedor.

## 5. Accessibility and content

- Keyboard interaction expectations: todo control es alcanzable con Tab y opera
  con Enter/Espacio; los filtros del monitor y de Capital son enlaces, por lo
  que funcionan sin JavaScript.
- Screen-reader and semantic HTML requirements: un solo `h1` por página,
  `section` con `h2`, listas de definición para cifras, `role="img"` con
  `aria-label` en cada SVG y `aria-live="polite"` en el recuento de resultados.
- Minimum contrast target: WCAG AA.
- Localization and text expansion rules: interfaz en español, números con
  `Intl` en `es-ES`; los rótulos vienen del dataset, así que el diseño no asume
  longitudes fijas.
- Voice and tone: afirmativo y concreto. Se nombra la magnitud, la unidad y el
  horizonte.
- Content examples: «77,4 % eventos avisados · 472 de 610 episodios»;
  «Caída estructural: el nivel medio del score bajó 58 puntos».

## 6. Layout and responsive behavior

- Container widths: `max-w-7xl` en páginas de producto; `max-w-3xl` en texto
  corrido. La landing usa el `SiteFrame` a viewport completo, no `max-w-7xl`.
- Breakpoints: los de Tailwind (`sm` 640, `lg` 1024).
- Navigation behavior by breakpoint: en producto, barra superior fija que
  envuelve en varias líneas en móvil. En `/` no hay `SiteNav`; el acceso es
  `HeroAccess` (cuadrícula 2×2). En `lg` el hero es 50/50 y el pie ocupa el
  cuadrante derecho (listas + legal); la columna izquierda del pie queda vacía.
  Por debajo de `lg`, wordmark, accesos y pie se apilan dentro de los gutters.
- Mobile-first exceptions: la tabla de cartera y el mapa de calor mantienen su
  ancho mínimo y scrollan.
- Table/data-density strategy: 40 filas por lote con un botón para ampliar; el
  filtrado y el orden se resuelven en cliente sobre la proyección ligera que
  envía el servidor.

## 7. Decision log

Record meaningful deviations from HeroUI defaults or previously approved
patterns.

| Date       | Decision                                                                              | Reason                                                                                         | Owner        |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| 2026-09-18 | Gráficos SVG propios en lugar de una librería de charting                             | Formas muy específicas (changepoint, waterfall, curva de evento) y bundle mínimo               | Equipo Pulse |
| 2026-09-18 | Tema oscuro por `prefers-color-scheme` redefiniendo tokens primitivos                 | HeroUI expone su paleta oscura tras `.dark`; sin conmutador no hay estado que guardar          | Equipo Pulse |
| 2026-09-18 | Escala de color del score como único helper (`scoreBand`)                             | Un mismo score debe tener el mismo color en tabla, gráfico, mapa de calor y oferta             | Equipo Pulse |
| 2026-09-18 | Filtros de Monitor y Capital como enlaces con query string                            | Vistas compartibles durante la demo y funcionales sin JavaScript                               | Equipo Pulse |
| 2026-09-19 | Observado y previsión en un solo gráfico, con banda p10-p90 y marca del último cierre | Comparar nivel y horizonte en la misma escala; la incertidumbre no puede quedar en otra figura | Equipo Pulse |
| 2026-09-19 | Variable sin datos como «sin datos» y nunca como cero, junto a la confianza en %      | Un cero es una medición; la ausencia de evidencia cambia la decisión y debe verse              | Equipo Pulse |
| 2026-09-19 | Pairing Aktiv Grotesk (display) + DM Sans (cuerpo); Geist fuera                       | Display neo-grotesk comercial junto a un cuerpo tabular; el wordmark `pulse` se alinea a Aktiv | Equipo Pulse |
| 2026-09-19 | `/` landing con `SiteFrame`; radar en `/radar`                                        | Marketing y producto no comparten nav; las líneas del frame son columnas, no cromo             | Equipo Pulse |
| 2026-09-19 | Tokens de producto tomados de embat.io (azul `#3878f6`, tinta `#050b2c`)              | Pulse debe integrarse con Embat; las bandas de score no se retintan                            | Equipo Pulse |
| 2026-09-19 | Wordmark `PULSE` mayúsculas; U a media asta, LSE sin hueco                            | Firma geométrica legible a 24px; un fill `currentColor` en nav y hero                          | Equipo Pulse |
| 2026-09-19 | Cuenco de la U corto, sin asta derecha                                                | El pie al ancho del counter se leía como L; un cuenco moderado marca la U                      | Equipo Pulse |
| 2026-09-19 | Wordmark inverso blanco (`#ffffff`) junto al fill `currentColor`                      | Sobre campo oscuro hace falta un lockup fijo, no solo heredar el color de texto                | Equipo Pulse |
| 2026-09-19 | Pie de landing: copy mínimo en la columna derecha; pulso sobre la línea del gutter    | Demo de empresa sin páginas legales inventadas; la señal recorre cromo ya estructural          | Equipo Pulse |
| 2026-09-19 | Pie: Pulse + columnas Platform/Docs; sin Embat ni HackSpain                           | Escala de footer real; solo rutas que existen; la marca de marketing es Pulse                  | Equipo Pulse |
| 2026-09-19 | Pie en el cuadrante derecho: listas + legal; izquierda reservada                      | No duplicar la marca; aire a eje y gutter; condiciones y privacidad como páginas mínimas       | Equipo Pulse |
| 2026-09-19 | Heatmap Paper (`noise` 0.73) en la columna izquierda del pie                          | El shader de Tender iris es la marca del pie; silueta local (no CDN) sobre el canvas blanco    | Equipo Pulse |
| 2026-09-19 | Rampa Heatmap en tinta / surface / accent / blanco, sin cian ni amarillo              | El pie es marca, no score; el amarillo de Paper se leía como banda frágil                      | Equipo Pulse |
| 2026-09-19 | Landing oscuro / claro / oscuro por banda; producto sigue `prefers-color-scheme`      | El medio pide papel; hero y pie siguen tinta Embat; el sistema no debe pelear con el paging    | Equipo Pulse |
| 2026-09-19 | Hero: lista Dashboard en lugar de pestaña; secciones compartidas con la nav           | Acceso directo a cada superficie; un solo catálogo de rutas                                    | Equipo Pulse |
| 2026-09-19 | Hero: 2×2 Radar/PULSE/Capital/Monitor; subrayado que se contrae y vuelve              | Cuatro superficies de trabajo; Método en Docs; Radiografía desde Radar                         | Equipo Pulse |
| 2026-09-19 | Subrayado del hero: wipe izquierda→derecha y redibujo, sin desplazar el texto         | La línea se esconde in situ; el enlace no se mueve                                             | Equipo Pulse |

- 2026-09-18: Require informative copy, purposeful borders, and deliberate spacing
  for every product task. Keep these permanent rules in this document and enforce
  them through the main agent instructions to prevent visual and content clutter.

## 8. Review checklist

- [x] All `[Fill in]` placeholders are resolved.
- [x] Tokens are semantic and have light/dark values where needed.
- [x] Keyboard, focus, contrast, and reduced-motion behavior are defined.
- [x] Approved HeroUI primitives and variants are listed.
- [x] A representative page has been checked at mobile and desktop widths.
- [x] Every piece of copy adds useful information; filler and repetition are removed.
- [x] Every border, divider, and line has a functional or accessibility purpose.
- [x] Spacing, grouping, alignment, and text wrapping are deliberate at mobile and desktop widths.
- [x] The team has approved this document before feature implementation.
