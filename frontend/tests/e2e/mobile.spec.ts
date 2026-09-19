import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('fits a phone: two-row navigation, no sideways scroll and stacked maps', async ({
  page,
}) => {
  await page.goto('/company/COMP_0001/diagnosis', { waitUntil: 'networkidle' });
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  const search = nav.getByRole('combobox', { name: 'Empresa' });
  const home = nav.getByRole('link', { name: 'Embat Pulse, inicio' });
  const method = nav.getByRole('link', { name: 'Método', exact: true });
  await expect(home).toBeVisible();
  await expect(search).toHaveValue('Atresmedia Labs');
  const rows = await page.evaluate(() => {
    const rect = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    return {
      home: rect('header a[aria-label="Embat Pulse, inicio"]'),
      search: rect('header input[role="combobox"]'),
      method: rect('header a[href^="/method"]'),
      fontSize: getComputedStyle(
        document.querySelector('header input[role="combobox"]')!,
      ).fontSize,
    };
  });
  expect(rows.search.y).toBeLessThan(rows.home.bottom);
  expect(rows.method.y).toBeGreaterThan(rows.search.bottom);
  expect(rows.method.height).toBeGreaterThanOrEqual(40);
  expect(rows.fontSize).toBe('16px');
  const scroll = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scroll.width).toBe(scroll.viewport);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Dónde se decide' }),
  ).toBeVisible();
  await expect(
    page.getByText('Calidad de cobro', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('¿Necesitas ayuda? Escríbeme')).toBeHidden();
  await search.fill('atlassian glo');
  await page.getByRole('option', { name: 'Atlassian Global' }).click();
  await expect(page).toHaveURL('/company/COMP_0051/diagnosis');
  await method.click();
  await expect(page).toHaveURL('/method?company=COMP_0051');
  await expect(
    page.getByRole('group', {
      name: 'Reparto de los 100 puntos entre pilares y variables',
    }),
  ).toHaveCount(1);
});
