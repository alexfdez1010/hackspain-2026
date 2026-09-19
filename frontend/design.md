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
- **Separate with a line, never with a shadow.** The brand separates with a
  1px hairline of `--border-subtle` and nothing else: panels, table rows, KPI
  cells, the nav and the footer all carry one. There are no elevation levels
  and no decorative outlines — a line is drawn where two readings meet, not
  around anything that merely needs grouping; for that, spacing, alignment and
  typography come first. The marketing `SiteFrame` follows the same rule: its
  gutters and center axis are the page columns (sangría), not card chrome.
  Preserve visible focus indicators and boundaries needed for accessibility.
- **Treat space as part of the design.** Use a consistent spacing scale and
  deliberate padding, gaps, margins, and line heights. Keep related elements
  closer together than unrelated groups. Balance density and breathing room;
  avoid cramped controls, arbitrary gaps, and oversized empty areas. Check
  alignment, readable line lengths, and spacing at mobile and desktop widths,
  including when text wraps or expands.

## 1. Product foundation

- Product name: Embat Pulse
- One-sentence promise: cada mes, una empresa sabe cómo está su salud
  financiera, hacia dónde va en seis meses y qué producto financiero encaja
  con su situación, con cada cifra explicada.
- Primary audience: la dirección financiera de la empresa cliente de Embat
  (una sola empresa por pantalla, nunca la cartera); el equipo de producto de
  Embat que presenta y defiende el score.
- Key user needs: leer el PULSE del mes y su historia mes a mes; distinguir
  observado de previsto y saber cuánto del score descansa en datos; entender
  por qué se recomienda un producto, por cuánto y a qué precio; ver qué haría
  falta para mejorar; comprobar cómo se construye el score.
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
  forma idéntica en cabecera, tablas y gráficos, y los
  gráficos SVG propios, sin librería ni cromos.
- Density: compact en tablas y listas; balanced en cabeceras y textos.
- Shape language: mixed —radios suaves de HeroUI en controles, rectángulos
  netos en barras y celdas de datos.
- Site frame: cuatro columnas (`gutter | 1fr | 1fr | gutter`). El gutter es
  `clamp(1rem, 6vw, 4.5rem)` (`--site-gutter`). Líneas de `--separator` a todo
  el alto: interior de cada gutter y, en la landing, el eje central (oculto
  bajo `lg`). La landing son tres bandas `h-dvh` (hero / features / pie). La
  banda 1 (clara) parte el recuadro: título y trayectoria a la izquierda, 2×2
  de superficies a la derecha. El plus es una cruz de 1px de gutter a gutter
  (brazo horizontal a media banda; el vertical es el eje del marco). El 2×2
  sólo añade el corte interior vertical. El marco ya cierra el recuadro, no se
  dibuja una segunda caja. El hero llena la
  primera banda: dither Paper de destellos a la izquierda (`fit: contain`);
  `HeroAccess` a la derecha, sobre fondo plano. El pie llena la
  tercera: heatmap a la izquierda; grano dither detrás de Platform / Docs y
  legal a la derecha, con aire a eje y gutter.
- `/` es marketing. El producto empieza en `/radar`.

## 3. Foundations

### Color

Tokens de marca de Embat (brief y juego de tokens de 2026-09-19) en dos capas.
Los primitivos nombran el papel del color; los tokens de HeroUI v3
(`background`, `foreground`, `surface`, `muted`, `accent`, `border`,
`separator`, campos y segmentos) apuntan a ellos, de modo que todo lo ya
escrito sigue funcionando. El tema oscuro se activa con `prefers-color-scheme`
redefiniendo únicamente los primitivos en `globals.css`; lo derivado se
recalcula solo. En la landing el esquema no sigue al sistema: banda 0 (hero) y
2 (pie) fuerzan oscuro; la banda 1 (medio) fuerza claro. `data-band-theme` en
el scroller sólo tintea el chrome de página (`body`, líneas del `SiteFrame`)
para que interpolen con el paging; cada banda redefine los mismos primitivos
en `.landing-band-dark` / `.landing-band-light` para que el 2×2 no herede
navy a media transición.

| Token                    | Light     | Dark        | Tailwind                 | Uso                                     |
| ------------------------ | --------- | ----------- | ------------------------ | --------------------------------------- |
| `--surface-page`         | `#FFFFFF` | `#050B2C`   | `bg-page`                | Lienzo de la página                     |
| `--surface-deep`         | `#F7F8FA` | `#05081C`   | `bg-deep`                | Marco y fondos hundidos                 |
| `--surface-raised`       | `#FFFFFF` | `#111A46`   | `bg-raised`              | Paneles y tarjetas                      |
| `--surface-brand-subtle` | `#EFF4FF` | `#111A46`   | `bg-brand-subtle`        | Fila señalada y hover de tabla          |
| `--border-subtle`        | `#E4E7EE` | `#FFFFFF1F` | `border-hairline`        | El hairline de todo                     |
| `--border-strong`        | `#CFD4E0` | `#FFFFFF52` | `border-hairline-strong` | Contorno de control                     |
| `--text-primary`         | `#0D1130` | `#FFFFFF`   | `text-ink`               | Titulares, cifras y texto principal     |
| `--text-secondary`       | `#6E7488` | `#C3CADA`   | `text-ink-secondary`     | Notas, etiquetas de tabla y pie         |
| `--text-muted`           | `#9AA1B4` | `#8E9AB9`   | `text-ink-muted`         | Texto atenuado y placeholders           |
| `--brand-blue`           | `#3878F6` | `#3878F6`   | `bg-accent`              | La acción: un solo azul, sólo el botón  |
| `--text-link-accent`     | `#1F5FE0` | `#86AEF9`   | —                        | Azul mínimo legible sobre la superficie |
| `--brand-sky`            | `#8ED1FC` | `#8ED1FC`   | `text-sky`               | Acento sobre oscuro y previsión         |
| `--focus-ring`           | `#8ED1FC` | `#8ED1FC`   | `outline-focus`          | Anillo de foco, 2 px con 2 px de offset |
| `--feedback-success`     | `#12A150` | `#3DD68C`   | `text-feedback-success`  | Estado favorable                        |
| `--feedback-warning`     | `#B06F00` | `#F7B955`   | `text-feedback-warning`  | Aviso                                   |
| `--feedback-danger`      | `#C62A2F` | `#FF8A8E`   | `text-feedback-danger`   | Error y estado destructivo              |
| `--score-critical`       | `#C62A2F` | `#FF8A8E`   | `text-score-critical`    | Score < 35                              |
| `--score-fragile`        | `#B06F00` | `#F7B955`   | `text-score-fragile`     | Score 35-50                             |
| `--score-neutral`        | `#6E7488` | `#8E9AB9`   | `text-score-neutral`     | Score 50-65                             |
| `--score-solid`          | `#12A150` | `#3DD68C`   | `text-score-solid`       | Score > 65                              |

