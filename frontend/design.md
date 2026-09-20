# Design system

This document is the single source of truth for the product's visual language,
interaction model, and component decisions. It complements HeroUI; it does not
replace HeroUI's accessible primitives.

## Mandatory design rules

These rules apply to every product task. Keep them when updating this document.

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

- Product name: Embat Pulse.
- One-sentence promise: cada mes, una empresa sabe cómo está su salud
  financiera, hacia dónde va en seis meses y qué producto financiero encaja con
  su situación, con cada cifra explicada.
- Primary audience: la dirección financiera de la empresa cliente de Embat (una
  empresa por pantalla, nunca la cartera) y el equipo de producto que presenta y
  defiende el score.
- Key user needs: leer el PULSE del mes y su historia; distinguir observado de
  previsto y cuánto del score descansa en datos; saber qué hacer primero y qué
  producto encaja, por cuánto y a qué precio; comprobar cómo se calcula.
- Brand personality: financiero y sobrio. Muestra el número y su procedencia; no
  persuade, informa.
- Words and patterns to avoid: «revolucionario», «IA», «potenciado por», iconos
  decorativos, tarjetas con borde que sólo envuelven una cifra, títulos que
  repiten el nombre de la sección, porcentajes sin base ni horizonte.

## 2. Visual direction

- Design principles, in priority order: (1) el dato manda —cada cifra lleva su
  unidad, su base y su horizonte—; (2) el color sólo codifica score, dirección o
  severidad, nunca decora; (3) jerarquía por espacio y tipografía antes que por
  líneas; (4) densidad alta pero legible: es una herramienta de trabajo.
- Reference products: terminales de riesgo bancario y paneles de tesorería;
  tablas densas con tipografía tabular.
- What makes this product recognisable: la escala de color del score aplicada
  igual en cabecera, tablas y gráficos, y los gráficos SVG propios.
- Density: compact en tablas y listas; balanced en cabeceras y textos.
- Shape language: mixed —radios suaves de HeroUI en controles, rectángulos netos
  en barras y celdas de datos.
- Site frame: cuatro columnas (`gutter | 1fr | 1fr | gutter`) con el gutter en
  `clamp(1rem, 6vw, 4.5rem)` (`--site-gutter`) y líneas de `--separator` a todo
  el alto en el interior de cada gutter y, en la landing, en el eje central
  (oculto bajo `lg`). El marco ya cierra el recuadro: no se dibuja una segunda
  caja.
- La landing son tres bandas `h-dvh`. **Hero**: `LandingBar` (marca, alto y
  claim de la nav de producto), dither de destellos a la izquierda y
  `HeroAccess` a la derecha. **Producto** (clara): a la izquierda overline
  «Producto», título y la trayectoria por nivel de score, con la columna partida
  a media banda; a la derecha un 2×2 de cuatro páginas del producto con el eje
  del marco y una regla de 1px por fila. **Pie**: heatmap a la izquierda, y a la
  derecha grano dither tras Producto / Documentación con la firma del pie de
  producto y el © sobre un hairline.
- `/` es marketing. El producto empieza en `/company/[id]`.

## 3. Foundations

### Color

Tokens de marca de Embat en dos capas: los primitivos nombran el papel del color
y los tokens de HeroUI v3 (`background`, `foreground`, `surface`, `muted`,
`accent`, `border`, `separator`, campos y segmentos) apuntan a ellos, así que
todo lo ya escrito sigue funcionando. El producto es sólo claro: `:root` fija
`color-scheme: light` y la preferencia del sistema no cambia nada (la columna
Dark de la tabla queda como referencia de los valores que usan las superficies
navy). En la landing, hero y pie son oscuros y la banda de producto clara por
diseño, cada una redefiniendo los mismos primitivos en `.landing-band-dark` /
`.landing-band-light`; `data-band-theme` sólo tintea el chrome de página
(`body`, líneas del `SiteFrame`) para que interpole al paginar.

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
es el fondo de toda sección oscura, disponible como `.bg-gradient-hero`, y el
único degradado del producto.

Contraste WCAG AA (4,5:1) para texto sobre `--surface-page` y `--surface-raised`
y 3:1 para bordes de control y elementos gráficos con información. El color
nunca es el único portador de significado: el score va siempre con su número y
el nombre de la banda en texto, y las alertas llevan etiqueta de severidad.

### Typography

- **Una sola familia**: Haffer SQ XH (`next/font/local`, `src/fonts/`, cortes 400
  y 500 tal como los sirve embat.io) en `--font-haffer`; `--font-sans` y
  `--font-display` resuelven las dos a ella. Los woff2 llevan `comma` y `period`
  fuera de la función `tnum` (editado con fontTools) porque con `tabular-nums` en
  `body` «45,6» se leía «45 , 6».
- **Nunca bold**: titulares en 600 con tracking negativo; botones, etiquetas y
  navegación en 500; texto corrido en 400. El 600 apunta al archivo de 500 en
  `fonts.ts` para que el navegador nunca sintetice una negrita; el 700 no aparece
  en ninguna pieza.
- Cuerpo: 15 px / 1,55, con `font-variant-numeric: tabular-nums` y
  `text-wrap: pretty` en `body`. No hay monoespaciada: los importes usan Haffer
  con cifras tabulares. Interlineado 1,55 en texto corrido y 1,1-1,2 en titulares
  y cifras; línea legible de 70-75 caracteres (720 px).
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

- Marca: sólo el wordmark `PulseWordmark` (`ui/wordmark`, 24 px de alto, sin
  icono) y, a continuación, un hairline vertical y el claim «La inteligencia que impulsa tu salud financiera»
  (`PRODUCT_TAGLINE` en `lib/brand`; oculto bajo `lg` en la nav y bajo `sm` en la
  landing). El enlace, de 44 px de alto y con foco visible, se llama «Embat
  Pulse, inicio» y apunta a `/`. En el hero de `/` no hay lockup a escala de
  columna: el `h1` es «Embat Pulse» y es `sr-only`.

