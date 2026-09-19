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
  await expect(page).toHaveTitle(/Atresmedia Labs — PULSE/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Atresmedia Labs' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', {
      name: 'Score de cada variable en el último cierre',
    }),
  ).toBeVisible();
  await page.getByRole('img', { name: /PULSE mensual/ }).hover();
  await expect(page.getByRole('status')).toContainText(/\d,\d/);
  const info = page.getByRole('button', { name: 'Qué mide Días de caja' });
  await info.hover();
  await expect(
    page.getByRole('dialog', { name: /Días de caja/ }),
  ).toContainText('Caja a fin de mes');
  await page.getByRole('heading', { level: 2, name: 'Mapa de calor' }).hover();
  await expect(page.getByRole('dialog', { name: /Días de caja/ })).toBeHidden();
  await info.click();
  await expect(
    page.getByRole('dialog', { name: /Días de caja/ }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Días de caja/ })).toBeHidden();
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
  const why = page.getByRole('button', { name: 'Por qué encaja' }).first();
  await expect(why).toHaveAttribute('aria-expanded', 'false');
  await why.click();
  await expect(why).toHaveAttribute('aria-expanded', 'true');
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
  await nav.getByRole('link', { name: 'Recomendaciones', exact: true }).click();
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

test('answers 404 for an unknown company', async ({ page }) => {
  const response = await page.goto('/company/COMP_9999');
  expect(response?.status()).toBe(404);
});