`--gradient-hero`
(`radial-gradient(120% 95% at 72% 8%, #16266B 0%, #0A1033 48%, #05081C 100%)`)
es el fondo de toda sección oscura, disponible como `.bg-gradient-hero`. Es el
único degradado del producto.

Contrast requirements: WCAG AA (4,5:1) para texto sobre `--surface-page` y
`--surface-raised`; 3:1 para bordes de control y elementos gráficos portadores
de información. El color nunca es el único portador de significado: el score
siempre se acompaña del número y de la banda en texto accesible, y las alertas
llevan etiqueta de severidad además de color.

### Typography

- **Una sola familia**: Inter (`next/font/google`, pesos 400/500/600), en
  `--font-inter`. `--font-sans` y `--font-display` resuelven los dos a Inter:
  no hay familia de display aparte. El stack de marca es
  «Aeonik → General Sans → Inter»; Inter es el corte del que disponemos y el
  que carga el prototipo.
- **Nunca bold**: los titulares van en 600 con tracking negativo; los botones,
  etiquetas y enlaces de navegación en 500; el texto corrido en 400. El 700 no
  aparece en ninguna pieza.
- Cuerpo: 15 px / 1,55, `font-variant-numeric: tabular-nums` y
  `text-wrap: pretty` en `body`. No hay monoespaciada: los importes y los
  identificadores (`COMP_0001`) usan Inter con cifras tabulares.
- Type scale (tamaño / interlineado / peso / tracking):

  | Estilo   | Valor                      | Uso                                        |
  | -------- | -------------------------- | ------------------------------------------ |
  | display  | 40 / 1,15 / 600 / −0,015em | `h1` de página (30 px en móvil)            |
  | metric   | 32 / 1,1 / 600 / −0,01em   | Cifra de la tira de KPI                    |
  | h3       | 20 / 1,35 / 600            | Título dentro de un panel                  |
  | body-lg  | 17 / 1,6 / 400             | Entradilla sobre fondo oscuro              |
  | body     | 15 / 1,55 / 400            | Texto corrido, tablas y menús              |
  | label    | 14 / 1,2 / 500             | Etiquetas y cabeceras de tabla             |
  | caption  | 13 / 1,45 / 400            | Notas, pies y matices                      |
  | overline | 13 / 1,2 / 600 / 0,06em    | MAYÚSCULAS: títulos de sección (`Section`) |
  | nav      | 16 / 1 / 500               | Pestañas de la barra y botones             |

- Marca: en producto, icono de pulso (`src/app/icon.svg`, 40 px) con el
  wordmark `PulseWordmark` (`ui/wordmark`, 14 px) a su derecha, y a
  continuación un hairline vertical y el claim «La inteligencia que impulsa tu
  tesorería» (oculto bajo `md`). En el hero de `/` no hay lockup a escala de
  columna: el `h1` es «Embat Pulse» y es `sr-only`. El enlace de la nav se
  llama «Embat Pulse, inicio».
- Line-height rules: 1,55 en texto corrido; 1,1-1,2 en titulares y cifras.
- Maximum readable line length: 70-75 caracteres (720 px).

### Spacing, shape, and elevation

- Base spacing unit: 4 px (`--spacing` de HeroUI).
- Spacing scale: 2, 3, 4, 5, 6, 8, 10 → gaps dentro de un grupo ≤ 4; entre
  grupos 6-8; entre secciones de página 10.
- Retícula: contenido 1240 px, inset lateral 32 px (16 en móvil), 96 px de
  padding inferior y 48 px entre secciones (`PageShell`).
- Border radii: 8 px en botones e inputs (`--radius`, el radio más visible de
  la marca); 12 px en tarjetas, paneles y la tira de KPI (`rounded-xl`); 16 px
  en bloques grandes y marcos de captura (`rounded-2xl`); píldora en estados;
  2 px en celdas de datos.
- Border treatment: hairline de 1 px de `--border-subtle` (`border-hairline`)
  en paneles, filas de tabla, celdas de KPI, nav y pie. `--border-strong` sólo
  contornea controles. En marketing, las líneas del `SiteFrame` (gutters, eje,
  cortes entre bandas) usan el mismo hairline. En datos, sólo se dibuja una
  línea cuando separa lecturas (guías 35/50/65, changepoint, eje cero).
- Shadow/elevation levels: ninguno. La separación es por línea, no por sombra;
  sólo los overlays de HeroUI (popover, modal) conservan la suya.
- Focus ring treatment: anillo de 2 px en `--focus-ring` (`#8ED1FC`) con 2 px
  de offset, nunca suprimido.

### Motion

- Motion principles: la interfaz de producto no anima datos. Sólo transiciones
  de estado de control (hover, foco, apertura de popover). Nexo, solicitado
  como mascota animada, es la excepción: respiración lenta, parpadeo y
  expresiones según el estado del chat; nunca altera ni anima las cifras.
  La landing pagina una banda por gesto con un tween `ease-in-out` cúbico; el
  snap nativo queda como respaldo antes de hidratar. Cada banda pinta su
  paleta; el chrome de página interpola con `data-band-theme`. Un pulso de 12 s
  recorre la línea derecha del
  `SiteFrame`. El subrayado de `HeroAccess` se oculta de izquierda a derecha y
  se vuelve a dibujar (500 ms). El dither del hero es estático; el Heatmap
  del pie recorre a 1,36; el dither de las listas del pie espera a la banda 2.
  El preview PULSE de la banda 1 dibuja la línea
  observada, revela la banda p10-p90 y el forecast, y pulsa el último cierre
  (loop 7,2 s). El dither, el heatmap y el gutter no usan score ni `accent`;
  los strokes del preview PULSE son el color honesto del último cierre.
