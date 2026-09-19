import { test, expect } from '@playwright/test';

test('renders the portfolio and Nexo without browser errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle(/Embat Pulse/);
  await expect(
    page.getByRole('heading', { name: 'Radar de cartera' }),
  ).toBeVisible();
  await expect(
    page.getByRole('grid', { name: 'Cartera puntuada' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
