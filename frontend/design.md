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
  it materially improves comprehension or control recognition. Preserve visible
  focus indicators and boundaries needed for accessibility.
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

## 3. Foundations

### Color

Tokens semánticos de HeroUI v3 (`background`, `foreground`, `surface`, `muted`,
`accent`, `danger`…), más una escala propia del score. El tema oscuro se activa
con `prefers-color-scheme` redefiniendo únicamente los tokens primitivos en
`globals.css`; los derivados de HeroUI se recalculan solos.

| Token               | Light value                  | Dark value               | Usage                        |
| ------------------- | ---------------------------- | ------------------------ | ---------------------------- |
| `background`        | `oklch(0.9702 0 0)`          | `oklch(12% 0.005 285)`   | Lienzo de la aplicación      |
| `foreground`        | `oklch(0.2103 … 285.89)`     | `oklch(0.9911 0 0)`      | Texto principal              |
| `surface`           | `white`                      | `oklch(0.2103 … 285.89)` | Tarjetas y paneles           |
| `surface-secondary` | `oklch(0.9524 … 286)`        | `oklch(0.257 … 286.14)`  | Fondo de barras y celdas     |
| `accent`            | `oklch(0.6204 0.195 253.83)` | igual                    | Acción primaria y foco       |
| `muted`             | `oklch(0.5517 … 285.94)`     | `oklch(70.5% … 286.06)`  | Texto secundario y etiquetas |
| `danger`            | `oklch(0.6532 0.2328 25.74)` | `oklch(0.594 … 24.63)`   | Estados destructivos         |
| `--score-critical`  | `oklch(0.6 0.21 26)`         | `oklch(0.68 0.2 26)`     | Score < 35                   |
| `--score-fragile`   | `oklch(0.72 0.15 72)`        | `oklch(0.79 0.15 76)`    | Score 35-50                  |
| `--score-neutral`   | `oklch(0.62 0.03 262)`       | `oklch(0.72 0.03 262)`   | Score 50-65                  |
| `--score-solid`     | `oklch(0.63 0.15 156)`       | `oklch(0.74 0.16 157)`   | Score > 65                   |

Contrast requirements: WCAG AA (4,5:1) para texto sobre `background` y
`surface`; 3:1 para bordes de control y elementos gráficos portadores de
información. El color nunca es el único portador de significado: el score
siempre se acompaña del número y de la banda en texto accesible, y las alertas
llevan etiqueta de severidad además de color.

### Typography

- Display family and weights: Geist Sans 600, `tracking-tight`.
- Body family and weights: Geist Sans 400 y 500.
- Code family: Geist Mono (identificadores y valores crudos cuando aparecen).
- Type scale: 12 / 14 / 16 / 18 / 24 / 30 / 36 px (`text-xs` … `text-4xl`).
  Toda cifra comparable usa `tabular-nums`.
- Line-height rules: 1,5 en texto corrido; 1,25 en titulares y cifras.
- Maximum readable line length: 70-75 caracteres (`max-w-3xl`).

### Spacing, shape, and elevation

- Base spacing unit: 4 px (`--spacing` de HeroUI).
- Spacing scale: 2, 3, 4, 5, 6, 8, 10 → gaps dentro de un grupo ≤ 4; entre
  grupos 6-8; entre secciones de página 10.
- Border radii: `--radius` 0,5 rem en controles; 2 px en celdas de datos.
- Border treatment: sin contornos decorativos. Sólo se dibuja una línea cuando
  separa datos que se leen mal juntos (guías 35/50/65 del gráfico de score,
  marca de changepoint, eje cero de las barras divergentes).
- Shadow/elevation levels: sólo la sombra propia de HeroUI en `Card` y en
  overlays; ningún nivel adicional.
- Focus ring treatment: anillo de HeroUI (`--focus`, 2 px de offset), nunca
  suprimido.

### Motion

- Motion principles: la interfaz no anima datos. Sólo transiciones de estado de
  control (hover, foco, apertura de popover). Nexo, solicitado como mascota
  animada, es la excepción: respiración lenta, parpadeo y expresiones según el
  estado del chat; nunca altera ni anima las cifras de la cartera.
- Duration scale: 120 ms para hover y color; 200 ms para overlays.
- Easing curves: las de HeroUI (`ease-out` a la entrada, `ease-in` a la salida).
- Reduced-motion behavior: `prefers-reduced-motion` desactiva todos los
  movimientos y transiciones de Nexo. Las expresiones siguen identificando el
  estado, acompañado siempre por texto accesible.

