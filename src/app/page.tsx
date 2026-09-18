import { Card, Link } from '@heroui/react';

import { HomeActions } from '@/components/home-actions';

/**
 * Renders the HeroUI-enabled starter landing page.
 *
 * @returns The static home page with HeroUI actions and a compound card.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="flex max-w-3xl flex-col gap-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
            Next.js · React · HeroUI
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Build the product on an intentional design system.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            HeroUI v3 is installed and ready for accessible, composable UI.
            Complete <code>design.md</code> before adding product features.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <HomeActions />
            <Link
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Next.js docs
              <Link.Icon />
            </Link>
          </div>
        </header>

        <Card className="max-w-2xl" variant="tertiary">
          <Card.Header>
            <Card.Title>HeroUI is the UI foundation</Card.Title>
            <Card.Description>
              Use HeroUI components for controls, states, and interactive
              surfaces. Use Tailwind for layout and project-specific styling.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>Import components directly from @heroui/react.</li>
              <li>Keep product tokens and decisions in design.md.</li>
              <li>Run heroui:doctor after dependency or theme changes.</li>
            </ul>
          </Card.Content>
        </Card>
      </div>
    </main>
  );
}