- Duration scale: 120 ms para hover y color; 200 ms para overlays; 500 ms para
  el recorte del subrayado del hero; 900 ms para el cambio de banda en
  marketing; 7,2 s para el loop del preview PULSE; 12 s para el pulso del gutter.
- Easing curves: las de HeroUI (`ease-out` a la entrada, `ease-in` a la salida)
  en producto; `ease-in-out` cúbico en el paging de la landing, el pulso, el
  subrayado del hero y el loop del preview PULSE.
- Reduced-motion behavior: se respeta `prefers-reduced-motion`; el paging de la
  landing salta sin tween, el pulso del gutter no recorre, el subrayado del
  hero queda estático, el Heatmap del pie se congela (`speed={0}`), el dither
  de cada celda del 2×2 no anima uniforms (`speed={0}`), el dither del pie
  tampoco, el preview PULSE se
  queda en el fotograma final y Nexo deja de
  moverse. Las expresiones de Nexo siguen identificando el estado, acompañado
  siempre por texto accesible.

## 4. Component system

Use HeroUI v3 components first. Document any wrapper or new primitive before
adding it to the codebase.

| Component/pattern | HeroUI primitive                              | Approved variants               | Usage guidance                                                                                                     |
| ----------------- | --------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Button            | `Button`                                      | `secondary`, `tertiary`         | Sólo acciones de la propia vista (cambiar mes u horizonte).                                                        |
| Link              | `Link` / `next/link`                          | por defecto                     | `next/link` para navegación interna; `Link` de HeroUI cuando lleva icono.                                          |
| Card              | `Card`                                        | `secondary`                     | Una tarjeta por producto recomendado, que agrupa oferta, precio y motivos.                                         |
| Form field        | `ComboBox`, `Select` + `ListBox`              | por defecto                     | Selector de empresa en la nav; mes y horizonte en la empresa. Cada control lleva `aria-label`.                     |
| Feedback          | `Chip`                                        | `soft` con `color` semántico    | Familia de producto, tipo de razón y estado de un producto descartado.                                             |
| Data              | `Table` vía `DataTable`                       | por defecto                     | Toda tabla usa `DataTable`: cabeceras ordenables en ambos sentidos, «sin datos» siempre al final.                  |
| Panel             | `Panel` (`ui/panel`)                          | `padding` `default` / `none`    | Contenedor único: hairline, radio 12 e inset 24. `none` cuando el contenido pone su propio inset.                  |
| KPI               | `StatGrid` (`ui/stat-grid`)                   | 3, 4 o 5 columnas               | Tira de cifras de cabecera: un panel con hairline entre celdas, valor 32 y etiqueta debajo.                        |
| Estado del score  | `ScoreBadge` (`ui/score-badge`)               | `score` (def.), `pill`, `lg`    | `score` es punto + cifra en tinta; `pill` es la píldora con el nombre de la banda.                                 |
| Pie de producto   | `SiteFooter` (`layout/site-footer`)           | por defecto                     | Hairline superior, 13 px secundario; lo que mide Pulse a la izquierda y la firma a la derecha.                     |
| Asistente Nexo    | `Modal`, `Button`, `TextArea`                 | `primary`, `secondary`, `ghost` | Diálogo lateral de 440 px; hoja inferior en móvil. Solo en rutas de producto.                                      |
| Icono de marca    | SVG estático (`src/app/icon.svg`)             | paleta de Nexo                  | Nav de producto; el enlace lleva `aria-label="Embat Pulse, inicio"` y apunta a `/`.                                |
| Hero dither       | Paper `ImageDithering` (`PulseHeroDither`)    | destellos locales, `contain`    | Columna izquierda de `/`; webp propio; `preload` RSC; fade `data-ready`; `maxPixelCount` 480 000; no `next/image`. |
| Hero mark         | SVG propio (`PulseHeroMark`)                  | tokens de score + accent        | Geometría compartida; no se monta en `/`. El `h1` de la landing es «Embat Pulse» y es `sr-only`.                   |
| Site frame        | `SiteFrame`                                   | `split`, `pulse`                | Gutters y eje; `pulse` solo en `/`, sobre la línea derecha existente.                                              |
| Landing scroll    | `LandingScroll`                               | paging 900 ms                   | Un gesto, una banda; tween propio, no snap nativo.                                                                 |
| Landing footer    | `LandingFooter`                               | cuadrante derecho               | Platform / Docs y legal; grano dither detrás de las listas; heatmap a la izquierda en `lg+`.                       |
| Footer heatmap    | Paper `Heatmap` (`PulseFooterHeatmap`)        | rampa Embat                     | Columna izquierda, solo `lg+`; `aria-hidden`; `speed={0}` con reduced motion.                                      |
| Footer dither     | Paper `ImageDithering` (`PulseFooterDither`)  | recorte rotado detrás de listas | Mismo `/hero-dither.webp`; `scale` 2.4, origin 0.68/0.32, 28°; tinta `#afafbb` a 0.22 `screen`; no Heatmap.        |
| Hero access       | `HeroAccess`                                  | cuadrícula 2 columnas           | PULSE, Recomendaciones, Método (`HERO_SECTIONS`); subrayado animado.                                               |
| Landing showcase  | `LandingShowcase`                             | 2×2 + trayectoria               | Banda 1: plus gutter a gutter; 2×2 sin `gap`; PULSE anima `COMP_0001`; el resto usa el gráfico de producto.        |
| Feature dither    | Paper `ImageDithering` (`PulseFeatureDither`) | un campo detrás del 2×2         | Mismo `/hero-dither.webp`; tinta `#050b2c` a 0.32; hover/selected por tipo, no `--accent`; no Heatmap.             |
| Showcase PULSE    | SVG vendido (`PulseShowcaseAnimation`)        | loop 7,2 s                      | Inline; `COMP_0001`; Arrow 2 animate no disponible en el plan; motion CSS local; freeze con reduced-motion.        |

