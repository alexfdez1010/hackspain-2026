# Embat Pulse · web app

Next.js application of the HackSpain 2026 monorepo (Embat challenge). It is a
single-company product: every screen shows the PULSE of the company that is
open, never a portfolio view.

There is no database and no backend at runtime. The app reads the JSON export
bundled under `src/data/pulse/`, produced by the Python pipeline in
[`../backend`](../backend), so it builds and serves itself with nothing else
running.

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)](https://tailwindcss.com/)
[![HeroUI](https://img.shields.io/badge/HeroUI-v3-7c3aed)](https://heroui.com/)

## 🩻 The product

| Route                           | What it shows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                             | Landing: hero with the product access, the pages of the product with the PULSE trajectory played by score level, and a heatmap footer. The company is changed from the header picker, which keeps the open section.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/company/[id]`                 | Summary: the close's score on the band rule, its change, confidence, customer health (the payment health of its customers weighted by invoicing, out of 100) and cash days; the signal alert; the trajectory with the +1..+6 m forecast and its p10–p90 band; "What to do now" (up to three actions written by the model).                                                                                                                                                                                                                                                                                                   |
| `/company/[id]/diagnosis`       | Diagnosis: mosaic of the 11 variables by pillar (width = pillar weight, height = variable weight, each cell washed with its band colour); the chosen variable opens its detail inside its own cell and its column widens, and the evolution of the four pillars.                                                                                                                                                                                                                                                                                                                                                             |
| `/company/[id]/action`          | Action: the three variables where the company has the most PULSE points to gain, ranked by `weight · (100 − score) / known weight`, each with the plan that would collect them.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/company/[id]/action/[key]`    | The plan of one variable in one panel: the real value, score, points at stake, cost and horizon, why that variable holds the points, and the three moves.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/company/[id]/detail`          | Detail: any close opened in full (pillars and contributions), the forecast broken down by horizon, the month-by-month tables (observed and forecast) and a worked example of how one variable's value becomes PULSE points.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/company/[id]/variable/[key]`  | One PULSE variable of the company: score, value and contribution of the last close, history statistics, month-by-month score against the pillar and against PULSE, observed value, points gained, position against the rest, weight in the forecast, the variable's own detail (customer ranking by payment health, suppliers by DPO and term, credit lines, debt and maturities, receivables aging, daily cash) and the month table. Opened from the chosen cell of the Diagnosis mosaic.                                                                                                                                   |
| `/company/[id]/signals`         | Alerts: open alerts (episodes without three months of follow-up, with the probability that they last) and the history of closed episodes with what they turned out to be (dip or fall, rebound or improvement), counters of confirmed falls and improvements and of hits at opening time. The PULSE page shows the most recent signal of the last six months as an alert and marks every signal with a triangle on the trajectory.                                                                                                                                                                                           |
| `/company/[id]/recommendations` | Financing: "Si necesitas financiación" with the approved products one per row (amount, rate, fit, a "Solicitar propuesta" button that confirms the request in a dialog, and their argument folded into "Ver detalle"), the navy lever block ("Con el pilar de X en Y en vez de Z, tu prima de riesgo baja N puntos básicos" with the stress probability, the fit count and the best rate), then "Fuera de alcance hoy" with the rule that leaves each product out and the disclaimer, and "Más detalle" with the improvement plan, risk and inputs used, all folded. The free operational measure lives on the Action pages. |
| `/method?company=[id]`          | Method: how the month's PULSE is computed in plain words (scale, 100 points, four steps, confidence and one real month added by hand); forecast, signals, pricing and limits in four sentences.                                                                                                                                                                                                                                                                                                                                                                                                                              |

Every product route streams a `loading.tsx` (the `PageSkeleton`, under
`company/[id]` and `method`) while its data is read, so a slow navigation shows
the shape of the page at once instead of a frozen screen; the `company/[id]`
layout answers 404 for an unknown company before that boundary flushes.

Companies and groups in the export are anonymous (`COMP_0001`, `GROUP_0147`).
The interface shows them under the name of a well-known company or group picked
by a deterministic hash of the identifier (`src/lib/company/names.ts`,
catalogues in `src/lib/company/catalogues.ts`): the same identifier always gives
the same name, two identifiers may share one, and the real identifier stays
visible in the routes, in the picker and in the intro of every page.

### Run the demo

```bash
bun run dev
```

### Nexo, the Pulse assistant

A mascot in a suit, with animated expressions and a global chat reachable from
the floating button or `Ctrl/Cmd+J`. It works with no key through simulated
answers, with streaming, page context, cancellation, retry and links to the
original data. The conversation stays in memory while navigating and is dropped
on reload.

Nexo is an agent: it has seven read-only tools over the company of the
conversation (history, month, forecast, alerts, financing, variable and
counterparty detail) plus `show_chart`, which draws interactive charts inside
the chat with the real numbers of the export: trajectory with forecast and
signals, pillars, the eleven variables, points gained and lost, one variable
month by month, variable comparison, forecast drivers, daily cash and rankings
of customers, suppliers, late payers, lines or debt. The model picks the chart
and comments on the reading; the numbers come from the server. Ask it "Dibuja la
trayectoria del PULSE", "¿Qué variables restan más puntos?" or "Compara días de
caja y DSO, y un ranking de morosidad".

To connect the Vercel AI Gateway, set `AI_GATEWAY_API_KEY` in `.env` (or
`.env.local`) and restart Next.js; the server reads it at start-up and the SDK
takes it from the environment. The model is pinned as `ASSISTANT_MODEL =
'google/gemini-3.8-flash'` in `src/lib/assistant/config.ts`, with low reasoning
and 10,000 output tokens so the answer arrives complete. It is not configurable
from the browser. `ASSISTANT_MODE=mock` forces the demo; `ASSISTANT_MODE=gateway`
requires a key and returns a clear error when it is missing. The key is never
sent to the client.

The frontend owns `POST /api/assistant` and `GET /api/actions/[id]`; these are
its only route handlers. The assistant route accepts
`{ messages: UIMessage[], pathname: string }` and answers SSE with the AI SDK 7
UI Message Stream protocol, tool parts (`tool-*`) included. It accepts text and,
in previous assistant answers, finished tool parts of the eight known tools;
roles `user`/`assistant`, up to 20 messages, 32 parts per message, 2,000
characters per question and 256 KiB per request. The browser transport limits
the history to the last 20 messages. The answer carries metadata
`{ mode: 'mock' | 'gateway', sources: { label, href }[] }`. Errors before the
stream: JSON `{ error: string }`, status codes 400/403/413/415/503; model errors
during the stream: SDK `error` event with a safe message. The context comes from
the existing data adapters, never from HTML sent by the client. Invocation
example and full contract in [the Nexo documentation](docs/nexo.md).

References: [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/getting-started),
[AI SDK Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot),
[Gemini 3.8 Flash](https://vercel.com/ai-gateway/models/gemini-3.8-flash).

### What to do now (actions)

Every company page opens with the navy "Qué hacer ahora" block: at most three
actions, from the highest impact down, written by the same Gateway model as Nexo
(`ASSISTANT_MODEL`) with typed output (`Output.object`) and a 30 s deadline. The
first action is the page headline; the other two sit below a rule, and each one
links to the page where it is carried out or checked.

The model only receives that company's figures — score, pillars, weak and
missing variables, open signal, forecast, six-month stress, cash, offers with
their lever and the declined ones; never the portfolio. The destinations it
writes are validated against the known routes: anything else falls back to the
recommendations page. Actions arrive through `GET /api/actions/[id]` and the
browser stores the model's answer in `localStorage` per company and close, so
coming back to the company — today or tomorrow — does not pay tokens again; the
server also adds a one-hour memo per company. With `ASSISTANT_MODE=mock`, if the
model fails or returns nothing usable, the block writes the deterministic
actions from the same figures and is marked with the `DEMO` tag. Contract and
response example in [the actions documentation](docs/actions.md).

### 🗄️ Data source

Two layers share the same shape — one interface, one static implementation
reading the bundled JSON — behind a memoised factory:

- **PULSE** (`src/lib/pulse/data.ts`, interface `PulseDataSource`):
  `StaticPulseSource` reads `summary.json`, `companies/<id>.json` and the
  per-variable detail in `details/<id>.json` (types in
  `src/lib/pulse/details/types.ts`).
- **Advisor** (`src/lib/advisor/data.ts`, interface `AdvisorDataSource`):
  `StaticAdvisorSource` reads `recommendations/catalogue.json` and
  `recommendations/companies/<id>.json`.

File layout under `src/data/pulse/`:

```
src/data/pulse/
├── summary.json                        # score metadata, weights and one row per company
├── companies/<id>.json                 # 1,285 files: monthly history and forecast
├── details/<id>.json                   # 1,285 files: per-variable detail of the last month
└── recommendations/
    ├── catalogue.json                  # products, pricing constants and risk model
    └── companies/<id>.json             # 1,285 files: the Advisor proposal per company
```

Regenerate the whole export from the backend, which runs cleaning, the PULSE
score, the six-month forecast, the signals and the Advisor in one command:

```bash
cd ../backend
uv run pulse --out ../frontend/src/data/pulse
```

(`uv run pulse` with no `--out` writes to `backend/data/pulse/export/`.)

Consumed contract. The backend owns it and
[`../backend/docs/json-contract.md`](../backend/docs/json-contract.md) documents every field; this table
is only the mirror kept in the consumer:

| File                                  | Expected content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `summary.json`                        | `score_name`, `score_expansion`, `horizons`, `last_month`, `pillars[{key,label,weight}]`, `variables[{key,number,label,pillar,weight,raw,unit}]`, `contribution_keys`, `evaluation{score,forecast{horizons},risk,signals{anticipation{horizons},persistence}}`, `companies[...]`.                                                                                                                                                                                                                                                                                                                |
| `companies/<id>.json`                 | The company with `series[]` (per month: `pulse`, `confidence`, `pillars`, `variables`, `contributions`, `cash_end`), `forecast[]` (`horizon`, `target_month`, `pulse_pred`, `pulse_p10`, `pulse_p90`, `delta_raw`, `contributions`) and `signals[]` (per episode: `month`, `kind` `caida \| bache \| mejora \| repunte`, `direction`, `level`, `baseline`, `move`, `breadth`, `confidence`, `pillar_deltas`, `drivers[]`, `p_persistent`, `outcome` `persistente \| transitorio \| null`, `headline`, `detail`; parser in `src/lib/pulse/parse-signals.ts`). The app keeps only horizons +1..+6. |
| `details/<id>.json`                   | `company_id`, `month` and `variables{...}` with one block per variable: lists capped at 8 (`accounts`, `lines`, `suppliers`, `customers`, `debtors`, `products`), `daily[]` (62 days), `aging[]` (5 buckets) and `months[]` (12 months) with the columns documented in the backend README. Blocks are always present, empty when there is no data.                                                                                                                                                                                                                                               |
| `recommendations/catalogue.json`      | `reference_rate`, `pricing_parameters`, `products[]`, `risk_model`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `recommendations/companies/<id>.json` | `summary`, `risk`, `recommendations[]` (with `reasons`, `sizing`, `pricing`, `levers`), `declined[]`, `improvement_plan`, `inputs`, `disclaimer`.                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Files are parsed by tolerant parsers: unknown keys are ignored, missing ones
stay `null` and an unreadable file degrades the page to its empty state. A
variable with no evidence arrives with `known: false` and is shown as "sin
datos", never as a zero. Weights add up to 100 points and the contributions of
every horizon add up exactly to `delta`; both invariants are checked in
`tests/unit/pulse-source.test.ts` and `tests/unit/pulse-company-view.test.ts`.
In the Advisor, the price components add up to the spread
(`tests/unit/advisor-source.test.ts`).

Example companies: `/company/COMP_0001` ("Atresmedia Labs": 8 months observed,
82 % confidence, two credit-line variables with no data, three recommended
products) and `/company/COMP_0051` ("Atlassian Global": 24 months and known line
utilisation). Both are pinned in `src/lib/pulse/demo.ts`.

### Environment variables

None is required: without any key the app serves the bundled JSON and Nexo runs
its deterministic demo.

| Variable             | Required | Description                                                                                                   |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `AI_GATEWAY_API_KEY` | No       | Vercel AI Gateway key used by Nexo and by "What to do now". Server-only; never prefix `NEXT_PUBLIC_`.         |
| `ASSISTANT_MODE`     | No       | `mock` forces the deterministic demo even with a key; `gateway` requires a key and fails clearly without one. |

## 🎯 Philosophy

This application follows **professional software engineering principles** with a
focus on:

- **SOLID Principles** - Applied rigorously across all code
- **Design Pattern Driven** - Appropriate patterns for maintainability and scalability
- **Documentation First** - Comprehensive TSDoc/JSDoc for all functions, classes, and hooks
- **Testing as Priority** - Unit, integration, and E2E tests with meaningful coverage
- **Code Quality** - Strict linting, formatting, and file size limits (200 lines max)
- **Type Safety** - Full TypeScript strict mode enforcement

See [AGENTS.md](./AGENTS.md) for complete development guidelines and principles
that are used to guide AI Agents.

## ✨ Stack

### Core

- **[Next.js 16](https://nextjs.org/docs)** - React framework with App Router
- **[React 19](https://react.dev/)** - Server Components
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Strict type safety
- **[TailwindCSS 4.x](https://tailwindcss.com/)** - Utility-first CSS framework
- **[HeroUI v3](https://heroui.com/en/docs/react/components)** - Accessible React components built on React Aria and Tailwind CSS 4
- **[AI SDK 7](https://ai-sdk.dev/)** - Streaming and tool calling for Nexo

### Testing

- **[Vitest](https://vitest.dev/)** - Fast unit and integration testing
- **[Playwright](https://playwright.dev/)** - Reliable E2E testing across browsers
- **Comprehensive test setup** - Separate unit, integration, and E2E test suites

### Code quality

- **[ESLint](https://eslint.org/)** - Next.js and TypeScript linting rules
- **[Prettier](https://prettier.io/)** - Consistent code formatting
- **Pre-commit script** - Automated testing and formatting before commits
- **Strict TypeScript** - Maximum type safety configuration

### Infrastructure

- **Environment management** - Configuration with `.env` files
- **Dockerfile** - Multi-stage standalone image; the image bakes in the JSON
  export, so the container serves the product with no other service. Started
  from the root `compose.yml` with `make up`.

## 📋 Prerequisites

- **Node.js** 22.22.0 or higher (required by the current HeroUI CLI)
- **Bun** 1.x or higher ([install](https://bun.sh/))
- **Git** for version control

## 🚀 Getting Started

### 1. Install

```bash
cd frontend
bun install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Everything works without editing it; add `AI_GATEWAY_API_KEY` only to run Nexo
and the actions against a real model.

### 3. Run the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🎨 HeroUI and design system

The app uses HeroUI v3 as its UI component library. It does not use shadcn/ui
and does not require a provider. Read [`design.md`](./design.md) before
implementing product features; it defines the visual language, semantic tokens,
approved component variants, accessibility requirements, and layout decisions
for the project.

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

Do not run `heroui init` in this checkout: it would replace the current
application structure. The official references are
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

The official React agent skill is installed at `../.agents/skills/heroui-react`
(repository root) and registered in `../skills-lock.json`. To refresh it with
the official source, run:

```bash
bunx skills add heroui-inc/heroui --skill heroui-react --yes
```

### Tables sorted by column

Every data table is built with `DataTable`
(`src/components/ui/data-table.tsx`), a wrapper around the HeroUI `Table` that
sorts by any column when its header is pressed, in both directions. Columns are
declared as data: id, header, cell and, when the column is sortable, a `sortBy`
returning the value to compare (`number | string | null`). A row with no value
(`null`) always stays last, in either direction, so "no data" never looks like
the best or the worst figure. `defaultSort` fixes the order the table opens
with, and the header shows it.

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

Sorting is pure (`sortRows` in `src/lib/table/sort.ts`, with Spanish collation)
and happens on the client over rows already computed on the server; the
component never reaches the data source. The four product tables (month by
month, forecast, variables and the method example) use it.

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
│   ├── app/              # Next.js App Router pages and route handlers
│   ├── components/       # UI, layout, PULSE and assistant components
│   ├── lib/              # Data layer, parsers, formatting and domain logic
│   └── data/pulse/       # JSON export consumed by the app (generated)
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── setup.ts          # Test configuration
├── docs/                 # Nexo and actions contracts
├── public/               # Static assets
├── Dockerfile            # Production image (standalone Next.js)
├── eslint.config.mjs     # ESLint configuration
├── playwright.config.ts  # Playwright configuration
├── vitest.config.ts      # Vitest configuration
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment template
└── AGENTS.md             # AI Agents development guidelines
```

## 🧪 Testing Strategy

### Unit Tests

Located in `tests/unit/`, these test individual functions and components in isolation.

```bash
bun run test:unit
```

### Integration Tests

Located in `tests/integration/`, these test module interactions and route handlers.

```bash
bun run test:integration
```

### End-to-End Tests

Located in `tests/e2e/`, these test complete user flows across browsers.

```bash
bun run test:e2e
```

## 🚢 Deployment

### Build and run

```bash
# Build production bundle
bun run build

# Run production server
bun run start
```

### Docker

The multi-stage `Dockerfile` produces a standalone Next.js image and copies
`src/data` into it, so the container serves the bundled JSON export with no
other service. From the repository root:

```bash
make up
```

No environment variable is required. `AI_GATEWAY_API_KEY` is read from
`frontend/.env` by the root `compose.yml` when present.

## 🔧 Configuration Files

- **`tsconfig.json`** - TypeScript strict mode, path aliases
- **`eslint.config.mjs`** - Next.js and TypeScript rules
- **`.prettierrc`** - Single quotes, trailing commas, 2-space tabs
- **`vitest.config.ts`** - Node environment, 10s timeout
- **`playwright.config.ts`** - Multi-browser E2E testing

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 🖼️ Social image

`src/app/opengraph-image.jpg` is the Open Graph image shared by the routes of
the application (1200 × 630). It shows Embat Pulse, the header icon and Nexo.
It was generated with ImageGen using the former pulse icon (now replaced by the wordmark favicon in `src/app/icon.svg`) and
`public/mascot/nexo-suit.png` as identity references. Its alternative text lives
in `src/app/opengraph-image.alt.txt`.

Decision (2026-09-19): keeping the artwork as a static asset separates the
visual identity from the components and avoids rendering images on every
request.

Next.js publishes the image and its metadata automatically through its
[social image convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image).
To see it locally, start the application with `bun run dev` and open
`http://localhost:3000/opengraph-image.jpg`. Twitter/X cards inherit this image
from Open Graph too.