### Spacing, shape, and elevation

- Base de 4 px (`--spacing` de HeroUI). Escala 2, 3, 4, 5, 6, 8, 10 → gaps dentro
  de un grupo ≤ 4; entre grupos 6-8; entre secciones de página 10.
- Retícula: contenido 1240 px, inset lateral 32 px (16 en móvil), 96 px de padding
  inferior y 48 px entre secciones (`PageShell`).
- Radios: 8 px en botones e inputs (`--radius`, el radio más visible de la marca);
  12 px en paneles y la tira de KPI; 16 px en bloques grandes; píldora en estados;
  2 px en celdas de datos.
- Bordes: hairline de 1 px de `--border-subtle` (`border-hairline`) en paneles,
  filas de tabla, celdas de KPI, nav y pie; `--border-strong` sólo contornea
  controles; el `SiteFrame` de marketing usa el mismo hairline. En datos sólo se
  dibuja una línea cuando separa lecturas (guías 35/50/65, changepoint, eje cero).
- Elevación: ninguna; sólo los overlays de HeroUI (popover, modal) conservan su
  sombra. Foco: anillo de 2 px en `--focus-ring` con 2 px de offset, nunca
  suprimido.

### Motion

- El producto no anima datos: sólo transiciones de estado de control (hover, foco,
  apertura de popover) y el ancho de la columna del pilar seleccionado en el
  mosaico. Nexo es la excepción: respiración, parpadeo y expresiones según el
  estado del chat, nunca sobre las cifras.
- La landing pagina una banda por gesto con un tween `ease-in-out` cúbico (el snap
  nativo es el respaldo antes de hidratar); cada banda pinta su paleta y el chrome
  interpola con `data-band-theme`. Un pulso recorre la línea derecha del
  `SiteFrame`; el subrayado de `HeroAccess` se oculta de izquierda a derecha y se
  vuelve a dibujar; el preview PULSE dibuja la línea observada, revela la banda
  p10-p90 y el forecast y pulsa el último cierre; el dither del hero es estático y
  el Heatmap del pie recorre a 1,36.
- Duraciones: 120 ms hover y color; 200 ms overlays y ancho de columna; 500 ms
  subrayado del hero; 900 ms cambio de banda; 7,2 s loop del preview PULSE; 12 s
  pulso del gutter. Easing: las de HeroUI en producto (`ease-out` a la entrada,
  `ease-in` a la salida) y `ease-in-out` cúbico en el paging, el pulso, el
  subrayado y el loop.
- Los dithers no animan uniforms (`speed={0}`). Con `prefers-reduced-motion` el
  paging salta sin tween, el pulso del gutter no recorre, el subrayado queda
  estático, el Heatmap se congela, el preview PULSE se queda en su fotograma
  final, el mosaico no anima el ancho y Nexo deja de moverse; sus expresiones
  siguen acompañadas de texto accesible.
- El dither, el heatmap y el gutter no usan score ni `accent`; los strokes del
  preview PULSE son el color honesto del cierre que dibujan.

## 4. Component system

Use HeroUI v3 components first. Document any wrapper or new primitive before
adding it to the codebase.

