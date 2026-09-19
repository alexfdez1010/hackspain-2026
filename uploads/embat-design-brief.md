# Embat — brief de marca y sistema visual

Documento único para diseñar cualquier pieza de Embat. Extraído de la web
actual (embat.io/es) y del registro de marca. Todo lo que aquí no se puede
verificar está marcado al final, en «Pendientes».

---

## 1. Quién es Embat

Plataforma de tesorería corporativa para medianas y grandes empresas: controla,
anticipa, concilia y ejecuta pagos desde una sola plataforma conectada a bancos
y ERPs. Fundada en 2021 en Madrid por dos antiguos directivos de JP Morgan y un
ex CTO de Fintonic. Oficinas en Madrid, Londres, Berlín y Múnich. Su agente de
IA se llama **TellMe** y tiene identidad propia dentro de la marca.

Audiencia: CFO, director financiero y tesorero de empresa mediana y grande.
No es una fintech de consumo: la estética es sobria, densa y demostrativa.

---

## 2. Cómo se ve

La marca se mueve entre dos mundos y casi nada más.

**Navy profundo con halo azul** para lo que promete: heroes, la sección de
TellMe y el cierre. El fondo nunca es plano: un degradado radial levanta la
esquina superior derecha y cae a casi negro en las inferiores.

**Blanco puro** para lo que demuestra: bloques de producto con capturas reales
de la aplicación, titulados en casi negro azulado y explicados en gris.

### Cinco reglas duras

1. **Un solo azul, y solo en la acción.** Los enlaces de sección van en tinta
   con una flecha «→», no en azul. El azul es el botón.
2. **El violeta es de TellMe y de nadie más.** El degradado azul-violeta
   identifica al agente. Fuera de TellMe no aparece: ni fondos, ni botones, ni
   tarjetas.
3. **El producto es la ilustración.** Nada de ilustraciones abstractas,
   isométricos, iconos gigantes ni fotos de stock. Se enseñan pantallas reales:
   tablas de flujos de caja, importes, pestañas, contadores.
4. **Se separa con borde, no con sombra.** Hairline de 1px en todo. La sombra
   se reserva al panel del dashboard que flota sobre el hero y al panel de
   TellMe.
5. **Peso medio.** Titulares en 600 con tracking negativo; botones en 500 y
   caja baja. Nunca bold, nunca mayúsculas fuera del overline.

---

## 3. Color

### Marca

| Token | Hex | Papel |
| --- | --- | --- |
| brand-blue | `#3878F6` | La acción: botón primario, radio activo, fila seleccionada, línea de saldo |
| brand-navy | `#050B2C` | La tinta y la base de todo lo oscuro |
| brand-sky | `#8ED1FC` | Acento sobre oscuro, previsión en gráficos, anillo de foco |

### Navy (fondos oscuros)

`navy-950 #05081C` · `navy-850 #0A1033` · `navy-800 #111A46` ·
`navy-700 #1B2759` · `navy-600 #27356E`

950 es el borde más profundo del hero; 850 el cuerpo iluminado; 800 los paneles
elevados; 700 el panel de TellMe; 600 los bordes internos.

### Azul

`blue-50 #EFF4FF` · `blue-100 #E2EBFF` · `blue-200 #C2D5FD` · `blue-300 #86AEF9` ·
`blue-400 #5E93F7` · `blue-500 #3878F6` · `blue-600 #1F5FE0` · `blue-700 #1747AD` ·
`blue-800 #0F3580`

50 es la fila seleccionada; 100 el chip «Previsiones»; 600 el hover del botón y
el azul mínimo para texto sobre blanco.

### TellMe (solo el agente)

`tellme-indigo #5B6CF5` · `tellme-violet #A77BF3` · `tellme-magenta #C05BE0` ·
`tellme-tint #F0E8FD`

Aparecen en cuatro sitios y en ninguno más: la entrada «TellMe IA» del menú, el
botón «Descubre TellMe», el panel flotante del agente y la etiqueta TellMe
dentro de las tablas.

### Neutros