### Icono de marca

- Icono sin texto: pulso geométrico azul hielo sobre un cuadrado azul noche,
  con un acento azul al final. Identidad financiera sobria, sin rasgos de
  personaje. Paleta de Nexo: `#DCEEF9`, `#10264B` y `#78BCFF`.
- Excepción de identidad al color semántico, igual que la mascota. Paleta fija
  en claro y oscuro; el pulso no representa una medición ni una banda de score.
- `src/app/icon.svg` es el original vectorial compartido por favicon y header;
  `src/app/favicon.ico` contiene copias rasterizadas a 16, 32, 48 y 64 px.
- El header muestra el icono a 40 px y el wordmark a su derecha, separados
  por 8 px, en un enlace de 44 px de alto con nombre accesible «Embat Pulse, inicio» y foco visible. No añade animación.
- Corrección, 2026-09-19: «sin texto» se refiere al dibujo del icono; el
  header conserva el wordmark a su derecha. El favicon sigue siendo sólo icono.
- Decisión conservada, 2026-09-19: mantener el dibujo como recurso estático
  compartido separa identidad y navegación (responsabilidad única), evita
  duplicar geometría en React y mantiene legible el favicon pequeño.

### Nexo

- Personaje original de cerámica azul hielo, traje azul noche, camisa blanca y
  corbata azul. La ilustración es una excepción al color exclusivamente semántico:
  aporta identidad sin representar un score ni un estado financiero.
- Ilustración transparente y expresiones SVG independientes; estados de reposo,
  escucha, pensamiento, respuesta, saludo y error. Los componentes son
  decorativos; el chat comunica sus estados mediante texto.
- Acceso flotante en la esquina inferior derecha: sólo la mascota y un
  bocadillo «¿Necesitas ayuda? Escríbeme», sin fondo ni chip. En móvil la
  mascota se reduce a 64 px y el bocadillo desaparece para no tapar cifras. Panel con
  cabecera (mascota, nombre, estado en texto y página consultada), conversación
  y editor fijo. Radios de 24 px para el overlay, 12 px para sugerencias y 16 px
  para el editor. Sombra sólo en el overlay y en el bocadillo.
- Mensajes del usuario en burbuja `accent` alineada a la derecha; respuestas de
  Nexo a ancho completo sin avatar. La bienvenida usa un lavado radial de
  `accent` tras la mascota: es la única superficie decorativa del producto.
- Las sugerencias se agrupan en dos columnas; el cuerpo puede desplazarse en
  alturas pequeñas sin ocultar el cierre ni el editor. Áreas seguras en móvil.
- Escape cierra, el foco queda dentro del diálogo y vuelve al acceso al cerrar.
  Enter envía, Shift+Enter añade línea y Ctrl/Cmd+J abre o cierra.
- Se indica «DEMO» cuando las respuestas son simuladas. Nunca se sustituye un
  error del proveedor por una respuesta simulada. El historial se mantiene sólo
  en memoria durante la navegación, sin localStorage ni persistencia en servidor.
- Nexo no aparece en `/`: el layout de producto (`(app)`) es quien lo monta.

Component rules:

- Composition rule: los gráficos son componentes SVG propios en
  `src/components/charts`, sin librería externa; reciben datos ya calculados y
  no acceden a la fuente de datos.
- Loading and pending states: las páginas son Server Components que leen datos
  locales; no hay estados de carga que mostrar. Única excepción: el bloque
  «Qué hacer ahora» es un Client Component que lee su copia de `localStorage`
  o pide las acciones a `GET /api/actions/[id]`, y mientras tanto muestra el
  mismo bloque con «Leyendo las cifras de la empresa…». Esa copia sólo guarda
  respuestas del modelo y sólo vale para el cierre que enseña la página.
- Empty states: siempre texto que explica qué falta y qué aparecerá cuando
  llegue (feed de alertas, anticipación, historial de límite).
- Error states: una empresa desconocida devuelve 404 de Next.js; un backend
  caído degrada a lista vacía con su texto, nunca a excepción.
- Destructive actions: no existen en este producto.
- Responsive behavior: rejillas de una columna por debajo de `sm`; las tablas
  scrollan en horizontal dentro de su contenedor. El mapa de calor y el treemap
  del método se dibujan por columnas desde `md` y por filas (un pilar por fila,
  misma proporción de áreas) por debajo, sin scroll lateral. La navegación
  ocupa una fila en móvil: logotipo y botón de menú; el buscador y las
  secciones viven en el `Drawer` lateral con objetivos táctiles de 48 px; el
  buscador mantiene 16 px de fuente para que iOS no haga zoom al enfocarlo.

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
- Content examples: «82 de 100 puntos con datos»; «Línea de crédito de
  25.000 € a 12 meses, a un tipo del 9,17 % anual»; «previsión +6 m 31,1 ·
  banda p10-p90 15,6-48,4».

## 6. Layout and responsive behavior

- Container widths: `max-w-7xl` en páginas de producto; `max-w-3xl` en texto
  corrido. La landing usa el `SiteFrame` a viewport completo, no `max-w-7xl`.
