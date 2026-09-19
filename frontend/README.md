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

| Ruta                             | Qué muestra                                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                              | Portada: selector de empresa por identificador (sin cifras) y dos ejemplos.                                                                                           |
| `/empresa/[id]`                  | PULSE de la empresa: score del mes, trayectoria con previsión +1..+6 m y banda p10-p90, mes a mes, evolución de pilares, explorador mensual de variables y desglose. |
| `/empresa/[id]/recomendaciones`  | Advisor: productos financieros que encajan, importe, tipo y por qué; precio desglosado, palancas, descartados, plan de mejora, riesgo y datos usados.                 |
| `/metodo?empresa=[id]`           | Método: anatomía de los 100 puntos, variables y pesos, pipeline, confianza, ejemplo real, evaluación del score y de la previsión, y cómo se pone precio a un producto. |

`/pulse` y `/pulse/[id]` redirigen a `/` y a `/empresa/[id]`.

### Arrancar la demo

```bash
bun run dev
```

### Nexo, asistente de Pulse

Mascota con traje, expresiones animadas y chat global accesible desde el botón
flotante o `Ctrl/Cmd+J`. Funciona sin clave con respuestas simuladas, streaming,
contexto de la página, cancelación, reintento y enlaces a los datos originales.
La conversación permanece en memoria al navegar y se elimina al recargar.

Para conectar Vercel AI Gateway, define `AI_GATEWAY_API_KEY` en `.env` (o
`.env.local`) y reinicia Next.js; el servidor la lee al arrancar y el SDK la
toma del entorno. El modelo está fijado como `ASSISTANT_MODEL =
'google/gemini-3.8-flash'` en `src/lib/assistant/config.ts`, con razonamiento
en nivel bajo y 10.000 tokens de salida para que la respuesta llegue completa.
No se configura desde el navegador. `ASSISTANT_MODE=mock` fuerza la demo;
`ASSISTANT_MODE=gateway` exige una clave y devuelve un error claro si falta.
Nunca se envía la clave al cliente.

El frontend es propietario de `POST /api/assistant`; no añade endpoints a FastAPI.
Acepta `{ messages: UIMessage[], pathname: string }` y devuelve SSE con el protocolo
UI Message Stream de AI SDK 7. Sólo acepta texto y roles `user`/`assistant`, hasta
20 mensajes, 2.000 caracteres por pregunta y 64 KiB por petición. El transporte
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

### Fuente de datos

Dos capas con el mismo patrón —una interfaz, una implementación estática y otra
contra la API— seleccionadas por entorno en un factory:

- **PULSE** (`src/lib/pulse/data.ts`, interfaz `PulseDataSource`):
  `StaticPulseSource` lee `src/data/pulse/summary.json` y
  `src/data/pulse/companies/<id>.json` (1.285 ficheros que reescribe
  `uv run python -m ml_service.pulse.export_web`); `ApiPulseSource` se activa
  con `PULSE_API_URL`.
- **Advisor** (`src/lib/advisor/data.ts`, interfaz `AdvisorDataSource`):
  `StaticAdvisorSource` lee `src/data/pulse/recommendations/catalogue.json` y
  `src/data/pulse/recommendations/companies/<id>.json` (espejo que escribe
  `uv run python -m ml_service.pulse.recommend.cli build`); `ApiAdvisorSource`
  se activa con la misma variable.

| Variable        | Obligatoria | Descripción                                                                                                                       |
| --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PULSE_API_URL` | No          | URL raíz del servicio FastAPI, p. ej. `http://localhost:8000`. Sin ella se leen los JSON del repositorio. `XRAY_API_URL` sigue valiendo. |

Contrato consumido (el servicio es el dueño de cada endpoint; este listado es el
espejo en el consumidor):

| Método y ruta                                | Respuesta esperada                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/pulse/summary`                     | `score_name`, `score_expansion`, `horizons`, `last_month`, `pillars[{key,label,weight}]`, `variables[{key,number,label,pillar,weight,raw,unit}]`, `contribution_keys`, `evaluation{score,forecast{horizons},risk}`, `companies[...]` (solo se usan los identificadores). |
| `GET /api/pulse/companies/{id}`              | Empresa con `series[]` (por mes: `pulse`, `pulse_raw`, `confidence`, `pillars`, `variables`, `contributions`, `cash_end`) y `forecast[]` (`horizon`, `target_month`, `pulse_pred`, `pulse_p10`, `pulse_p90`, `delta_raw`, `contributions`).                              |
| `GET /api/pulse/recommendations/catalogue`   | `reference_rate`, `pricing_parameters`, `products[]`, `risk_model`.                                                                                                                                                                                                      |
| `GET /api/pulse/recommendations/{id}`        | `summary`, `risk`, `recommendations[]` (con `reasons`, `sizing`, `pricing`, `levers`), `declined[]`, `improvement_plan`, `inputs`, `disclaimer`. Admite `?euribor=`.                                                                                                     |

Las respuestas se parsean con parsers tolerantes: claves desconocidas se
ignoran, las ausentes quedan a `null` y un fallo de red degrada la página a su
estado vacío. Una variable sin evidencia llega con `known: false` y se muestra
como «sin datos», nunca como un cero. Los pesos suman 100 puntos y las
contribuciones de cada horizonte suman exactamente `delta_raw`; ambas
invariantes se comprueban en `tests/unit/pulse-source.test.ts` y
`tests/unit/pulse-company-view.test.ts`. En el Advisor, los componentes del
precio suman el diferencial (`tests/unit/advisor-source.test.ts`).

Empresas de ejemplo: `/empresa/COMP_0001` (8 meses observados, 82 % de
confianza, dos variables de líneas sin datos, tres productos recomendados) y
`/empresa/COMP_0051` (24 meses y utilización de líneas conocida). Ambas están
fijadas en `src/lib/pulse/demo.ts`.

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