`grey-50 #F7F8FA` (marco de capturas) · `grey-100 #EFF1F5` · `grey-200 #E4E7EE`
(borde por defecto) · `grey-300 #CFD4E0` (contorno de controles) ·
`grey-400 #9AA1B4` · `grey-500 #6E7488` (texto secundario) · `grey-600 #545A6E` ·
`grey-900 #0D1130` (titulares: casi negro con matiz azul, no negro puro)

### Semánticos

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Fondo de página | `#FFFFFF` | `#050B2C` |
| Fondo profundo / marco | `#F7F8FA` | `#05081C` |
| Superficie elevada | `#FFFFFF` | `#111A46` |
| Superficie TellMe | `#F0E8FD` | `#1B2759` |
| Borde | `#E4E7EE` | blanco 12% |
| Borde de control | `#CFD4E0` | blanco 32% |
| Texto principal | `#0D1130` | `#FFFFFF` |
| Texto secundario | `#6E7488` | `#C3CADA` |
| Texto atenuado | `#9AA1B4` | `#8E9AB9` |
| Enlace de sección | `#0D1130` + flecha | `#FFFFFF` + flecha |
| Texto TellMe | `#7A4DDB` | `#A77BF3` |
| Anillo de foco | `#8ED1FC` | `#8ED1FC` |

### Datos (dirección del dinero, no estados)

`data-in #4FC08D` entradas · `data-out #E28A5F` salidas ·
`data-balance #3878F6` línea de saldo · `data-forecast #8ED1FC` tramo previsto
(discontinuo) · `data-grid #E4E7EE` rejilla

### Estados

`success #12A150` · `warning #B06F00` · `danger #C62A2F`
(en oscuro: `#3DD68C`, `#F7B955`, `#FF8A8E`)

### Degradados — tres, y solo tres

```
hero    radial-gradient(120% 95% at 72% 8%, #16266B 0%, #0A1033 48%, #05081C 100%)
tellme  linear-gradient(97deg, #5B6CF5 0%, #C05BE0 100%)
beam    linear-gradient(196deg, transparent 38%, #93B4FF2E 50%, transparent 62%)
```

`hero` es el fondo de toda sección oscura. `tellme` solo el botón del agente.
`beam` es el haz diagonal tenue que cruza la sección de TellMe: uno por sección.

---

## 4. Tipografía

**Una sola familia** para todo: grotesca geométrica, terminales rectos, caja
alta generosa. Stack: `"Aeonik", "General Sans", "Inter", system-ui, sans-serif`.

| Estilo | Tamaño / interlineado / peso / tracking | Uso |
| --- | --- | --- |
| display-xl | 72 / 1.03 / 600 / −0.025em | Hero de portada, dos líneas |
| display-lg | 60 / 1.06 / 600 / −0.02em | Hero interior, centrado |
| display-md | 52 / 1.1 / 600 / −0.02em | Apertura de sección, centrada |
| h1 | 40 / 1.15 / 600 / −0.015em | Título de página |
| h2 | 34 / 1.2 / 600 / −0.01em | Título del bloque 50/50 |
| h3 | 24 / 1.3 / 600 | Tarjeta, panel, columna de footer |
| h4 | 20 / 1.35 / 600 | Subtítulo dentro de tarjeta |
| lead | 20 / 1.55 / 400 | Bajada de hero y entradilla |
| body | 17 / 1.6 / 400 | Texto corrido |
| body-sm | 15 / 1.55 / 400 | Menús, notas, tablas |
| caption | 13 / 1.45 / 400 | Pies y prueba social |
| nav | 16 / 1 / 500 | Entradas del menú |
| button | 16 / 1 / 500 | Botones, caja baja |
| label | 14 / 1.2 / 500 | Etiquetas y cabeceras de tabla |
| overline | 13 / 1.2 / 600 / 0.06em | MAYÚSCULAS: categorías del megamenú |
| metric-xl | 44 / 1.05 / 600 / −0.02em | Cifra protagonista de panel |
| amount | 15 / 1.5 / 400 | Importes, con cifras tabulares |

Detalles que importan:

- **No hay monoespaciada.** Los importes usan la misma sans con cifras
  tabulares. Meter una mono desvirtúa la marca.
- Los **saltos de línea de los titulares se eligen a mano**, no se dejan al
  ancho del contenedor.