- Breakpoints: los de Tailwind (`sm` 640, `lg` 1024).
- Navigation behavior by breakpoint: en `/` no hay `SiteNav`; el acceso es
  `HeroAccess`. En producto, barra superior fija con hairline inferior: marca
  (a `/`), el buscador de empresa y seis pestañas
  —PULSE, Diagnóstico, Detalle, Alertas, Financiación, Método—. Las pestañas
  son enlaces con aspecto de tab: 15/500, padding 11/12, radio 8, la actual en
  azul de enlace sobre `brand-subtle` y el resto en secundario sobre
  transparente; la actual es la sección que nombra `sectionFromPath`, así que
  una página de variable mantiene PULSE. El claim del mock no cabe junto al
  buscador en 1240 px y se queda en la landing; bajo `lg` la barra es una sola
  fila de marca y botón de menú (44 px, tres hairlines), y un `Drawer` de HeroUI
  desde la derecha (`min(360px, 88vw)`) contiene el buscador arriba y las seis
  secciones en columna con objetivos de 48 px y 17/500; la actual va en azul
  de enlace sobre `brand-subtle`; elegir sección o empresa cierra el menú
  porque cambia la ruta; Escape cierra y el foco vuelve al botón. En `lg` el
  hero es 50/50 y el pie ocupa el cuadrante derecho; por debajo de `lg`,
  dither, accesos y pie se apilan dentro de los gutters. El dither no cubre
  `HeroAccess`.
- Mobile-first exceptions: las tablas mes a mes y de variables mantienen su
  ancho mínimo y scrollan; los SVG escalan con `viewBox`. El bloque oscuro
  (`.bg-gradient-hero`) baja a 28/20 de padding bajo `md`.
- Table/data-density strategy: una empresa tiene como máximo 24 meses, así que
  las tablas se muestran completas; el mes y el horizonte se eligen en cliente
  sobre datos ya calculados en el servidor.

## 7. Decision log

Record meaningful deviations from HeroUI defaults or previously approved
patterns.