| Component/pattern | HeroUI primitive                          | Approved variants                 | Usage guidance                                                                                                    |
| ----------------- | ----------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Button            | `Button`                                  | `secondary`, `tertiary`           | Sólo acciones de la propia vista (cambiar mes u horizonte).                                                       |
| Link              | `Link` / `next/link`                      | por defecto                       | `next/link` para navegación interna; `Link` de HeroUI cuando lleva icono.                                         |
| Form field        | `ComboBox`, `Select` + `ListBox`          | por defecto                       | Buscador de empresa en la nav; mes y horizonte en la empresa. Cada control lleva `aria-label`.                    |
| Feedback          | `Chip`                                    | `soft` con `color` semántico      | Familia de producto, tipo de señal y estado de un producto descartado.                                            |
| Plegado           | `Disclosure`, `Accordion`                 | por defecto                       | «Ver detalle» de una oferta y el acordeón «Más detalle» de Financiación.                                          |
| Data              | `Table` vía `DataTable`                   | por defecto                       | Toda tabla usa `DataTable`: cabeceras ordenables, `headerTip` y «sin datos» siempre al final.                     |
| Panel             | `Panel` (`ui/panel`)                      | `padding` `default` / `none`      | Contenedor único: hairline, radio 12 e inset 24. `none` cuando el contenido pone su propio inset.                 |
| KPI               | `StatGrid` (`ui/stat-grid`)               | 3, 4 o 5 columnas                 | Tira de cabecera con hairline entre celdas, valor 32 y etiqueta debajo; `tip` con la definición llana.            |
| Hechos            | `FactGrid` (`pulse/fact-grid`)            | `2` o `auto` columnas             | Tira de filetes dentro de un panel (explorador de mes, plan de variable), cifra 24.                               |
| Estado del score  | `ScoreBadge` (`ui/score-badge`)           | `score` (def.), `pill`, `lg`      | `score` es punto + cifra en tinta; `pill` es la píldora con el nombre de la banda.                                |
| Nota de info      | `InfoTip` (`ui/info-tip`)                 | icono 20 px                       | Junto a una cifra o cabecera: abre en hover y se fija al pulsar; sustituye a cualquier `title`.                   |
| Pie de producto   | `SiteFooter` (`layout/site-footer`)       | por defecto                       | Hairline superior, 13 px secundario; sólo la firma, centrada.                                                     |
| Asistente Nexo    | `Modal`, `Button`, `TextArea`             | `primary`, `secondary`, `ghost`   | Diálogo lateral de 440 px; hoja inferior en móvil. Sólo en rutas de producto.                                     |
| Menú móvil        | `Drawer` (`layout/mobile-nav`)            | `min(360px, 88vw)`                | Bajo `lg`: buscador arriba y las siete secciones en columna, con objetivos de 48 px.                              |
| Marca             | `PulseWordmark` + `src/app/icon.svg`      | wordmark sobre navy               | Nav y landing muestran sólo el wordmark; el favicon es el wordmark blanco sobre un cuadrado navy.                 |
| Site frame        | `SiteFrame`                               | `split`, `pulse`                  | Gutters y eje; `pulse` sólo en `/`, sobre la línea derecha existente.                                             |
| Landing scroll    | `LandingScroll`                           | paging 900 ms                     | Un gesto, una banda; tween propio, no snap nativo.                                                                |
| Landing bar       | `LandingBar`                              | sobre el hero                     | Marca, alto y claim de la nav de producto, con hairline; sólo en la banda del hero.                               |
| Carga de página   | `PageSkeleton` (`layout/page-skeleton`)   | `loading.tsx` de empresa y método | Esqueleto con el ritmo de `PageShell` (título, lead, tira de KPI, un panel), pulso sólo con `motion-safe`.        |
| Hero access       | `HeroAccess`                              | cuadrícula 2 columnas             | Todas las páginas de la empresa demo (`HERO_SECTIONS`); subrayado animado.                                        |
| Landing showcase  | `LandingShowcase`                         | 2×2 + trayectoria                 | Cuatro páginas, una por celda; cada celda es un `next/link` y previsualiza título y lead en hover o foco.         |
| Landing footer    | `LandingFooter`                           | cuadrante derecho                 | Producto / Documentación desde `companySections`; firma y © sobre hairline; heatmap en `lg+`.                     |
| Canvases de Paper | `ImageDithering`, `Heatmap`               | hero, 2×2, pie                    | Un canvas por superficie, `aria-hidden`, sin `next/image` ni tokens: uniforms en `lib/landing`.                   |
| Trayectoria demo  | `PulseBandShowcase`, `…ShowcaseAnimation` | 4 niveles + loop 7,2 s            | Tira de niveles en su color; hover, foco o pulsación cambia a la trayectoria de esa banda; se congela sin motion. |
| Marca del hero    | `PulseHeroMark`                           | tokens de score + accent          | Geometría compartida del pulso; hoy no se monta en ninguna página.                                                |
| Cifra de cabecera | `PulseHeadlineTotal` (`pulse/…`)          | 52 px (40 en móvil)               | Cifra que contesta al `h1` en Acción, con la leyenda de qué cuenta a su derecha.                                  |
| Tabla de Acción   | `PulseGapTable` (`pulse/gap-table`)       | 4 columnas, apretadas bajo `md`   | Los tres pasos: variable con su valor real y barra de puntos, puntos y enlace al plan.                            |
| Plan de variable  | `PulsePlanPanel` (`pulse/plan-panel`)     | 5 cifras + 3 pasos                | Un solo panel: `FactGrid`, el por qué con las cifras del mes, «Qué hacer» y las dos salidas.                      |
| Celda del mosaico | `MosaicCell` (`pulse/mosaic-cell`)        | lavado de banda 12 % / 22 %       | Alto = 13 px por punto de peso; el detalle se abre dentro de la celda con «Ver la variable →».                    |
| Fila de oferta    | `OfferRow` (`advisor/offer-row`)          | 5 columnas                        | Nombre, importe, tipo, encaje y CTA; la razón se pliega en «Ver detalle».                                         |

### Marca

- La marca del producto es el wordmark PULSE (`public/pulse-wordmark.svg`, como
  máscara sobre `foreground` en `PulseWordmark`): sin icono ni dibujo aparte, ni
  en la nav ni en la landing. El enlace de 44 px que lo envuelve se llama «Embat
  Pulse, inicio» y apunta a `/`.
- El favicon es ese mismo wordmark en blanco sobre un cuadrado navy `#050B2C` de
  radio 12 (`src/app/icon.svg`, 64 × 64); `src/app/favicon.ico` lleva copias
  rasterizadas a 16, 32, 48 y 64 px generadas de ese SVG. Nada del producto
  usa ya el icono de pulso de Nexo como marca.

### Nexo

- Personaje original de cerámica azul hielo con traje azul noche: la ilustración
  aporta identidad sin representar un score ni un estado financiero. Sus
  expresiones SVG (reposo, escucha, pensamiento, respuesta, saludo, error) son
  decorativas; el chat comunica sus estados en texto.
- Acceso flotante abajo a la derecha: sólo la mascota y un bocadillo «¿Necesitas
  ayuda? Escríbeme», sin fondo ni chip; en móvil la mascota baja a 64 px y el
  bocadillo desaparece para no tapar cifras. El panel lleva cabecera (mascota,
  nombre, estado en texto y página consultada), conversación y editor fijo; radios
  de 24 px en el overlay, 12 en las sugerencias y 16 en el editor; sombra sólo en
  el overlay y el bocadillo.
- Mensajes del usuario en burbuja `accent` a la derecha y respuestas a ancho
  completo sin avatar. La bienvenida usa un lavado radial de `accent` tras la
  mascota: es la única superficie decorativa del producto.
- Escape cierra, el foco queda dentro del diálogo y vuelve al acceso; Enter envía,
  Shift+Enter añade línea y Ctrl/Cmd+J abre o cierra. Áreas seguras en móvil y
  cuerpo desplazable sin ocultar el cierre ni el editor.
- Se indica «DEMO» cuando las respuestas son simuladas y nunca se sustituye un
  error del proveedor por una respuesta simulada. El historial vive sólo en
  memoria, sin localStorage ni persistencia en servidor.
- Nexo no aparece en `/`: lo monta el layout de producto (`(app)`).
- Nexo lee y dibuja: las respuestas pueden llevar una línea de estado por cada
  lectura y figuras (`ChartFrame`) con overline empresa · mes, título, el SVG del
  producto y «Abrir en la aplicación», entre hairlines y sin fondo ni sombra. Las
  listas de barras apilan etiqueta y cifra sobre la barra a ancho completo
  (`BarRow`) y las series de la comparación se distinguen por tinta y trazo, con
  leyenda y cifra final, nunca por un cuarto tono.