- Texto corrido limitado a 720px.

---

## 5. Medidas

**Espaciado**, escala de 4px: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 ·
80 · 96 · 128. El ritmo vertical de sección es 96px en escritorio, 80 en
tablet, 64 en móvil.

**Radios**: 4 (barras de gráfico) · 6 (chips) · **8 (botones e inputs — el radio
más visible de la marca)** · 12 (tarjetas y desplegables) · 16 (marcos de
captura y panel del dashboard) · 24 (bloques grandes) · pill (estados).

**Sombras**, muy escasas:
`sm 0 2px 8px #0D113014` menús · `lg 0 24px 60px -16px #0D113029` panel del
hero · `tellme 0 16px 40px -12px #5B6CF566` panel del agente.

**Retícula**: contenido 1240px, barra de navegación 1440px, texto 720px,
gutter 32px, margen lateral 32px, barra de 80px de alto.

---

## 6. Componentes

**Botón** — radio 8, padding 15/24, texto 16/500 en caja baja, sin icono a la
izquierda. Cuatro variantes:

- *primario*: fondo `#3878F6`, texto blanco. Hover `#1F5FE0`.
- *contorno*: sin relleno, borde `#CFD4E0`, texto tinta. Es el CTA de la barra
  en páginas claras.
- *sobre oscuro*: fondo blanco, texto `#0D1130`. Es el CTA de la barra cuando
  flota sobre el hero.
- *TellMe*: degradado del agente, texto blanco. Solo «Descubre TellMe».

Foco: anillo de 2px en `#8ED1FC` con 2px de separación.

**Enlace con flecha** — 17px/500 en tinta + flecha de 18px que se desplaza 4px
al hover. Es el remate de todos los bloques de producto: «Gestión de Tesorería →».

**Etiquetas** — tres familias que no se mezclan:

- *origen*: rectángulo radio 6, 12px/500. Violeta = lo ha tocado TellMe.
  Azul = es una previsión.
- *contador*: pestaña con el número en una píldora oscura, radio 4
  («Preparar 12 / Firmar 9 / Pagados»).
- *estado*: píldora con punto de 8px y texto en el color del estado. El color
  nunca va solo: siempre acompañado de texto.

**Tarjetas** — de menú (radio 12, hairline, hover teñido de `#EFF4FF`), panel de
producto (radio 12–16, cabecera separada por hairline, contenido denso) y panel
de TellMe (fondo violeta claro u oscuro, borde violeta al 30%, halo, centrado y
flotando sobre el dashboard).

**Cifras** — KPIs separados por línea vertical, valor de 44px en tinta (nunca en
azul). Importes alineados a la derecha, cifras tabulares, negativos con el menos
tipográfico (−) en rojo.

**Gráfico de flujo** — barras verdes (entradas) y naranjas (salidas) a radio 4,
agrupadas por mes; línea de saldo azul con puntos de 3,5px; tramo previsto en
celeste discontinuo; rejilla horizontal, sin ejes verticales ni marco.

---

## 7. Anatomía de la página

**Barra de navegación** · 80px, ancho 1440, márgenes de 32. Logotipo (rombo con
corte diagonal + la palabra «Embat»). Entradas: Producto ▾, **TellMe IA** en
violeta, Precio, Recursos ▾, Empresa ▾. A la derecha: globo + «ES ▾», «Login» y
el CTA «Solicitar demo». Transparente sobre el hero con CTA blanco; al hacer
scroll pasa a blanco con hairline inferior y CTA de contorno.

**Hero asimétrico** (portada) · Fondo degradado a sangre, 128px de padding
vertical. Izquierda: titular de 72px en blanco a dos líneas, bajada de 20px, un
solo botón azul. Derecha: el panel del dashboard, radio 16, con sombra larga,
**recortado por el borde derecho de la pantalla** — la interfaz continúa fuera
de la página. Encima flota el panel de TellMe.

**Hero centrado** (páginas de producto) · Titular de 60px a dos o tres líneas,
bajada centrada, botón, y debajo en 13px la prueba social: «+500 equipos
financieros confían en nosotros». Cierra con la banda de logotipos de cliente en
blanco atenuado.