| Date       | Decision                                                                                                                                                                                       | Reason                                                                                                                         | Owner                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 2026-09-18 | Gráficos SVG propios en lugar de una librería de charting                                                                                                                                      | Formas muy específicas (changepoint, waterfall, curva de evento) y bundle mínimo                                               | Equipo Pulse                                             |
| 2026-09-18 | Tema oscuro por `prefers-color-scheme` redefiniendo tokens primitivos                                                                                                                          | HeroUI expone su paleta oscura tras `.dark`; sin conmutador no hay estado que guardar                                          | Equipo Pulse                                             |
| 2026-09-18 | Escala de color del score como único helper (`scoreBand`)                                                                                                                                      | Un mismo score debe tener el mismo color en tabla, gráfico, mapa de calor y oferta                                             | Equipo Pulse                                             |
| 2026-09-19 | Observado y previsión en un solo gráfico, con banda p10-p90 y marca del último cierre                                                                                                          | Comparar nivel y horizonte en la misma escala; la incertidumbre no puede quedar en otra figura                                 | Equipo Pulse                                             |
| 2026-09-19 | Variable sin datos como «sin datos» y nunca como cero, junto a la confianza en %                                                                                                               | Un cero es una medición; la ausencia de evidencia cambia la decisión y debe verse                                              | Equipo Pulse                                             |
| 2026-09-19 | Nexo como mascota con traje y chat global, con animación decorativa independiente                                                                                                              | Petición de producto; permite explicar datos y consultar IA sin rehacer las vistas existentes                                  | Equipo Pulse                                             |
| 2026-09-19 | Acceso a Nexo reducido a mascota y bocadillo; estado del chat sólo en texto de cabecera                                                                                                        | Menos elementos compitiendo con los datos; el personaje ya identifica la función                                               | Equipo Pulse                                             |
| 2026-09-19 | Aplicación de una sola empresa: sin radar ni cartera; X-Ray retirado del frontend                                                                                                              | El producto se lee desde la empresa; la comparación entre empresas no es una necesidad suya                                    | Equipo Pulse                                             |
| 2026-09-19 | Empresa en contexto en la URL (`/empresa/[id]`, `?empresa=` en Método), nunca en storage                                                                                                       | Vistas compartibles y deterministas; la navegación no depende del estado del navegador                                         | Equipo Pulse                                             |
| 2026-09-19 | Rutas en inglés (`/company/[id]`, `/recommendations`, `/method?company=`); selector HeroUI en la nav de producto                                                                               | Un solo idioma en los endpoints; la empresa se cambia desde cualquier página sin perder la sección                             | Equipo Pulse                                             |
| 2026-09-19 | Empresas y grupos con nombre famoso por hash determinista del identificador; el identificador sigue visible                                                                                    | Una demo legible sin inventar datos: el nombre es un disfraz estable, no una atribución                                        | Equipo Pulse                                             |
| 2026-09-19 | Mapa de calor de variables en la empresa: área = peso, color = banda del score, sin datos con trazo discontinuo                                                                                | Peso y estado se leen a la vez; «sin datos» nunca parece un score bajo                                                         | Equipo Pulse                                             |
| 2026-09-19 | Treemaps a ancho completo con el panel de detalle debajo, sin columna del export                                                                                                               | Sin scroll horizontal en escritorio; el nombre técnico de la columna no ayuda al lector                                        | Equipo Pulse                                             |
| 2026-09-19 | Oferta plegada en acordeón (por qué, importe, precio, palancas) bajo las cifras; entradilla sin score ni cobertura                                                                             | Las cifras se leen de un vistazo y la cabecera ya muestra PULSE y confianza; el argumento se abre a demanda                    | Equipo Pulse                                             |
| 2026-09-19 | PULSE es la media ponderada de las variables con datos, sin calibración a percentil; las bandas 35/50/65 no cambian                                                                            | El usuario quiere leer el score directamente en la escala de las variables; los aportes suman el score                         | Equipo Pulse                                             |
| 2026-09-19 | Botón info por variable en el mapa de calor y en el treemap del método: popover no modal que abre en hover y se fija al pulsar                                                                 | La misma explicación (qué mide, dirección, fuente) desde cualquier mapa, sin ir a la página Método; teclado y táctil incluidos | Equipo Pulse                                             |
| 2026-09-19 | Palancas como bloques por pilar con barra de bandas hoy→objetivo y dos cifras (prima, tensión); descartados en rejilla con chip de estado y barra de encaje; sin frases que repitan la palanca | La escala de color del score ya dice de qué banda a cuál se pasa; el texto narrado duplicaba los mismos números                | Equipo Pulse                                             |
| 2026-09-19 | Selector de empresa en la nav (`ComboBox`), no en la landing                                                                                                                                   | Elegir empresa no es comparar empresas: `/` es marketing y no un ranking                                                       | Equipo Pulse                                             |
| 2026-09-19 | Nexo recibe una sola empresa (PULSE + Advisor) y no cubre la landing                                                                                                                           | El asistente no puede saber más que la pantalla; evita respuestas de cartera                                                   | Equipo Pulse                                             |
| 2026-09-19 | Historial mes a mes en orden descendente y previsión en tabla aparte con «previsto» en cada fila                                                                                               | La decisión se toma sobre el último cierre; la distinción observado/previsto no puede depender del color                       | Equipo Pulse                                             |
| 2026-09-19 | Guías 35/50/65 como componente SVG compartido (`ScoreGuides`)                                                                                                                                  | Una sola definición de la escala de bandas para trayectoria y small multiples                                                  | Equipo Pulse                                             |
| 2026-09-19 | Cuatro small multiples de pilar en escala 0-100 común, con su peso al pie                                                                                                                      | Comparar qué pilar movió el score exige la misma escala y el peso a la vista                                                   | Equipo Pulse                                             |
| 2026-09-19 | Barras de aporte desde cero, coloreadas por el score de la variable, en vez de barras divergentes                                                                                              | Los aportes mensuales son todos positivos; divergir desperdiciaba la mitad del ancho                                           | Equipo Pulse                                             |
| 2026-09-19 | Selector de mes (por defecto el último cierre) como único estado de cliente de la página de empresa                                                                                            | Permite auditar cualquier mes sin duplicar tablas ni romper el renderizado en servidor                                         | Equipo Pulse                                             |
| 2026-09-19 | `Card` `secondary` para cada producto recomendado                                                                                                                                              | La oferta es el único objeto que agrupa cifras, argumento, precio y contrafactual y necesita contenedor visible                | Equipo Pulse                                             |
| 2026-09-19 | Precio como barra SVG apilada proporcional a                                                                                                                                                   | pb                                                                                                                             | con la leyenda en HTML; los descuentos se dibujan huecos | Texto dentro del SVG no se lee a 390 px; un descuento apunta en sentidos opuestos en coste y en rendimiento | Equipo Pulse |
| 2026-09-19 | Encaje en barra neutra 0-100 con el umbral 40 marcado, nunca con la paleta del score                                                                                                           | Encaje y PULSE conviven en la misma página y no deben confundirse                                                              | Equipo Pulse                                             |
| 2026-09-19 | Palancas ordenadas por ahorro de prima y la mayor señalada en peso tipográfico, no en color                                                                                                    | El color sólo codifica score; el ahorro es una prioridad de lectura                                                            | Equipo Pulse                                             |
| 2026-09-19 | Sin ERP el bloque de facturas dice «sin datos» y «Sin ERP conectado», nunca cuatro ceros                                                                                                       | Un cero del libro es una medición; la ausencia de ERP cambia qué productos son posibles                                        | Equipo Pulse                                             |
| 2026-09-19 | Sin oferta no hay sección vacía: el resumen abre y «Plan de mejora» ocupa su lugar antes de los descartados                                                                                    | La página responde primero «qué hacer ahora» y después «qué no»                                                                | Equipo Pulse                                             |
| 2026-09-19 | Reparto de los 100 puntos como treemap SVG: columna por pilar ∝ peso, celda por variable ∝ su parte                                                                                            | El área es el peso: la figura y la tabla de pesos dicen lo mismo y cada celda tiene sitio para su etiqueta                     | Equipo Pulse                                             |
| 2026-09-19 | Treemap interactivo con `role="group"` y celdas `role="button"` con `tabIndex`; detalle en `aria-live`                                                                                         | Un gráfico explorable con ratón y teclado no puede exponerse como una sola imagen                                              | Equipo Pulse                                             |
| 2026-09-19 | Celda seleccionada en `foreground` sobre texto `background`, no en `accent`                                                                                                                    | Blanco sobre `accent` no alcanza 4,5:1; la inversión garantiza AA en claro y oscuro                                            | Equipo Pulse                                             |
| 2026-09-19 | Barra de confianza: relleno con datos, rayado a 45° para proxy bancario, vacío sin datos                                                                                                       | Hace visible la regla de 0,5 × cobertura y que una variable sin datos no entra como cero                                       | Equipo Pulse                                             |
| 2026-09-19 | Barras de AUROC por variable con guía en 0,5 («sin señal») y escala 0-1 completa                                                                                                               | La distancia a 0,5 es la lectura honesta; la escala completa impide exagerar diferencias                                       | Equipo Pulse                                             |
| 2026-09-19 | Escala de bandas y barras de AUROC en HTML con anchos en %, treemap en SVG                                                                                                                     | Tipografía real donde manda el texto; SVG donde manda la geometría                                                             | Equipo Pulse                                             |

| 2026-09-19 | Todas las tablas sobre `DataTable`: columnas declaradas como datos, orden por cualquier cabecera y filas sin valor siempre al final | Una sola implementación de tabla; el lector elige el criterio y una ausencia de dato nunca se cuela como extremo | Equipo Pulse |

| 2026-09-19 | Método centrado en el cálculo del PULSE del mes, en palabras llanas; AUROC, tabla de precisión, pila de precio y catálogo retirados; previsión, precio y límites en tres frases | La página debe entenderse sin saber estadística; el detalle de validación vive en el backend y en su README | Equipo Pulse |

