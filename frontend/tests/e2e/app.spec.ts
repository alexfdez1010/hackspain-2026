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

test('opens a company from the entry page without browser errors', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/Embat Pulse/);
  await expect(
    page.getByRole('heading', { name: 'Tu empresa, mes a mes' }),
  ).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page
    .getByRole('main')
    .getByRole('link', { name: 'COMP_0001', exact: true })
    .click();
  await expect(page).toHaveURL('/empresa/COMP_0001');
  await expect(
    page.getByRole('heading', { level: 1, name: 'COMP_0001' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('finds a company by typing its identifier', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('combobox', {
    name: 'Identificador de la empresa',
  });
  await input.fill('COMP_0051');
  await page.getByRole('option', { name: 'COMP_0051' }).click();
  await expect(page).toHaveURL('/empresa/COMP_0051');
});

test('keeps the company in the navigation across its pages', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/empresa/COMP_0001');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await nav.getByRole('link', { name: 'Recomendaciones', exact: true }).click();
  await expect(page).toHaveURL('/empresa/COMP_0001/recomendaciones');
  await expect(
    nav.getByRole('link', { name: 'COMP_0001', exact: true }),
  ).toBeVisible();
  await nav.getByRole('link', { name: 'Método', exact: true }).click();
  await expect(page).toHaveURL('/metodo?empresa=COMP_0001');
  await expect(
    page.getByRole('heading', { level: 1, name: /Método|PULSE/ }),
  ).toBeVisible();
  await nav.getByRole('link', { name: 'PULSE', exact: true }).click();
  await expect(page).toHaveURL('/empresa/COMP_0001');
  expect(errors).toEqual([]);
});

test('redirects the legacy routes and answers 404 for an unknown company', async ({
  page,
}) => {
  await page.goto('/pulse/COMP_0001');
  await expect(page).toHaveURL('/empresa/COMP_0001');
  const response = await page.goto('/empresa/COMP_9999');
  expect(response?.status()).toBe(404);
});