### Component rules

- Los gráficos son componentes SVG propios en `src/components/charts`, sin librería
  externa; reciben datos ya calculados y no acceden a la fuente de datos.
- Las páginas son Server Components que leen datos locales, así que no hay estados
  de carga. Única excepción: «Qué hacer ahora» es un Client Component que lee su
  copia de `localStorage` o pide las acciones a `GET /api/actions/[id]` y mientras
  tanto muestra el mismo bloque con «Leyendo las cifras de la empresa…»; esa copia
  sólo guarda respuestas del modelo y sólo vale para el cierre que enseña la
  página.
- Empty states: siempre texto que explica qué falta y qué aparecerá cuando llegue.
- Error states: una empresa desconocida devuelve 404 de Next.js; un backend caído
  degrada a lista vacía con su texto, nunca a excepción.
- No hay acciones destructivas en este producto.
- Responsive: rejillas de una columna por debajo de `sm` y tablas que scrollan en
  horizontal dentro de su contenedor. El mosaico y el treemap del método se
  dibujan por columnas desde `md` y por filas por debajo, sin scroll lateral.

## 5. Accessibility and content

- Todo control es alcanzable con Tab y opera con Enter/Espacio; los filtros son
  enlaces, así que funcionan sin JavaScript.
- Un solo `h1` por página, `section` con `h2`, listas de definición para cifras,
  `role="img"` con `aria-label` en cada SVG y `aria-live="polite"` en el recuento
  de resultados.
- Contraste mínimo: WCAG AA.
- Interfaz en español y números con `Intl` en `es-ES`; los rótulos vienen del
  dataset, así que el diseño no asume longitudes fijas.
- Voz afirmativa y concreta: se nombra la magnitud, la unidad y el horizonte.
  Ejemplos: «82 de 100 puntos con datos»; «Línea de crédito de 25.000 € a 12
  meses, a un tipo del 9,17 % anual»; «previsión +6 m 31,1 · banda p10-p90
  15,6-48,4».

## 6. Layout and responsive behavior

- Ancho de contenido: 1240 px en páginas de producto (`PageShell`) y `max-w-3xl`
  en texto corrido. La landing usa el `SiteFrame` a viewport completo.
- Breakpoints: los de Tailwind (`sm` 640, `md` 768, `lg` 1024).
- En `/` no hay `SiteNav`: el acceso es `HeroAccess`. En `lg` el hero es 50/50 y el
  pie ocupa el cuadrante derecho; por debajo, dither, accesos y pie se apilan
  dentro de los gutters y el dither no cubre `HeroAccess`.
- En producto la cabecera es estática, no fija, y desde `lg` tiene dos filas: la
  primera (92 px) con la marca, un hairline vertical y el claim a la izquierda y el
  buscador de empresa (256 px) a la derecha; la segunda con las siete pestañas
  —PULSE, Diagnóstico, Acción, Detalle, Alertas, Financiación, Método— como texto
  16/500 a 28 px de separación sobre un hairline, la actual en tinta con una regla
  de 2 px en `--brand-blue` apoyada en ese hairline y el resto en secundario. La
  actual es la sección que nombra `sectionFromPath`, así que una página de variable
  mantiene PULSE.
- Bajo `lg` la barra es una sola fila con la marca y un botón de menú de 44 px, y un
  `Drawer` de HeroUI desde la derecha (`min(360px, 88vw)`) con el buscador arriba y
  las siete secciones en columna (objetivos de 48 px, 17/500, la actual en azul de
  enlace sobre `brand-subtle`). Elegir sección o empresa cierra el menú porque
  cambia la ruta; Escape cierra y el foco vuelve al botón. El buscador mantiene
  16 px de fuente para que iOS no haga zoom al enfocarlo.
- Excepciones móviles: las tablas mes a mes y de variables mantienen su ancho mínimo
  y scrollan; los SVG escalan con `viewBox`; el bloque oscuro (`.bg-gradient-hero`)
  baja a 28/20 de padding bajo `md`.
- Densidad de datos: una empresa tiene como máximo 24 meses, así que las tablas se
  muestran completas; el mes y el horizonte se eligen en cliente sobre datos ya
  calculados en el servidor.

## 7. Decision log

Desviaciones vigentes respecto a los valores por defecto de HeroUI o a un patrón
aprobado antes. Todas son del Equipo Pulse; cuando una fila revisa una decisión
anterior, la fecha lo dice.

