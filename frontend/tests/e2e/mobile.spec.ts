import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('fits a phone: one-row bar, a menu drawer, no sideways scroll and stacked maps', async ({
  page,
}) => {
  await page.goto('/company/COMP_0001/diagnosis', { waitUntil: 'networkidle' });
  const nav = page.getByRole('navigation', { name: 'Secciones' });
  const home = nav.getByRole('link', { name: 'Embat Pulse, inicio' });
  const menu = nav.getByRole('button', { name: 'Abrir menú' });
  await expect(home).toBeVisible();
  await expect(menu).toBeVisible();
  await expect(nav.getByRole('combobox', { name: 'Empresa' })).toBeHidden();
  await expect(
    nav.getByRole('link', { name: 'Método', exact: true }),
  ).toBeHidden();
  const bar = await page.evaluate(() => {
    const rect = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    return {
      home: rect('header a[aria-label="Embat Pulse, inicio"]'),
      menu: rect('header button[aria-label="Abrir menú"]'),
      header: rect('header'),
    };
  });
  expect(bar.menu.y).toBeLessThan(bar.home.bottom);
  expect(bar.menu.height).toBeGreaterThanOrEqual(44);
  expect(bar.header.height).toBeLessThan(72);
  const scroll = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scroll.width).toBe(scroll.viewport);

  await menu.click();
  const drawer = page.getByRole('dialog', { name: 'Menú de secciones' });
  await expect(drawer).toBeVisible();
  const search = drawer.getByRole('combobox', { name: 'Empresa' });
  const method = drawer.getByRole('link', { name: 'Método', exact: true });
  await expect(search).toHaveValue('Atresmedia Labs');
  await expect(
    drawer.getByRole('link', { name: 'Diagnóstico', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  const targets = await page.evaluate(() => ({
    method: document
      .querySelector('[role="dialog"] a[href^="/method"]')!
      .getBoundingClientRect().height,
    fontSize: getComputedStyle(
      document.querySelector('[role="dialog"] input[role="combobox"]')!,
    ).fontSize,
  }));
  expect(targets.method).toBeGreaterThanOrEqual(48);
  expect(targets.fontSize).toBe('16px');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  await expect(
    page.getByRole('heading', { level: 2, name: 'Dónde se decide' }),
  ).toBeVisible();
  await expect(
    page.getByText('Calidad de cobro', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('¿Necesitas ayuda? Escríbeme')).toBeHidden();

  await menu.click();
  await search.fill('atlassian glo');
  await page.getByRole('option', { name: 'Atlassian Global' }).click();
  await expect(page).toHaveURL('/company/COMP_0051/diagnosis');
  await expect(drawer).toBeHidden();
  await menu.click();
  await method.click();
  await expect(page).toHaveURL('/method?company=COMP_0051');
  await expect(drawer).toBeHidden();
  await expect(
    page.getByRole('group', {
      name: 'Reparto de los 100 puntos entre pilares y variables',
    }),
  ).toHaveCount(1);
});
