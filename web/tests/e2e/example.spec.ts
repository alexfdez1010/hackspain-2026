import { test, expect } from '@playwright/test';

test('renders the HeroUI starter page', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle(/Next\.js \+ HeroUI template/);
  await expect(
    page.getByRole('heading', {
      name: 'Build the product on an intentional design system.',
    }),
  ).toBeVisible();
  await expect(page.getByText('HeroUI is the UI foundation')).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('exposes the official HeroUI documentation action', async ({ page }) => {
  await page.goto('/');

  const docsButton = page.getByRole('button', { name: 'Read HeroUI docs' });

  await expect(docsButton).toBeVisible();
});
