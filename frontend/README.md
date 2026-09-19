# Web (Next.js)

Next.js application of the HackSpain 2026 monorepo. The Python ML service lives in [`../backend`](../backend).

A **production-grade Next.js template** engineered with enterprise-level best practices, comprehensive testing infrastructure, and strict code quality standards. Built for teams that demand excellence in maintainability, scalability, and developer experience. This template is based in the practices used in [ZeroChats](https://github.com/zerochats).

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)](https://tailwindcss.com/)
[![HeroUI](https://img.shields.io/badge/HeroUI-v3-7c3aed)](https://heroui.com/)

## 🩻 Embat Pulse (HackSpain 2026, reto Embat)

Producto de una sola empresa: cada pantalla muestra el PULSE de la empresa
abierta y nunca una vista global de la cartera. Sin base de datos y sin backend
obligatorio.

| Ruta                            | Qué muestra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                             | Redirige a la empresa de demo. No hay portada: la empresa se cambia desde el selector de la cabecera, que mantiene la sección abierta.                                                                                                                                                                                                                                                                                                                                                                           |
| `/company/[id]`                 | Resumen de la empresa: score del cierre sobre la regla de bandas, variación, confianza, salud de los clientes (media de la salud de pago de sus clientes ponderada por facturación, sobre 100) y días de caja; alerta de señal; trayectoria con previsión +1..+6 m y banda p10-p90; «Qué hacer ahora» (hasta tres acciones escritas por el modelo).                                                                                                                                                              |
| `/company/[id]/diagnosis`       | Diagnóstico: mosaico de las 11 variables por pilar (ancho = peso del pilar, alto = peso de la variable, cada celda con el lavado de su banda) con la tira de detalle de la variable elegida, y la evolución de los cuatro pilares.                                                                                                                                                                                                                                                                               |
| `/company/[id]/detail`          | Detalle: cualquier cierre abierto entero (pilares y aportes), la previsión desglosada por horizonte y las tablas mes a mes (observados y previstos).                                                                                                                                                                                                                                                                                                                                                             |
| `/company/[id]/variable/[key]`  | Una variable del PULSE de la empresa: score, valor y aporte del último cierre, estadísticas del historial, score mes a mes frente al pilar y al PULSE, valor observado, puntos ganados, posición frente al resto, peso en la previsión, el detalle propio de la variable (ranking de clientes por salud de pago, proveedores por DPO y plazo, líneas de crédito, deuda y vencimientos, antigüedad de la cartera, caja diaria) y la tabla mes a mes. Se abre desde la tira de detalle del mosaico de Diagnóstico. |
| `/company/[id]/signals`         | Señales: alertas abiertas (episodios sin tres meses de seguimiento, con la probabilidad de que duren) e histórico de episodios cerrados con lo que fueron (bache o caída, repunte o mejora), contadores de caídas y mejoras confirmadas y de aciertos al abrirse. La página de PULSE muestra la señal más reciente de los últimos seis meses como alerta y marca cada señal con un triángulo en la trayectoria.                                                                                                  |
| `/company/[id]/recommendations` | Financiación: «Qué hacer ahora» (hasta tres acciones escritas por el modelo), los productos aprobados en una fila cada uno con importe, tipo, encaje y su argumento plegado en «Ver detalle», «Fuera de alcance hoy» con la regla que deja fuera cada producto, y «Más detalle» con plan de mejora, riesgo y datos usados, todo plegado.                                                                                                                                                                         |
| `/method?company=[id]`          | Método: cómo se calcula el PULSE del mes en palabras llanas (escala, 100 puntos, cuatro pasos, confianza y un mes real sumado a mano); previsión, señales, precio y límites en cuatro frases.                                                                                                                                                                                                                                                                                                                    |

Las empresas y los grupos del export son anónimos (`COMP_0001`, `GROUP_0147`).
La interfaz los muestra con el nombre de una empresa o grupo famoso elegido por
un hash determinista del identificador (`src/lib/company/names.ts`, catálogos
en `src/lib/company/catalogues.ts`): el mismo identificador da siempre el mismo
nombre, dos identificadores pueden compartirlo y el identificador real sigue
visible en las rutas, en el selector y en la entradilla de cada página.

### Arrancar la demo

```bash
bun run dev
```

### Nexo, asistente de Pulse

Mascota con traje, expresiones animadas y chat global accesible desde el botón
flotante o `Ctrl/Cmd+J`. Funciona sin clave con respuestas simuladas, streaming,
contexto de la página, cancelación, reintento y enlaces a los datos originales.
La conversación permanece en memoria al navegar y se elimina al recargar.

Nexo es un agente: dispone de siete herramientas de sólo lectura sobre la
empresa de la conversación (historial, mes, previsión, alertas, financiación,
variable y detalle de contrapartes) y de `show_chart`, que dibuja gráficos
interactivos dentro del chat con los datos reales del export: trayectoria con
previsión y señales, pilares, las once variables, puntos ganados y perdidos,
una variable mes a mes, comparación de variables, impulsores de la previsión,
caja diaria y rankings de clientes, proveedores, morosos, líneas o deuda. El
modelo elige el gráfico y comenta la lectura; los números los pone el servidor.
Pídele «Dibuja la trayectoria del PULSE», «¿Qué variables restan más puntos?»
o «Compara días de caja y DSO, y un ranking de morosidad».

Para conectar Vercel AI Gateway, define `AI_GATEWAY_API_KEY` en `.env` (o
`.env.local`) y reinicia Next.js; el servidor la lee al arrancar y el SDK la
toma del entorno. El modelo está fijado como `ASSISTANT_MODEL =
'google/gemini-3.8-flash'` en `src/lib/assistant/config.ts`, con razonamiento
en nivel bajo y 10.000 tokens de salida para que la respuesta llegue completa.
No se configura desde el navegador. `ASSISTANT_MODE=mock` fuerza la demo;
`ASSISTANT_MODE=gateway` exige una clave y devuelve un error claro si falta.
Nunca se envía la clave al cliente.

El frontend es propietario de `POST /api/assistant` y `GET /api/actions/[id]`; no añade endpoints a FastAPI.
Acepta `{ messages: UIMessage[], pathname: string }` y devuelve SSE con el protocolo
UI Message Stream de AI SDK 7, partes de herramienta (`tool-*`) incluidas. Acepta
texto y, en las respuestas anteriores del asistente, partes de herramienta
terminadas de las ocho herramientas conocidas; roles `user`/`assistant`, hasta
20 mensajes, 32 partes por mensaje, 2.000 caracteres por pregunta y 256 KiB por
petición. El transporte
del navegador limita el historial a los últimos 20 mensajes. La respuesta incluye
metadata `{ mode: 'mock' | 'gateway', sources: { label, href }[] }`.
Errores antes del stream: JSON `{ error: string }`, códigos 400/403/413/415/503;
errores del modelo durante el stream: evento SDK `error` con mensaje seguro.
El contexto se obtiene de los adaptadores de datos existentes, nunca del HTML
enviado por el cliente. Ejemplo de invocación y contrato completo en
[la documentación de Nexo](docs/nexo.md).

Referencias: [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/getting-started),
[AI SDK Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot),
[Gemini 3.8 Flash](https://vercel.com/ai-gateway/models/gemini-3.8-flash).

### Qué hacer ahora (acciones)

Cada página de empresa abre con el bloque navy «Qué hacer ahora»: como máximo
tres acciones, de mayor a menor impacto, escritas por el mismo modelo de
Gateway que Nexo (`ASSISTANT_MODEL`) con salida tipada `Output.object` y 30 s
de plazo. La primera acción es el titular de la página; las otras dos van bajo
una línea, y cada una enlaza a la página donde se ejecuta o se comprueba.

El modelo sólo recibe las cifras de esa empresa —score, pilares, variables
flojas y sin datos, señal abierta, previsión, tensión a seis meses, caja,
ofertas con su palanca y descartados—; nunca la cartera. Los destinos que
escribe se validan contra las rutas conocidas: cualquier otro cae en la página
de recomendaciones. Las acciones llegan por `GET /api/actions/[id]` y el navegador guarda la
respuesta del modelo en `localStorage` por empresa y cierre, así que volver a
la empresa —hoy o mañana— no vuelve a pagar tokens; el servidor añade además
un memo de una hora por empresa. Con `ASSISTANT_MODE=mock`, si el modelo falla o si no devuelve nada
utilizable, el bloque escribe las acciones deterministas a partir de las mismas
cifras y se marca con la etiqueta `DEMO`. Contrato y ejemplo de la respuesta en
[la documentación de acciones](docs/actions.md).

### Fuente de datos

Dos capas con el mismo patrón —una interfaz, una implementación estática y otra
contra la API— seleccionadas por entorno en un factory:

- **PULSE** (`src/lib/pulse/data.ts`, interfaz `PulseDataSource`):
  `StaticPulseSource` lee `src/data/pulse/summary.json` y
  `src/data/pulse/companies/<id>.json` (1.285 ficheros que reescribe
  `uv run python -m ml_service.pulse.export_web`) y el detalle por variable de
  `src/data/pulse/details/<id>.json` (espejo de
  `uv run python -m ml_service.pulse.export_details`, tipos en
  `src/lib/pulse/details/types.ts`); `ApiPulseSource` se activa con
  `PULSE_API_URL`.
- **Advisor** (`src/lib/advisor/data.ts`, interfaz `AdvisorDataSource`):
  `StaticAdvisorSource` lee `src/data/pulse/recommendations/catalogue.json` y
  `src/data/pulse/recommendations/companies/<id>.json` (espejo que escribe
  `uv run python -m ml_service.pulse.recommend.cli build`); `ApiAdvisorSource`
  se activa con la misma variable.

| Variable        | Obligatoria | Descripción                                                                                                                              |
| --------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `PULSE_API_URL` | No          | URL raíz del servicio FastAPI, p. ej. `http://localhost:8000`. Sin ella se leen los JSON del repositorio. `XRAY_API_URL` sigue valiendo. |

Contrato consumido (el servicio es el dueño de cada endpoint; este listado es el
espejo en el consumidor):

| Método y ruta                              | Respuesta esperada                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/pulse/summary`                   | `score_name`, `score_expansion`, `horizons`, `last_month`, `pillars[{key,label,weight}]`, `variables[{key,number,label,pillar,weight,raw,unit}]`, `contribution_keys`, `evaluation{score,forecast{horizons},risk,signals{anticipation{horizons},persistence}}`, `companies[...]` (solo se usan los identificadores).                             |
| `GET /api/pulse/companies/{id}`            | Empresa con `series[]` (por mes: `pulse`, `confidence`, `pillars`, `variables`, `contributions`, `cash_end`) y `forecast[]` (`horizon`, `target_month`, `pulse_pred`, `pulse_p10`, `pulse_p90`, `delta_raw`, `contributions`) y `signals[]` (por episodio: `month`, `kind` `caida                                                                | bache | mejora | repunte`, `direction`, `level`, `baseline`, `move`, `breadth`, `confidence`, `pillar_deltas`, `drivers[]`, `p_persistent`, `outcome` `persistente | transitorio | null`, `headline`, `detail`; parser en `src/lib/pulse/parse-signals.ts`); la app conserva solo los horizontes +1..+6. |
| `GET /api/pulse/companies/{id}/details`    | `company_id`, `month` y `variables{...}` con un bloque por variable: listas con tope de 8 (`accounts`, `lines`, `suppliers`, `customers`, `debtors`, `products`), `daily[]` (62 días), `aging[]` (5 tramos) y `months[]` (12 meses) con las columnas que documenta el README del backend. Bloques siempre presentes, vacíos cuando no hay datos. |
| `GET /api/pulse/recommendations/catalogue` | `reference_rate`, `pricing_parameters`, `products[]`, `risk_model`.                                                                                                                                                                                                                                                                              |
| `GET /api/pulse/recommendations/{id}`      | `summary`, `risk`, `recommendations[]` (con `reasons`, `sizing`, `pricing`, `levers`), `declined[]`, `improvement_plan`, `inputs`, `disclaimer`. Admite `?euribor=`.                                                                                                                                                                             |

Las respuestas se parsean con parsers tolerantes: claves desconocidas se
ignoran, las ausentes quedan a `null` y un fallo de red degrada la página a su
estado vacío. Una variable sin evidencia llega con `known: false` y se muestra
como «sin datos», nunca como un cero. Los pesos suman 100 puntos y las
contribuciones de cada horizonte suman exactamente `delta`; ambas
invariantes se comprueban en `tests/unit/pulse-source.test.ts` y
`tests/unit/pulse-company-view.test.ts`. En el Advisor, los componentes del
precio suman el diferencial (`tests/unit/advisor-source.test.ts`).

Empresas de ejemplo: `/company/COMP_0001` («Atresmedia Labs»: 8 meses observados,
82 % de confianza, dos variables de líneas sin datos, tres productos
recomendados) y `/company/COMP_0051` («Atlassian Global»: 24 meses y
utilización de líneas conocida). Ambas están fijadas en `src/lib/pulse/demo.ts`.

## 🎯 Philosophy

This template embodies **professional software engineering principles** with a focus on:

- **SOLID Principles** - Applied rigorously across all code
- **Design Pattern Driven** - Appropriate patterns for maintainability and scalability
- **Documentation First** - Comprehensive TSDoc/JSDoc for all functions, classes, and hooks
- **Testing as Priority** - Unit, integration, and E2E tests with meaningful coverage
- **Code Quality** - Strict linting, formatting, and file size limits (200 lines max)
- **Type Safety** - Full TypeScript strict mode enforcement

See [AGENTS.md](./AGENTS.md) for complete development guidelines and principles that are used to guide AI Agents.

## ✨ Features

### Core Stack

- **[Next.js 15.5.4](https://nextjs.org/docs)** - React framework with App Router
- **[React 19.1.0](https://react.dev/)** - Latest React with Server Components
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Strict type safety
- **[TailwindCSS 4.x](https://tailwindcss.com/)** - Utility-first CSS framework
- **[HeroUI v3](https://heroui.com/en/docs/react/components)** - Accessible React components built on React Aria and Tailwind CSS 4

### Testing Infrastructure

- **[Vitest](https://vitest.dev/)** - Fast unit and integration testing
- **[Playwright](https://playwright.dev/)** - Reliable E2E testing across browsers
- **Comprehensive test setup** - Separate unit, integration, and E2E test suites

### Code Quality Tools

- **[ESLint](https://eslint.org/)** - Next.js and TypeScript linting rules
- **[Prettier](https://prettier.io/)** - Consistent code formatting
- **Pre-commit hooks** - Automated testing and formatting before commits
- **Strict TypeScript** - Maximum type safety configuration

### Infrastructure

- **Environment management** - Configuration with `.env` files
- **Dockerfile** - Multi-stage standalone image (see `../Makefile` `up`)

## 📋 Prerequisites

- **Node.js** 22.22.0 or higher (required by the current HeroUI CLI)
- **Bun** 1.x or higher ([install](https://bun.sh/))
- **Git** for version control

## 🚀 Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/alexfdez1010/next-template.git my-project
cd my-project

# Install dependencies
bun install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Optional: point XRAY_API_URL at the FastAPI service
# XRAY_API_URL="http://localhost:8000"
```

### 3. Run Development Server

```bash
# Start development server with Turbopack
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🎨 HeroUI and design system

This template uses HeroUI v3 as its UI component library. It does not use
shadcn/ui or require a provider. Complete [`design.md`](./design.md) before
implementing product features; it defines the visual language, semantic
tokens, approved component variants, accessibility requirements, and layout
decisions for the project.

### HeroUI CLI

The project includes the official `heroui-cli` as a dev dependency, so its
version is reproducible for every contributor:

```bash
# Show all available commands
bun run heroui

# Install HeroUI packages and peer dependencies in another checkout
bun run heroui:install

# Check HeroUI packages and peer dependencies
bun run heroui:doctor

# List installed HeroUI packages
bun run heroui:list

# Upgrade @heroui/react and @heroui/styles interactively
bun run heroui:upgrade

# Refresh the official HeroUI React agent documentation in AGENTS.md
bun run heroui:agents
```

The scripts use a temporary `npm@10` runner internally because the current
HeroUI CLI performs registry checks through the `npm` executable even when the
project is managed with Bun. No global npm installation is required for these
commands.

For a new project, use `bunx heroui-cli@latest init`. For this existing
template, install dependencies with `bun install`; do not run `init` because it
would replace the current application structure. The official references are
[HeroUI Quick Start](https://heroui.com/en/docs/react/getting-started/quick-start),
[HeroUI CLI](https://heroui.com/en/docs/react/getting-started/cli), and
[HeroUI React components](https://heroui.com/en/docs/react/components).

HeroUI v3 requires React 19 and Tailwind CSS 4. Import Tailwind before HeroUI
styles in `src/app/globals.css`:

```css
@import 'tailwindcss';
@import '@heroui/styles';
```

Use compound components such as `Card.Header`, `Card.Content`, and
`Card.Footer`; use semantic variants and `onPress` for interactive controls.
HeroUI v3 does not require `HeroUIProvider`.

The official React agent skill is installed at
`../.agents/skills/heroui-react` (repository root) and registered in `../skills-lock.json`. To refresh
it with the official source, run:

```bash
bunx skills add heroui-inc/heroui --skill heroui-react --yes
```

### Tablas con orden por columna

Toda tabla de datos se construye con `DataTable`
(`src/components/ui/data-table.tsx`), un envoltorio de HeroUI `Table` que
ordena por cualquier columna al pulsar su cabecera, en ambos sentidos. Las
columnas se declaran como datos: id, cabecera, celda y, si la columna se puede
ordenar, un `sortBy` que devuelve el valor a comparar (`number | string | null`).
Una fila sin valor (`null`) queda siempre al final, en cualquier sentido, para
que «sin datos» nunca parezca la mejor ni la peor cifra. `defaultSort` fija el
orden con el que abre la tabla y la cabecera lo muestra.

```tsx
const COLUMNS: readonly DataTableColumn<Row>[] = [
  {
    id: 'label',
    header: 'Variable',
    isRowHeader: true,
    sortBy: (r) => r.label,
    cell: (r) => r.label,
  },
  {
    id: 'weight',
    header: 'Peso',
    cellClassName: 'tabular-nums',
    sortBy: (r) => r.weight,
    cell: (r) => `${r.weight} pts`,
  },
];

<DataTable
  aria-label="Variables del score"
  columns={COLUMNS}
  rows={rows}
  rowId={(r) => r.key}
  defaultSort={{ column: 'weight', direction: 'descending' }}
/>;
```

La ordenación es pura (`sortRows` en `src/lib/table/sort.ts`, con colación
española) y ocurre en el cliente sobre filas ya calculadas en el servidor; el
componente no accede a la fuente de datos. Las cuatro tablas del producto (mes a
mes, previsión, variables y ejemplo del método) la usan.

## 📜 Available Scripts

### Development

- **`bun run dev`** - Start development server
- **`bun run build`** - Build production bundle
- **`bun run start`** - Start production server
- **`bun run launch`** - Build and start production server

### Code Quality

- **`bun run lint`** - Run ESLint
- **`bun run format`** - Format code with Prettier
- **`bun run lint-format`** - Lint and format (required before commits)
- **`bun run heroui:doctor`** - Validate HeroUI dependencies and peer dependencies
- **`bun run pre-commit`** - Run tests and code quality checks

### Testing

- **`bun run test`** - Run all tests (unit, integration, E2E)
- **`bun run test:unit`** - Run unit tests only
- **`bun run test:integration`** - Run integration tests only
- **`bun run test:e2e`** - Run E2E tests with Playwright
- **`bun run playwright`** - Open Playwright UI for debugging

## 🏗️ Project Structure

```
frontend/
├── src/
│   └── app/              # Next.js App Router pages
│       ├── layout.tsx    # Root layout
│       ├── page.tsx      # Home page
│       └── globals.css   # Global styles
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── setup.ts          # Test configuration
├── public/               # Static assets
├── .vscode/              # VS Code settings
├── Dockerfile            # Production image (standalone Next.js)
├── eslint.config.mjs     # ESLint configuration
├── playwright.config.ts  # Playwright configuration
├── vitest.config.ts      # Vitest configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # TailwindCSS configuration
├── .prettierrc           # Prettier configuration
├── .env.example          # Environment template
└── AGENTS.md             # AI Agents Development guidelines
```

## 🧪 Testing Strategy

### Unit Tests

Located in `tests/unit/`, these test individual functions and components in isolation.

```bash
bun run test:unit
```

### Integration Tests

Located in `tests/integration/`, these test module interactions and API endpoints.

```bash
bun run test:integration
```

### End-to-End Tests

Located in `tests/e2e/`, these test complete user flows across browsers.

```bash
bun run test:e2e
```

## 🚢 Deployment

### Environment Variables

No variable is required. Set `XRAY_API_URL` to read from the FastAPI service;
leave it unset to serve the JSON bundled under `src/data`:

```bash
XRAY_API_URL="https://api.example.com"
```

### Build and Deploy

```bash
# Build production bundle
bun run build

# Run production server
bun run start
```

## 🔧 Configuration Files

- **`tsconfig.json`** - TypeScript strict mode, path aliases
- **`eslint.config.mjs`** - Next.js and TypeScript rules
- **`.prettierrc`** - Single quotes, trailing commas, 2-space tabs
- **`vitest.config.ts`** - Node environment, 10s timeout
- **`playwright.config.ts`** - Multi-browser E2E testing

## 📚 Resources

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 📄 Template Usage

This is a template repository. To use it:

1. Click "Use this template" on GitHub
2. Clone your new repository
3. Remove or modify this README as needed
4. Start building your application

## Imagen social

`src/app/opengraph-image.jpg` es la imagen Open Graph compartida por las rutas
de la aplicación (1200 × 630). Incluye Embat Pulse, el icono del header y Nexo.
Se generó con ImageGen usando `src/app/icon.svg` y
`public/mascot/nexo-suit.png` como referencias de identidad. Su texto alternativo
vive en `src/app/opengraph-image.alt.txt`.

Decisión (2026-09-19): mantener el arte como recurso estático separa la identidad
visual de los componentes y evita renderizar imágenes en cada petición.

Next.js publica la imagen y sus metadatos automáticamente mediante su
[convención de imágenes sociales](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image).
Para verla localmente, arranca la aplicación con `bun run dev` y abre
`http://localhost:3000/opengraph-image.jpg`. Las tarjetas de Twitter/X también
heredan esta imagen desde Open Graph.
