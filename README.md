# Next.js Production-Ready Template

A **production-grade Next.js template** engineered with enterprise-level best practices, comprehensive testing infrastructure, and strict code quality standards. Built for teams that demand excellence in maintainability, scalability, and developer experience. This template is based in the practices used in [ZeroChats](https://github.com/zerochats).

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)](https://tailwindcss.com/)
[![HeroUI](https://img.shields.io/badge/HeroUI-v3-7c3aed)](https://heroui.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.7.0-2D3748)](https://www.prisma.io/)

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
- **[Prisma 6.7.0](https://www.prisma.io/)** - Type-safe database ORM

### Testing Infrastructure

- **[Vitest](https://vitest.dev/)** - Fast unit and integration testing
- **[Playwright](https://playwright.dev/)** - Reliable E2E testing across browsers
- **Comprehensive test setup** - Separate unit, integration, and E2E test suites
- **Docker-based test database** - Isolated test environment

### Code Quality Tools

- **[ESLint](https://eslint.org/)** - Next.js and TypeScript linting rules
- **[Prettier](https://prettier.io/)** - Consistent code formatting
- **Pre-commit hooks** - Automated testing and formatting before commits
- **Strict TypeScript** - Maximum type safety configuration

### Database & Infrastructure

- **PostgreSQL** - Production-ready relational database
- **Docker Compose** - Containerized development and test databases
- **Prisma migrations** - Version-controlled database schema
- **Environment management** - Secure configuration with `.env` files

## 📋 Prerequisites

- **Node.js** 22.22.0 or higher (required by the current HeroUI CLI)
- **Bun** 1.x or higher ([install](https://bun.sh/))
- **Docker** and **Docker Compose** (for database)
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

# Edit .env with your configuration
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/db"
```

### 3. Database Setup

```bash
# Start PostgreSQL container
bun run database

# Run migrations (in another terminal)
bun run database:dev

# Stop database when done
bun run database:down
```

### 4. Run Development Server

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
`.agents/skills/heroui-react` and registered in `skills-lock.json`. To refresh
it with the official source, run:

```bash
bunx skills add heroui-inc/heroui --skill heroui-react --yes
```

## 📜 Available Scripts

### Development

- **`bun run dev`** - Start development server with database
- **`bun run build`** - Build production bundle
- **`bun run start`** - Start production server
- **`bun run launch`** - Build and start with database

### Code Quality

- **`bun run lint`** - Run ESLint and Prisma formatting
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

### Database

- **`bun run database`** - Start PostgreSQL container
- **`bun run database:down`** - Stop database container
- **`bun run database:dev`** - Run migrations in development
- **`bun run database:deploy`** - Deploy migrations to production
- **`bun run database:studio`** - Open Prisma Studio
- **`bun run database:test`** - Start test database

## 🏗️ Project Structure

```
next-template/
├── src/
│   └── app/              # Next.js App Router pages
│       ├── layout.tsx    # Root layout
│       ├── page.tsx      # Home page
│       └── globals.css   # Global styles
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── setup.ts          # Test configuration
├── public/               # Static assets
├── generated/            # Generated Prisma client
├── .vscode/              # VS Code settings
├── compose.yml           # Development database
├── compose-test.yml      # Test database (ephemeral)
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

## 🗄️ Database Management

### Prisma Workflow

```bash
# Create a new migration
bun run database:dev

# Deploy migrations to production
bun run database:deploy

# Check migration status
bun run database:check

# Open Prisma Studio
bun run database:studio
```

### Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `bun run database:dev` to create migration
3. Test with `bun run database:test`
4. Commit schema and migration files

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
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
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 📄 Template Usage

This is a template repository. To use it:

1. Click "Use this template" on GitHub
2. Clone your new repository
3. Remove or modify this README as needed
4. Start building your application
