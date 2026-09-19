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

test('opens the marketing landing without product chrome', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('navigation', { name: 'Dashboard' }),
  ).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' }),
  ).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Dashboard' })
    .getByRole('link', { name: 'PULSE', exact: true })
    .click();
  await expect(page).toHaveURL('/company/COMP_0001');
  expect(errors).toEqual([]);
});

test('lands on the demo company without browser errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/company/COMP_0001');
  await expect(page).toHaveURL('/company/COMP_0001');
  await expect(page).toHaveTitle(/Atresmedia Labs — PULSE/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Atresmedia Labs' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: /sobre la escala de bandas/ }),
  ).toBeVisible();
  await page.getByRole('img', { name: /PULSE mensual/ }).hover();
  await expect(
    page.getByRole('status').filter({ hasText: /\d,\d/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: /Contrata|Explica|Sube/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('diagnoses the company from the mosaic', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/company/COMP_0001');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await nav.getByRole('link', { name: 'Diagnóstico', exact: true }).click();
  await expect(page).toHaveURL('/company/COMP_0001/diagnosis');
  await expect(page).toHaveTitle(/Atresmedia Labs — Diagnóstico/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Dónde se decide' }),
  ).toBeVisible();
  await expect(
    nav.getByRole('link', { name: 'Diagnóstico', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  const cell = page.getByRole('button', { name: /Días de caja/ }).first();
  await cell.click();
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('link', { name: /Ver la variable/ }),
  ).toHaveAttribute('href', '/company/COMP_0001/variable/cash_days');
  await nav.getByRole('link', { name: 'Detalle', exact: true }).click();
  await expect(page).toHaveURL('/company/COMP_0001/detail');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Mes a mes' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('switches company from the navigation and stays on the section', async ({
  page,
}) => {
  await page.goto('/company/COMP_0001/recommendations');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await expect(
    page.getByRole('heading', { name: 'Aprobado con tu PULSE de hoy' }),
  ).toBeVisible();
  const detail = page.getByRole('button', { name: 'Ver detalle' }).first();
  await expect(detail).toHaveAttribute('aria-expanded', 'false');
  await detail.click();
  const why = page.getByRole('button', { name: 'Por qué encaja' }).first();
  await why.click();
  await expect(page.getByText('A favor').first()).toBeVisible();
  const search = nav.getByRole('combobox', { name: 'Empresa' });
  await expect(search).toHaveValue('Atresmedia Labs');
  await search.fill('a');
  const before = await page.getByRole('option').count();
  await page.getByRole('button', { name: /Cargar más/ }).click();
  expect(await page.getByRole('option').count()).toBeGreaterThan(before);
  await search.fill('atlassian glo');
  await page.getByRole('option', { name: 'Atlassian Global' }).click();
  await expect(page).toHaveURL('/company/COMP_0051/recommendations');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Atlassian Global' }),
  ).toBeVisible();
  await expect(search).toHaveValue('Atlassian Global');
});

test('keeps the company in the navigation across its pages', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/company/COMP_0001');
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  await nav.getByRole('link', { name: 'Financiación', exact: true }).click();
  await expect(page).toHaveURL('/company/COMP_0001/recommendations');
  await expect(nav.getByRole('combobox', { name: 'Empresa' })).toHaveValue(
    'Atresmedia Labs',
  );
  await nav.getByRole('link', { name: 'Método', exact: true }).click();
  await expect(page).toHaveURL('/method?company=COMP_0001');
  await expect(
    page.getByRole('heading', { level: 1, name: /Método|PULSE/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Qué mide Días de caja' }).hover();
  await expect(
    page.getByRole('dialog', { name: /Días de caja/ }),
  ).toContainText('Más alto, más sano');
  await nav.getByRole('link', { name: 'PULSE', exact: true }).click();
  await expect(page).toHaveURL('/company/COMP_0001');
  expect(errors).toEqual([]);
});

test('opens a variable from the mosaic and moves to the next one', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/company/COMP_0001/diagnosis');
  await page
    .getByRole('button', { name: /Días de caja/ })
    .first()
    .click();
  await page.getByRole('link', { name: /Ver la variable/ }).click();
  await expect(page).toHaveURL('/company/COMP_0001/variable/cash_days');
  await expect(page).toHaveTitle(/Días de caja · Atresmedia Labs/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Días de caja' }),
  ).toBeVisible();
  const others = page.getByRole('navigation', { name: 'Otras variables' });
  await expect(
    others.getByRole('link', { name: 'Días de caja' }),
  ).toHaveAttribute('aria-current', 'page');
  await others
    .getByRole('link', { name: 'Mínimo intramensual de caja' })
    .click();
  await expect(page).toHaveURL('/company/COMP_0001/variable/cash_min');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Mínimo intramensual de caja',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Volver al PULSE de/ }).click();
  await expect(page).toHaveURL('/company/COMP_0001');
  expect(errors).toEqual([]);
});

test('answers 404 for an unknown company', async ({ page }) => {
  const response = await page.goto('/company/COMP_9999');
  expect(response?.status()).toBe(404);
});

test('answers an unknown URL with a 404 that leads back to the product', async ({
  page,
}) => {
  // The browser logs the 404 of the document itself; only script errors count.
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/company/COMP_9999/nothing-here');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Página no encontrada · Embat Pulse');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Esta página no existe' }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Dashboard' })
    .getByRole('link', { name: 'PULSE', exact: true })
    .click();
  await expect(page).toHaveURL('/company/COMP_0001');
  expect(errors).toEqual([]);
});