| Date                      | Decision                                                                                                                                                                                                                                                                                                                                                                                               | Reason                                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-18                | Gráficos SVG propios en `src/components/charts` en lugar de una librería de charting                                                                                                                                                                                                                                                                                                                   | Formas muy específicas (changepoint, waterfall, curva de evento) y bundle mínimo                                                                                                                                                                        |
| 2026-09-20 (revisa 09-19) | Sólo modo claro: se retira el bloque `prefers-color-scheme: dark` de `globals.css`; cada banda de la landing sigue redefiniendo los primitivos en `.landing-band-dark` / `-light` y `data-band-theme` sólo tintea el chrome                                                                                                                                                                            | Petición del equipo para no mantener dos temas; el 2×2 heredaba navy a media transición                                                                                                                                                                 |
| 2026-09-18                | Escala de color del score como único helper (`scoreBand`)                                                                                                                                                                                                                                                                                                                                              | Un mismo score debe tener el mismo color en tabla, gráfico, mosaico y oferta                                                                                                                                                                            |
| 2026-09-19                | PULSE es la media ponderada de las variables con datos, sin calibración a percentil; las bandas 35/50/65 no cambian                                                                                                                                                                                                                                                                                    | El usuario lee el score en la escala de las variables y los aportes suman el score                                                                                                                                                                      |
| 2026-09-19                | Variable sin datos como «sin datos» y nunca como cero, junto a la confianza en %                                                                                                                                                                                                                                                                                                                       | Un cero es una medición; la ausencia de evidencia cambia la decisión y debe verse                                                                                                                                                                       |
| 2026-09-19                | Trayectoria: observado y previsión en un solo gráfico, con banda p10-p90, marca del último cierre, guías 35/50/65 compartidas (`ScoreGuides`) y dominio vertical ajustado a los datos conteniendo siempre 35 y 65                                                                                                                                                                                      | Nivel e incertidumbre se comparan en la misma escala; en 0-100 una empresa entre 38 y 48 era una línea plana                                                                                                                                            |
| 2026-09-20                | El tooltip de la trayectoria se ensancha a 288 px en un mes con señal y añade tipo, titular y detalle, con el texto de la página de Alertas                                                                                                                                                                                                                                                            | El triángulo obligaba a ir a Alertas para saber qué pasó; el mismo texto en las dos superficies evita que se contradigan                                                                                                                                |
| 2026-09-19                | Una sola empresa por pantalla, sin vistas de cartera, con la empresa en la URL en inglés (`/company/[id]`, `?company=` en Método) y nunca en storage, y el buscador (`ComboBox`) en la nav, no en la landing                                                                                                                                                                                           | Vistas compartibles y deterministas; elegir empresa no es comparar empresas, y cambiarla conserva la sección                                                                                                                                            |
| 2026-09-19                | Empresas y grupos con nombre famoso por hash determinista del identificador                                                                                                                                                                                                                                                                                                                            | Una demo legible sin inventar datos: el nombre es un disfraz estable, no una atribución                                                                                                                                                                 |
| 2026-09-19                | La empresa se reparte en siete pestañas, una pregunta por pestaña —PULSE, Diagnóstico, Acción, Detalle, Alertas, Financiación (antes «Recomendaciones»), Método—; «Cómo se calcula» vive sólo en Método                                                                                                                                                                                                | Un scroll de nueve secciones no se leía; faltaba la página que ordena qué hacer primero sin pedir dinero, y el nombre dice qué se decide allí                                                                                                           |
| 2026-09-20 (revisa 09-19) | Cabecera de producto en dos filas desde `lg`: marca, claim y buscador arriba y las siete pestañas debajo como texto 16/500 sobre un hairline, la actual con regla de 2 px en `--brand-blue`; la barra deja de ser fija                                                                                                                                                                                 | Las pestañas se leen como las del diseño y el claim vuelve a la aplicación; con dos filas una barra fija se comía 130 px de cada pantalla                                                                                                               |
| 2026-09-19                | Los destinos siguen siendo enlaces con `aria-current` aunque se lean como pestañas; bajo `lg` pasan a un `Drawer` con el buscador y las secciones en columna (48 px, la actual sobre `brand-subtle`)                                                                                                                                                                                                   | Cada sección conserva su URL y se abre en otra pestaña; siete pestañas desplazándose bajo el buscador ocultaban las últimas                                                                                                                             |
| 2026-09-20                | Claim único «La inteligencia que impulsa tu salud financiera» (`PRODUCT_TAGLINE` en `lib/brand`) en nav y landing                                                                                                                                                                                                                                                                                      | Una constante evita que marketing y producto digan dos cosas                                                                                                                                                                                            |
| 2026-09-20                | El pill de grupo pasa bajo el `h1` como `badge` de `PageShell`, no al costado como `aside`                                                                                                                                                                                                                                                                                                             | El grupo califica el nombre de la empresa; el costado queda libre para cifras                                                                                                                                                                           |
| 2026-09-19                | Títulos de sección como overline en `Section`, `Panel` como único contenedor (hairline, radio 12, inset 24, sin sombra) y `StatGrid` como tira de KPI con hairlines entre celdas                                                                                                                                                                                                                       | El `h2` competía con las cifras; un solo contenedor evita que cada página invente el suyo y la línea vertical es la separación de la marca                                                                                                              |
| 2026-09-20 (revisa 09-19) | Toda explicación se abre igual con `InfoTip`: botón de 20 px junto a la etiqueta, en hover y fijado al pulsar, en cifras de cabecera (`tip` de `StatItem`, también la PULSE), cabeceras de tabla (`headerTip`) y variables del mosaico y del treemap                                                                                                                                                   | Un `title` no existe en táctil ni en teclado; explica el número sin gastar otra línea ni añadir una caja                                                                                                                                                |
| 2026-09-20 (revisa 09-19) | Banda del score como píldora con punto de 8 px y nombre; la cifra se queda en tinta y comparte línea base con la píldora, con el pie colgando de las dos                                                                                                                                                                                                                                               | «32,8 · crítico» se lee como una frase; el color no va solo y la cifra nunca se tiñe de azul ni de rojo                                                                                                                                                 |
| 2026-09-19                | Cabecera de empresa: «Salud de los clientes» —salud de pago de sus clientes ponderada por facturación— en lugar de «Tensión a 6 meses»                                                                                                                                                                                                                                                                 | La tensión ya la cobra el precio; qué tal pagan los clientes es lo que un director financiero pregunta al abrir la empresa                                                                                                                              |
| 2026-09-20                | Fila «Tienes {X} puntos de PULSE en juego» con enlace contorneado «Pasar a la acción →» entre la regla y la tira, a la derecha y oculta si no hay pasos                                                                                                                                                                                                                                                | Convierte el score en la siguiente decisión; contorno de `--border-strong` para no duplicar el acento de marca                                                                                                                                          |
| 2026-09-19                | Historial mes a mes en orden descendente y previsión en tabla aparte con «previsto» en cada fila                                                                                                                                                                                                                                                                                                       | La decisión se toma sobre el último cierre y la distinción observado/previsto no puede depender del color                                                                                                                                               |
| 2026-09-20 (revisa 09-19) | Todas las tablas sobre `DataTable` (columnas como datos, orden por cualquier cabecera, filas sin valor al final) y «Mes a mes» cierra con «Cuántos puntos vale cada variable»: un ejemplo con números sobre `bg-deep`, sin borde                                                                                                                                                                       | Una sola implementación de tabla; el paso de valor real a puntos se comprueba a mano una vez y la superficie hundida ya lo separa                                                                                                                       |
| 2026-09-19                | Cuatro small multiples de pilar en escala 0-100 común con su peso al pie, y barras de aporte desde cero coloreadas por el score de la variable en vez de divergentes                                                                                                                                                                                                                                   | Comparar qué pilar movió el score exige la misma escala; los aportes son todos positivos y divergir desperdiciaba medio ancho                                                                                                                           |
| 2026-09-20                | Las filas de pilar y de aporte se separan con el tinte de su banda, no con filete, y desaparecen los pies «suman X»                                                                                                                                                                                                                                                                                    | El tinte ya agrupa etiqueta, barra y cifra; once filetes sólo añadían cromo y la suma la enseña el ejemplo                                                                                                                                              |
| 2026-09-20 (revisa 09-19) | Mosaico por pilar: ancho de columna = peso del pilar, alto de celda = 13 px por punto, fondo con el lavado de su banda (12 %, 22 % la seleccionada), sin punto ni filete en las medidas, leyenda separada con espacio, y el pilar en overline con su score a 24 px                                                                                                                                     | El área como peso no se leía con 11 celdas; el único borde es el `--brand-blue` de la seleccionada y el ancho ya escribe el peso                                                                                                                        |
| 2026-09-20 (revisa 09-19) | El detalle de la variable se abre dentro de su propia celda (rejilla `auto-fit` de 120 px, filete superior y «Ver la variable →»), no navegando ni en una tira bajo el mosaico                                                                                                                                                                                                                         | Las cifras aparecen donde ya está el ojo y el mapa del mes no se mueve de la pantalla                                                                                                                                                                   |
| 2026-09-20                | La columna del pilar seleccionado crece a `minmax(280px, peso×2,2fr)` con 200 ms de transición sobre `grid-template-columns`, sólo desde `md` y con `motion-safe`                                                                                                                                                                                                                                      | El mosaico abre hueco donde has pulsado; animar el ancho es lo único que el lector debe seguir, las cifras nunca se animan                                                                                                                              |
| 2026-09-20 (revisa 09-19) | Las superficies lavadas con banda (alerta de señal, cards de pilar, pasos de Acción, celdas del mosaico) no llevan borde: `bandSurfaceStyle` sólo devuelve el fondo                                                                                                                                                                                                                                    | La gravedad se lee de un vistazo en toda la página; un filete del mismo tono repetía el grupo que la tinta ya dibuja                                                                                                                                    |
| 2026-09-19                | Los tipos de señal son píldora punto + etiqueta teñida con el color de feedback de la dirección; la alerta pierde el borde izquierdo de color                                                                                                                                                                                                                                                          | El color se reserva a bandas, series y estados, y no se usan tarjetas con borde lateral de color                                                                                                                                                        |
| 2026-09-19                | Sin `PulseCompanyLinks`: cada ruta se enlaza junto a la cifra que la motiva (acciones, alerta, detalle del mosaico, ficha del modelo)                                                                                                                                                                                                                                                                  | Un enlace suelto no dice por qué ir                                                                                                                                                                                                                     |
| 2026-09-19                | El bloque navy «Qué hacer ahora» cierra el Resumen: la primera acción es el titular y las otras dos van en dos columnas bajo una línea                                                                                                                                                                                                                                                                 | La pregunta es «¿y ahora qué?»; una sola acción grande obliga a priorizar                                                                                                                                                                               |
| 2026-09-19                | Las acciones las redacta el mismo modelo de Nexo (máximo tres, con cifra y enlace validado) y, sin clave o si falla, un generador determinista con las mismas cifras; el modo `mock` se marca con la etiqueta `DEMO` junto al overline                                                                                                                                                                 | Recomendaciones específicas sin inventar datos y la página siempre responde; una sola señal de demo, reutilizable, en vez de una frase                                                                                                                  |
| 2026-09-19                | El total de Acción es la suma de los tres pasos mostrados y los puntos de cada paso se escriben a 17-20 px con «pts» en 13 px                                                                                                                                                                                                                                                                          | Una cifra que no cuadre con la lista de debajo se lee como un error; «+12,34 pts» a 28 px no cabe en 96 px y la barra ya da la magnitud                                                                                                                 |
| 2026-09-20                | La tabla de Acción muestra el valor real del mes y deja el score en su nota de información, y cada paso es una tarjeta lavada con su banda, sin borde ni filete entre filas                                                                                                                                                                                                                            | Se reconoce «14,0 días» antes que «39 sobre 100»; la tinta ya agrupa las cuatro lecturas del paso                                                                                                                                                       |
| 2026-09-20 (revisa 09-19) | El plan de una variable vive en un único panel —cinco cifras, el por qué con las cifras del mes, «Qué hacer» y las dos salidas— y la ficha no repite «qué mide»                                                                                                                                                                                                                                        | Es una sola lectura de arriba abajo; la entradilla ya es esa frase y la tira de KPI más una sección titulada la partía en tres                                                                                                                          |
| 2026-09-19                | `FactGrid` como tira de filetes dentro de un panel: filete arriba y abajo y entre celdas, primera celda sin filete ni inset, cifra 24/600 y etiqueta 13                                                                                                                                                                                                                                                | Dentro de un panel la caja repetía el borde del panel, y la primera celda alinea la tira con la columna de texto                                                                                                                                        |
| 2026-09-20 (revisa 09-19) | La medida sin coste sale de Financiación: la página abre con «Si necesitas financiación» y «Fuera de alcance hoy» pasa a panel propio                                                                                                                                                                                                                                                                  | Una medida operativa es una acción, no una oferta, y un rechazo es otra lectura que no compite con la oferta                                                                                                                                            |
| 2026-09-20 (revisa 09-19) | Cada oferta es una fila de cinco columnas (nombre, importe, tipo, encaje, CTA) con la razón plegada en «Ver detalle», un solo filete entre filas y sin tarjeta; el encaje va de 0 a 100 en tinta neutra y el precio es la única cifra con color                                                                                                                                                        | La decisión se lee de izquierda a derecha y termina en el botón; encaje y PULSE conviven en la página y no deben confundirse                                                                                                                            |
| 2026-09-19                | Precio como barra SVG apilada, proporcional al valor absoluto de cada componente en puntos básicos, con la leyenda en HTML y los descuentos dibujados huecos                                                                                                                                                                                                                                           | Texto dentro del SVG no se lee a 390 px; un descuento apunta en sentidos opuestos en coste y en rendimiento                                                                                                                                             |
| 2026-09-20                | «Solicitar propuesta» (`RequestProposalButton`) es el único botón relleno en `--brand-blue`, fijado al hex en los dos temas, y abre un diálogo de 440 px con producto, importe, plazo y quién mueve ahora                                                                                                                                                                                              | El demo no tiene banco detrás: el diálogo confirma qué se pidió; `bg-accent` en oscuro no sostiene texto blanco                                                                                                                                         |
| 2026-09-20                | El diálogo de «Solicitar propuesta» es un `<dialog>` nativo abierto con `showModal()`, no el `Modal` de HeroUI                                                                                                                                                                                                                                                                                         | Montado desde una página, el `Modal` duplicaba el estado de overlay de react-aria en el bundle de producción y todas las rutas fallaban con `useOverlayTriggerState is not a function`; el elemento nativo da foco atrapado, Escape y fondo por sí solo |
| 2026-09-20                | Financiación lleva, entre las ofertas y «Fuera de alcance hoy», el bloque navy de la palanca (`LeverHeadline`, `lib/advisor/lever-view`): «Con el pilar de X en Y en vez de Z, tu prima de riesgo baja N puntos básicos», la nota del escenario, tres cifras (tensión frente a la cartera, productos que encajan, mejor tipo) con `InfoTip` y «Cómo se calcula →»; sin palanca que ahorre, no se pinta | Es la frase del mock que dice qué está cobrando el precio; los verdes y ámbares del tema claro no aguantan sobre navy, así que las cifras usan los hex del tema oscuro                                                                                  |
| 2026-09-20                | La marca se reduce al wordmark (24 px en nav y landing, sin icono) y el favicon pasa a ser el wordmark blanco sobre navy                                                                                                                                                                                                                                                                               | Petición del equipo: una sola forma para marca y pestaña del navegador, y el icono de pulso dejaba de aportar                                                                                                                                           |
| 2026-09-20                | Todas las rutas de producto transmiten un `loading.tsx` (bajo `company/[id]` y `method`, no en `(app)`: el layout de empresa responde 404 antes de que el esqueleto se envíe) mientras leen sus datos: `PageSkeleton`, bloques grises con el ritmo de `PageShell` y la tira de KPI, `role="status"` con «Cargando la página…» y pulso sólo con `motion-safe`                                           | Una lectura lenta debe parecer trabajo en curso y no una pantalla colgada; la misma retícula evita el salto cuando llega el contenido                                                                                                                   |
| 2026-09-19                | «Plan de mejora», «Riesgo» y «Datos usados» viven plegados en «Más detalle», y las palancas son bloques por pilar con barra de bandas hoy→objetivo, dos cifras y orden por ahorro señalado en peso tipográfico                                                                                                                                                                                         | Eran cifras que no responden «y qué» pero siguen auditables; la escala de color ya dice de qué banda a cuál se pasa y el ahorro no es color                                                                                                             |
| 2026-09-19                | Sin ERP el bloque de facturas dice «sin datos» y «Sin ERP conectado», nunca cuatro ceros                                                                                                                                                                                                                                                                                                               | Un cero del libro es una medición; la ausencia de ERP cambia qué productos son posibles                                                                                                                                                                 |
| 2026-09-19                | Método centrado en el cálculo del PULSE del mes en palabras llanas: abre con la caja de fórmulas (`surface-deep`, hairline, radio 8) y la «Ficha del modelo» y sigue con un panel por bloque; AUROC, tabla de precisión, pila de precio y catálogo retirados                                                                                                                                           | La página debe entenderse sin saber estadística; el detalle de validación vive en el backend y en su README                                                                                                                                             |
| 2026-09-19                | Reparto de los 100 puntos como treemap SVG a ancho completo (columna por pilar ∝ peso, celda por variable ∝ su parte) con el detalle debajo, sin la columna técnica del export, `role="group"`, celdas `role="button"` con `tabIndex` y detalle en `aria-live`                                                                                                                                         | El área es el peso y la figura dice lo mismo que la tabla; un gráfico explorable con ratón y teclado no puede exponerse como una imagen                                                                                                                 |
| 2026-09-19                | Celda del treemap activa en `--text-primary` con texto `--surface-page`, y en reposo `surface-deep` con hairline y radio 6                                                                                                                                                                                                                                                                             | Blanco sobre `accent` no alcanza 4,5:1; separar con línea, no con relleno, hace del mapa una rejilla de paneles                                                                                                                                         |
| 2026-09-19                | Barra de confianza: relleno con datos, rayado a 45° para proxy bancario y vacío sin datos; escala de bandas en HTML con anchos en % y treemap en SVG                                                                                                                                                                                                                                                   | Hace visible la regla de 0,5 × cobertura; tipografía real donde manda el texto y SVG donde manda la geometría                                                                                                                                           |
| 2026-09-19                | Selector de mes (por defecto el último cierre) como único estado de cliente de la página de empresa                                                                                                                                                                                                                                                                                                    | Permite auditar cualquier mes sin duplicar tablas ni romper el renderizado en servidor                                                                                                                                                                  |
| 2026-09-19                | Nexo como mascota con traje y chat global en rutas de producto, con animación decorativa propia, acceso reducido a mascota y bocadillo, estado sólo en texto de cabecera y una sola empresa por conversación                                                                                                                                                                                           | Explica datos sin rehacer las vistas; el personaje ya identifica la función y el asistente no puede saber más que la pantalla                                                                                                                           |
| 2026-09-19                | Nexo es un agente con siete herramientas de lectura y `show_chart`; los gráficos del chat son figuras con overline, título, el SVG del producto y «Abrir en la aplicación», entre dos hairlines                                                                                                                                                                                                        | Responde con la cifra exacta y la dibuja; reutilizar los gráficos hace que el chat y la página digan lo mismo                                                                                                                                           |
| 2026-09-19                | Las barras del chat (`BarRow`) apilan etiqueta y cifra sobre la barra a ancho completo, y las series de la comparación se distinguen por tinta y trazo, con leyenda                                                                                                                                                                                                                                    | A 440 px la rejilla lateral truncaba las etiquetas; el color sigue reservado a banda y dirección                                                                                                                                                        |
| 2026-09-19                | Haffer SQ XH autoalojada (400/500, 600→500) como única familia; Inter, Aktiv Grotesk y DM Sans retiradas y el 700 fuera del producto                                                                                                                                                                                                                                                                   | Es la tipografía de embat.io: una sola grotesca, peso medio y ninguna negrita sintetizada                                                                                                                                                               |
| 2026-09-19                | Juego de tokens de marca de Embat —primitivos con los tokens de HeroUI apuntando a ellos, azul `#3878F6` y tinta `#050B2C`— y bandas de score en los hex de estado de la marca en vez de `oklch` propios                                                                                                                                                                                               | Una sola fuente de color para producto y marketing sin reescribir clases; dos escalas de rojo y verde en la misma pantalla no se sostienen                                                                                                              |
| 2026-09-19                | Pie de producto sólo con «By humans for humans.», centrado sobre un hairline                                                                                                                                                                                                                                                                                                                           | «Pulse · 11 variables en 4 pilares» ya está en Método y en la cabecera de cada cierre; el pie firma, no describe                                                                                                                                        |
| 2026-09-19                | `/` es landing con `SiteFrame` y el producto vive en `/company` y `/method`; marketing y producto no comparten nav                                                                                                                                                                                                                                                                                     | Las líneas del frame son columnas, no cromo                                                                                                                                                                                                             |
| 2026-09-19                | Hero de la landing: dither de destellos a la izquierda (`contain`, `scale` 0,86, tinta `#afafbb` multiplicada sobre los cuadrantes de score) con `preload` RSC del webp y fade al decode; sin lockup ni SVG PULSE a escala de columna                                                                                                                                                                  | El pie ya posee la silueta Pulse; Paper no consume `next/image` y el destello no debe depender de que el archivo llegue tarde                                                                                                                           |
| 2026-09-19                | `HeroAccess` y el pie listan todas las páginas del producto desde `companySections` de la empresa demo, con un subrayado que se oculta de izquierda a derecha y se vuelve a dibujar                                                                                                                                                                                                                    | Faltaban Diagnóstico, Detalle y Alertas; una sola fuente evita que marketing y nav diverjan                                                                                                                                                             |
| 2026-09-20 (revisa 09-19) | La banda de producto es un 2×2 de cuatro páginas (PULSE, Diagnóstico, Alertas, Financiación), cada celda un `next/link` que previsualiza título y lead en hover o foco con velo de tinta al 4 % y nunca con `--accent`; `gap-px`, plus de gutter a gutter y el eje del marco por encima                                                                                                                | El marco es el recuadro, no una Card; un enlace con prefetch es más rápido que un botón, y PULSE parecía siempre azul con el acento                                                                                                                     |
| 2026-09-19                | Un solo campo dither detrás del 2×2 (`cover`, tinta `#0d1130` con `screen` sobre los cuadrantes de score) y la cruz en overlays de 1 px                                                                                                                                                                                                                                                                | Cuatro canvases partían el destello en la cruz; el campo debe continuar y Paper no lee tokens                                                                                                                                                           |
| 2026-09-19                | Gráfica de la landing por nivel de score: cuatro niveles en su color y hover, foco o pulsación cambia a la trayectoria de esa banda, en un loop de 7,2 s                                                                                                                                                                                                                                               | La paleta de severidad se lee antes de abrir el producto; sustituye al SVG de una empresa concreta                                                                                                                                                      |
| 2026-09-19                | Dither del pie tras Producto / Documentación: mismo webp con `scale` 2,4, origin 0,68/0,32 y 28°, tinta `#afafbb` a 0,22 con `screen`; el heatmap se queda a la izquierda                                                                                                                                                                                                                              | Una tinta oscura desaparecería sobre navy y el campo entero se leía como el 2×2 con la tinta invertida                                                                                                                                                  |
| 2026-09-19                | Pie de landing sin Condiciones ni Privacidad: sólo © y la firma de producto; bandas con los tokens Embat del producto y `LandingBar` con la marca y el alto de la nav                                                                                                                                                                                                                                  | Las páginas legales no aportan al demo y la landing no debe leerse como otro producto                                                                                                                                                                   |

## 8. Review checklist

- [x] Tokens are semantic and have light/dark values where needed.
- [x] Keyboard, focus, contrast, and reduced-motion behavior are defined.
- [x] Approved HeroUI primitives and variants are listed.
- [x] A representative page has been checked at mobile and desktop widths.
- [x] Every piece of copy adds useful information; filler and repetition are removed.
- [x] Every border, divider, and line has a functional or accessibility purpose.
- [x] Spacing, grouping, alignment, and text wrapping are deliberate at mobile and desktop widths.
- [x] The team has approved this document before feature implementation.