## 4. Component system

Use HeroUI v3 components first. Document any wrapper or new primitive before
adding it to the codebase.

| Component/pattern | HeroUI primitive                    | Approved variants               | Usage guidance                                                            |
| ----------------- | ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Button            | `Button`                            | `secondary`, `tertiary`         | Sólo acciones de la propia vista (paginar, invertir orden).               |
| Link              | `Link` / `next/link`                | por defecto                     | `next/link` para navegación interna; `Link` de HeroUI cuando lleva icono. |
| Card              | `Card`                              | `secondary`                     | Únicamente la tarjeta de Embat Capital, que agrupa oferta y evolución.    |
| Form field        | `SearchField`, `Select` + `ListBox` | por defecto                     | Filtros del radar; cada control lleva `aria-label`, no etiqueta visible.  |
| Feedback          | `Chip`                              | `soft` con `color` semántico    | Dirección, régimen, severidad y estado de la línea.                       |
| Data              | `Table`                             | por defecto                     | Tabla de cartera, dentro de `Table.ScrollContainer`.                      |
| Asistente Nexo    | `Modal`, `Button`, `TextArea`       | `primary`, `secondary`, `ghost` | Diálogo lateral de 440 px; hoja inferior en móvil.                        |

### Nexo

- Personaje original de cerámica azul hielo, traje azul noche, camisa blanca y
  corbata azul. La ilustración es una excepción al color exclusivamente semántico:
  aporta identidad sin representar un score ni un estado financiero.
- Ilustración transparente y expresiones SVG independientes; estados de reposo,
  escucha, pensamiento, respuesta, saludo y error. Los componentes son
  decorativos; el chat comunica sus estados mediante texto.
- Acceso flotante en la esquina inferior derecha: sólo la mascota y un
  bocadillo «¿Necesitas ayuda? Escríbeme», sin fondo ni chip. Panel con
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

- Container widths: `max-w-7xl` en páginas; `max-w-3xl` en texto corrido.
- Breakpoints: los de Tailwind (`sm` 640, `lg` 1024).
- Navigation behavior by breakpoint: barra superior fija que envuelve en varias
  líneas en móvil; no hay menú colapsable porque son seis destinos.
- Mobile-first exceptions: la tabla de cartera y el mapa de calor mantienen su
  ancho mínimo y scrollan.
- Table/data-density strategy: 40 filas por lote con un botón para ampliar; el
  filtrado y el orden se resuelven en cliente sobre la proyección ligera que
  envía el servidor.

## 7. Decision log

Record meaningful deviations from HeroUI defaults or previously approved
patterns.

| Date       | Decision                                                                                | Reason                                                                                         | Owner        |
| ---------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| 2026-09-18 | Gráficos SVG propios en lugar de una librería de charting                               | Formas muy específicas (changepoint, waterfall, curva de evento) y bundle mínimo               | Equipo Pulse |
| 2026-09-18 | Tema oscuro por `prefers-color-scheme` redefiniendo tokens primitivos                   | HeroUI expone su paleta oscura tras `.dark`; sin conmutador no hay estado que guardar          | Equipo Pulse |
| 2026-09-18 | Escala de color del score como único helper (`scoreBand`)                               | Un mismo score debe tener el mismo color en tabla, gráfico, mapa de calor y oferta             | Equipo Pulse |
| 2026-09-18 | Filtros de Monitor y Capital como enlaces con query string                              | Vistas compartibles durante la demo y funcionales sin JavaScript                               | Equipo Pulse |
| 2026-09-19 | Observado y previsión en un solo gráfico, con banda p10-p90 y marca del último cierre   | Comparar nivel y horizonte en la misma escala; la incertidumbre no puede quedar en otra figura | Equipo Pulse |
| 2026-09-19 | Variable sin datos como «sin datos» y nunca como cero, junto a la confianza en %        | Un cero es una medición; la ausencia de evidencia cambia la decisión y debe verse              | Equipo Pulse |
| 2026-09-19 | Nexo como mascota con traje y chat global, con animación decorativa independiente       | Petición de producto; permite explicar datos y consultar IA sin rehacer las vistas existentes  | Equipo Pulse |
| 2026-09-19 | Acceso a Nexo reducido a mascota y bocadillo; estado del chat sólo en texto de cabecera | Menos elementos compitiendo con los datos; el personaje ya identifica la función               | Equipo Pulse |

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