**Apertura de sección clara** · Titular de 52px centrado y entradilla de 20px en
gris, a 720px de ancho.

**Bloques 50/50 alternos** · A un lado la captura dentro de un marco gris claro
con radio 16, sangrando por el lateral; al otro, titular de 34px con el
resultado prometido, párrafo en gris y enlace con flecha. El siguiente bloque
invierte los lados. 96px entre bloques, 64px entre mitades. Sin viñetas, sin
iconos, sin segundo botón.

**Sección TellMe** · Bloque oscuro a sangre con el degradado del hero más un
único haz diagonal. Titular de 60px centrado a tres líneas, bajada y el botón
con degradado.

**Testimonios** · Logotipo del cliente, cita de 20px, nombre en 17/500 y cargo
en 15px gris. Siempre cargo financiero real.

**Cierre** · Bloque oscuro, titular corto, un solo botón azul.

**Pie** · Oscuro. Logotipo, las cuatro oficinas, redes, columnas de navegación,
selector de idioma, insignias de G2 e ISO 27001 y «By humans for humans.
© Embat Technologies».

---

## 8. Voz y textos

Verbo primero, segunda persona, promesa medible. Los titulares de bloque
prometen un resultado, no una funcionalidad.

Reutiliza antes de inventar:

- «Solicitar demo» — acción primaria, siempre idéntica (en inglés, «Book a demo»).
- «Descubre TellMe» — única acción con degradado.
- «La inteligencia que impulsa tu tesorería» — claim de portada.
- «Una plataforma para la gestión de todo el ciclo de tu tesorería».
- «Controla, anticipa, concilia y ejecuta pagos desde una sola plataforma conectada».
- «+500 equipos financieros confían en nosotros».
- «Gestión de Tesorería →» — enlace de bloque: territorio y flecha.
- «By humans for humans.» — firma institucional.

Prohibido: «revolucionario», «solución 360», «partner tecnológico de
referencia», emoji en la interfaz y cualquier titular que no se pueda demostrar
con una cifra, una pantalla o un nombre propio.

---

## 9. Qué no hacer

- Degradados azul-violeta de fondo o en botones que no sean el de TellMe.
- Tarjetas con borde izquierdo de color o con emoji de icono.
- Tres columnas de iconos circulares con texto debajo.
- Blobs, mallas, partículas, glassmorphism, rejillas de puntos decorativas.
- Mockups de portátil o móvil envolviendo las capturas.
- Sombras de colores, brillos y neones (salvo el halo de TellMe).
- Texto centrado dentro de los bloques 50/50 (va a la izquierda).
- Botones tipo píldora o con esquinas de más de 8px.
- Monoespaciada para los importes.
- Textos de relleno: escribe datos financieros plausibles y en formato español
  (miles con punto, decimales con coma).

---

## 10. Checklist de fidelidad

- [ ] Todo hex sale de esta paleta; nada inventado sobre la marcha.
- [ ] Blanco sobre `#3878F6` solo a 16px con peso 500 o mayor (es 4.05:1).
- [ ] El violeta aparece únicamente en los cuatro sitios permitidos.
- [ ] Ninguna sombra salvo el panel del hero, los menús y el panel de TellMe.
- [ ] Los enlaces de bloque van en tinta con flecha, no en azul.
- [ ] Los titulares están en 600 con los saltos de línea escritos a mano.
- [ ] Hay al menos una captura de producto real por sección de producto.
- [ ] Los estados llevan texto además de color.

---

## 11. Pendientes

- **Tipografía**: no se ha podido verificar el nombre real. Es una grotesca
  geométrica tipo Aeonik; el stack la nombra primero y cae en General Sans e
  Inter. Cámbialo en un solo sitio cuando lo tengas.
- **Logotipo**: no incluido. El símbolo es un rombo con un corte diagonal, en
  blanco sobre oscuro y en `#0D1130` sobre claro, acompañado de la palabra
  «Embat». Sustituye cualquier placeholder por el SVG oficial.
- **Hex medidos en captura**: grises, navys del degradado y violetas están
  leídos de pantalla, con un margen de uno o dos puntos. Los tres colores de
  marca sí son valores oficiales.
