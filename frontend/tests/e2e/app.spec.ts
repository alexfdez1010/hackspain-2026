import { test, expect } from '@playwright/test';

/** Collects page and console errors so a hydration failure fails the test. */
function trackErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('lands on the demo company without browser errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page).toHaveURL('/company/COMP_0001');
  await expect(page).toHaveTitle(/Domino’s — PULSE/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Domino’s' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', {
      name: 'Score de cada variable en el último cierre',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('switches company from the navigation and stays on the section', async ({
  page,
}) => {
  await page.goto('/company/COMP_0001/recommendations');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await nav.getByRole('button', { name: /Domino’s/ }).click();
  await page.getByRole('option', { name: /COMP_0051/ }).click();
  await expect(page).toHaveURL('/company/COMP_0051/recommendations');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Schneider Electric' }),
  ).toBeVisible();
  await expect(
    nav.getByRole('button', { name: /Schneider Electric/ }),
  ).toBeVisible();
});

test('keeps the company in the navigation across its pages', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/company/COMP_0001');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await nav.getByRole('link', { name: 'Recomendaciones', exact: true }).click();
  await expect(page).toHaveURL('/company/COMP_0001/recommendations');
  await expect(nav.getByRole('button', { name: /Domino’s/ })).toBeVisible();
  await nav.getByRole('link', { name: 'Método', exact: true }).click();
  await expect(page).toHaveURL('/method?company=COMP_0001');
  await expect(
    page.getByRole('heading', { level: 1, name: /Método|PULSE/ }),
  ).toBeVisible();
  await nav.getByRole('link', { name: 'PULSE', exact: true }).click();
  await expect(page).toHaveURL('/company/COMP_0001');
  expect(errors).toEqual([]);
});

test('answers 404 for an unknown company', async ({ page }) => {
  const response = await page.goto('/company/COMP_9999');
  expect(response?.status()).toBe(404);
});