| 2026-09-19 | Pairing Aktiv Grotesk (display) + DM Sans (cuerpo); Geist fuera | Display neo-grotesk comercial junto a un cuerpo tabular | Equipo Pulse |
| 2026-09-19 | `/` es landing con `SiteFrame`; el producto vive en `/company` y `/method` | Marketing y producto no comparten nav; las líneas del frame son columnas, no cromo | Equipo Pulse |
| 2026-09-19 | Tokens de producto tomados de embat.io (azul `#3878f6`, tinta `#050b2c`) | Pulse debe integrarse con Embat; las bandas de score no se retintan | Equipo Pulse |
| 2026-09-19 | Pie de landing: Platform/Docs + legal; heatmap Paper a la izquierda | Solo rutas que existen; la marca de marketing es Pulse | Equipo Pulse |
| 2026-09-19 | Hero: accesos PULSE / Recomendaciones / Método con subrayado wipe izquierda→derecha | Las tres superficies de la app de empresa; la línea se esconde in situ | Equipo Pulse |
| 2026-09-19 | Juego de tokens de marca de Embat en lugar de la paleta anterior: primitivos (`--surface-*`, `--border-*`, `--text-*`, feedback) y los tokens de HeroUI apuntando a ellos | Una sola fuente de color para producto y marketing, con claro y oscuro definidos por el brief; lo ya escrito sigue funcionando sin reescribir clases | Equipo Pulse |
| 2026-09-19 | Bandas de score en los hex de estado de la marca (`#C62A2F`, `#B06F00`, `#6E7488`, `#12A150` y sus variantes oscuras) en vez de `oklch` propios | El score es un estado más de la marca; dos escalas de rojo y verde en la misma pantalla no se sostienen | Equipo Pulse |
| 2026-09-19 | Inter como única familia: `--font-sans` y `--font-display` resuelven a ella; Aktiv Grotesk y DM Sans retirados, 700 eliminado del producto | El brief pide una sola grotesca y peso medio; dos familias y un bold no aportaban jerarquía que no diera ya el tamaño | Equipo Pulse |
| 2026-09-19 | Títulos de sección como overline (13 px, mayúsculas, 600, 0,06em) en `Section` | El `h2` competía con las cifras del panel; en overline ordena sin pesar | Equipo Pulse |
| 2026-09-19 | `Panel` como único contenedor: hairline de 1 px, radio 12, inset 24, sin sombra | «Se separa con borde, no con sombra»: un solo contenedor evita que cada página invente el suyo | Equipo Pulse |
| 2026-09-19 | `StatGrid` como tira de KPI: un panel con hairlines entre celdas, no cifras sueltas separadas por espacio | Las cifras de cabecera son una sola lectura comparable; la línea vertical es la separación de la marca | Equipo Pulse |
| 2026-09-19 | Banda del score como píldora con punto de 8 px y nombre (`ScoreBadge variant="pill"`); la cifra se queda en tinta con el punto delante | El color no va solo y la cifra nunca se tiñe de azul ni de rojo: el punto y el texto portan la banda | Equipo Pulse |
| 2026-09-19 | Pie de producto (`SiteFooter`) con hairline superior: «Pulse · 11 variables en 4 pilares» y «By humans for humans.» | Cierra la página con lo que mide el score y quién lo firma, sin repetir la navegación | Equipo Pulse |
| 2026-09-19 | Destinos de la nav como pestañas (radio 8, la actual en azul de enlace sobre `brand-subtle`) sin dejar de ser enlaces con `aria-current`; «Recomendaciones» pasa a «Financiación» | La barra agrupa las vistas de una misma empresa y se leen como pestañas; el nombre dice qué se decide allí, no qué hace el sistema | Equipo Pulse |
| 2026-09-19 | La empresa se divide en tres páginas como el mock: Resumen (`/company/[id]`), Diagnóstico (`/diagnosis`) y Detalle (`/detail`); «Cómo se calcula» vive sólo en Método | Cada pestaña responde una pregunta y cabe en una pantalla; un solo scroll de nueve secciones no se leía | Equipo Pulse |
| 2026-09-19 | La página de variable elimina el párrafo «qué mide» repetido; el bloque pasa a ser «Ficha de la variable» | La entradilla ya es esa frase; copia que repite el título no añade nada | Equipo Pulse |
| 2026-09-19 | Método abre con la caja de fórmulas (`surface-deep`, hairline, radio 8) y la «Ficha del modelo»; después un panel por bloque explicativo | Reproduce el par «Cómo se calcula» del mock y pone la regla antes que sus ilustraciones | Equipo Pulse |
| 2026-09-19 | Los tipos de señal usan una píldora punto + etiqueta teñida con el color de feedback de la dirección; la alerta pierde el borde izquierdo de color | El brief reserva el color a bandas, series y estados, y prohíbe tarjetas con borde lateral de color | Equipo Pulse |
| 2026-09-19 | Las celdas del treemap de pesos son `surface-deep` con hairline de 1 px y radio 6 | Separar con línea, no con relleno: el mapa se lee como una rejilla de paneles igual que el resto del producto | Equipo Pulse |
| 2026-09-19 | Nexo enlaza la sección de productos como «Financiación», igual que la nav | Un solo nombre para la misma superficie en toda la aplicación | Equipo Pulse |
| 2026-09-19 | La página de financiación abre con el bloque navy «Qué hacer ahora»: la primera acción es el titular (h2) y las otras dos van en dos columnas bajo una línea | La pregunta es «¿y ahora qué?»; una sola acción grande obliga a priorizar y nada más de la página compite con ella | Equipo Pulse |
| 2026-09-19 | Las acciones las redacta el mismo modelo de Nexo (máximo tres, con cifra y enlace validado) y, sin clave o si falla, un generador determinista con las mismas cifras | Recomendaciones específicas y accionables sin inventar datos; la página siempre responde aunque el modelo no | Equipo Pulse |
| 2026-09-19 | `AdvisorHeader`, «Plan de mejora», «Riesgo» y «Datos usados» salen de la primera pantalla y bajan a un acordeón «Más detalle», plegado | Eran cifras que no responden «y qué»; siguen en el documento y son auditables | Equipo Pulse |
| 2026-09-19 | Cada oferta pasa de tarjeta a una fila (nombre + familia + qué es, importe/plazo, tipo/diferencial, encaje) con el argumento plegado en «Ver detalle» | Tres ofertas caben en una pantalla y se comparan de un vistazo; el argumento se lee sólo cuando se pide | Equipo Pulse |
| 2026-09-19 | El modo `mock` se marca con una etiqueta `DEMO` junto al overline, como hace Nexo, y no en la nota | Una sola señal reutilizable; la frase gastaba una línea del bloque en algo que no es una acción | Equipo Pulse |
| 2026-09-19 | El treemap del mapa de calor se sustituye por un mosaico por pilar: ancho de columna = peso del pilar, alto de celda = 13 px por punto de peso, color sólo en el punto de 8 px | El área como peso no se leía con 11 celdas; el alto conserva el orden y la superficie queda lisa, así la banda se gasta una vez por celda | Equipo Pulse |
| 2026-09-19 | Elegir una variable abre una tira de detalle bajo el mosaico en vez de navegar; la página de la variable queda a un «Ver la variable →» | El lector compara varias variables de un mes antes de profundizar en una; navegar en cada clic hacía perder el mapa | Equipo Pulse |
| 2026-09-19 | La trayectoria ajusta el dominio vertical a los datos, conteniendo siempre 35 y 65, en lugar de la escala fija 0-100 | Una empresa entre 38 y 48 era una línea plana en 0-100; las guías de banda siguen en pantalla y el zoom no engaña | Equipo Pulse |
| 2026-09-19 | Bajo `lg` la barra pasa de dos filas (buscador + pestañas con scroll lateral) a una fila con botón de menú y `Drawer` lateral con buscador y secciones en columna | Seis pestañas desplazándose bajo el buscador se leían como ruido y ocultaban las últimas; una fila limpia y un menú con objetivos de 48 px es el patrón que el lector espera en el móvil | Equipo Pulse |
| 2026-09-19 | La cabecera de empresa cambia «Tensión a 6 meses» por «Salud de los clientes»: media de la salud de pago de sus clientes (1 − parte de facturas tarde en 6 m) ponderada por facturación, sobre 100, con la banda y el número de clientes debajo | La tensión ya la cobra el precio y la nombran las acciones; qué tal pagan los clientes es lo que un director financiero pregunta al abrir la empresa, y el dataset no tiene un PULSE por cliente porque los clientes no son empresas del panel | Equipo Pulse |
| 2026-09-19 | Las celdas del mosaico y las cards de pilar de Diagnóstico llevan el lavado de su banda (`bandSurfaceStyle`: borde al 30 % y fondo al 8 % del color de la banda, mezclados con los tokens neutros, como la alerta de señal); las celdas sin datos siguen grises | La gravedad debe leerse de un vistazo en toda la página, no sólo en un punto de 8 px; la misma mezcla en alerta, celdas y cards hace que «color» signifique siempre «gravedad» | Equipo Pulse |
| 2026-09-19 | `PulseCompanyLinks` desaparece de la página de empresa; cada ruta se enlaza junto a la cifra que la motiva (acciones, alerta, detalle del mosaico, ficha del modelo) | El mock no tiene aside y un enlace suelto no dice por qué ir | Equipo Pulse |
| 2026-09-19 | Hero: `ImageDithering` de destellos (no wordmark) a la izquierda; sin SVG PULSE a escala de columna | El pie ya posee la silueta Pulse; el hero no es otro lockup ni un PNG fijo | Equipo Pulse |
| 2026-09-19 | 2×2 de features con `gap-px`; el marco es el recuadro, no una Card | Un solo plus de 1px de borde a borde; no se apilan reglas sobre el eje | Equipo Pulse |
| 2026-09-19 | Plus de la banda 1 de gutter a gutter; el eje del marco queda por encima del contenido | Las celdas opacas tapaban la cruz; el corte horizontal debe verse también a la izquierda | Equipo Pulse |
| 2026-09-19 | Un solo gráfico PULSE como placeholder; el clic cambia título y `aria-pressed` | Layout primero; previews distintas por celda en un paso posterior | Equipo Pulse |
| 2026-09-19 | Preview PULSE animado con la trayectoria de `COMP_0001`; Arrow 2 animate bloqueado por plan, motion CSS local | La celda PULSE deja de ser el gráfico de producto; el resto espera su preview | Equipo Pulse |
| 2026-09-19 | Dither por cuadrante: siluetas locales, ImageDithering Paper en cada celda | El webp del hero es un 2×2; cada destello vive detrás de su superficie, sin Heatmap ni SDK en Next | Equipo Pulse |
| 2026-09-19 | Feature dither: `cover` a la celda; hover CSS `--accent` multiply y transform por id | `contain` letterboxeaba respecto al plus; Paper no interpola `colorFront` | Equipo Pulse |
| 2026-09-19 | Feature dither: el 2×2 recorta el webp del hero (origin + `scale` 2), no SVG propios | El destello del hero ya es un 2×2; cada celda muestra su cuadrante | Equipo Pulse |
| 2026-09-19 | Un dither detrás del 2×2; cruz en overlays 1px; hover accent en la celda | Cuatro canvases partían el destello en la cruz; el campo debe continuar | Equipo Pulse |
| 2026-09-19 | Feature dither: tinta `#050b2c` a opacidad 0.32 en la banda clara | `#6e707c` a 0.18 desaparecía sobre `#fbfbfc`; Paper no lee tokens | Equipo Pulse |
| 2026-09-19 | Paleta local por banda (`.landing-band-light` / `dark`); `data-band-theme` sólo tintea el chrome | El 2×2 heredaba `--background` navy al paginar y destellaba azul a media transición | Equipo Pulse |
| 2026-09-19 | 2×2: hover y selected por tipografía y velo de tinta 4%; sin `--accent` multiply | El pressed compartía el hover y PULSE parecía siempre azul; el color no decora | Equipo Pulse |
| 2026-09-19 | Dither del pie detrás de Platform/Docs: tinta oscura `#afafbb` a 0.22 con `screen` | El 2×2 `#050b2c` desaparecería sobre navy; el heatmap se queda a la izquierda | Equipo Pulse |
| 2026-09-19 | Dither del pie: recorte `scale` 2.4, origin 0.68/0.32, rotación 28° | El campo entero se leía como el 2×2 con la tinta invertida | Equipo Pulse |
| 2026-09-19 | Hero dither: `preload` RSC del webp + fade al decode; `maxPixelCount` 480 000 | Paper no consume `next/image`; el destello no debe depender de que el archivo llegue tarde | Equipo Pulse |

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
