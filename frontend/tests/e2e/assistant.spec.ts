import { test, expect, type Page } from '@playwright/test';

/** Opens the actual mounted assistant through its accessible launcher. */
async function openAssistant(page: Page) {
  await page
    .getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Nexo, asistente de Pulse' }),
  ).toBeVisible();
}

test('streams a demo, preserves the conversation through navigation, and starts fresh', async ({
  page,
}) => {
  await page.goto('/company/COMP_0001');
  await openAssistant(page);
  await page.getByRole('button', { name: /Resume esta empresa/ }).click();
  await expect(
    page.getByRole('button', { name: 'Detener respuesta' }),
  ).toBeVisible();
  await expect(page.getByRole('log')).toContainText(
    'Revisa los pilares y las variables',
  );
  await expect(
    page.getByRole('button', { name: 'Detener respuesta' }),
  ).toBeHidden();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Recomendaciones' })
    .click();
  await expect(page).toHaveURL('/company/COMP_0001/recommendations');
  await openAssistant(page);
  await expect(page.getByRole('log')).toContainText('Domino’s · PULSE');
  await expect(page.getByRole('dialog')).toContainText(
    'Viendo: Recomendaciones · Domino’s',
  );
  await page.getByRole('button', { name: 'Nueva conversación' }).click();
  await expect(
    page.getByRole('heading', { name: 'Hola, soy Nexo.' }),
  ).toBeVisible();
});

test('supports keyboard send, multiline drafts, stopping and regeneration', async ({
  page,
}) => {
  await page.goto('/');
  await openAssistant(page);
  const input = page.getByRole('textbox', { name: 'Tu pregunta para Nexo' });
  await expect(
    page.getByRole('button', { name: 'Enviar pregunta' }),
  ).toBeDisabled();
  await input.fill('Qué es');
  await input.press('Shift+Enter');
  await input.press('i');
  await input.press('a');
  await expect(input).toHaveValue('Qué es\nia');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Detener respuesta' }).click();
  await expect(page.getByText('Respuesta detenida.')).toBeVisible();
  await page.getByRole('button', { name: 'Volver a generar' }).click();
  await expect(page.getByRole('log')).toContainText('modelo de lenguaje');
  await expect(
    page.getByRole('button', { name: 'Detener respuesta' }),
  ).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Abrir Nexo, asistente de Pulse' }),
  ).toBeFocused();
});

test('retries a network failure without losing or duplicating the question', async ({
  page,
}) => {
  await page.goto('/');
  await openAssistant(page);
  await page.route(
    '**/api/assistant',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"error":"Unavailable"}',
      }),
    { times: 1 },
  );
  await page
    .getByRole('textbox', { name: 'Tu pregunta para Nexo' })
    .fill('Explícame el score');
  await page.getByRole('button', { name: 'Enviar pregunta' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'No he podido responder',
  );
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('log')).toContainText(
    'No es una probabilidad de impago',
  );
  await expect(
    page.getByRole('log').getByText('Explícame el score', { exact: false }),
  ).toHaveCount(1);
});

test('fits mobile, respects reduced motion, and keeps the composer reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  await openAssistant(page);
  const dialog = page.getByRole('dialog');
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(box!.height).toBeLessThanOrEqual(844);
  await expect(
    page.getByRole('button', { name: /Cómo puede ayudarme la IA/ }),
  ).toBeInViewport({ ratio: 1 });
  await expect(
    page.getByRole('textbox', { name: 'Tu pregunta para Nexo' }),
  ).toBeInViewport();
  const animations = await dialog
    .locator('.nexo-float')
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationName),
    );
  expect(animations.every((value) => value === 'none')).toBe(true);
  await page.screenshot({
    path: 'test-results/nexo-mobile-dark.png',
    animations: 'disabled',
  });
});

test('fits a short desktop viewport and traps focus in the dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await openAssistant(page);
  await expect(
    page.getByRole('button', { name: /Cómo puede ayudarme la IA/ }),
  ).toBeInViewport({ ratio: 1 });
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page
        .getByRole('dialog')
        .evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.screenshot({
    path: 'test-results/nexo-desktop.png',
    animations: 'disabled',
  });
});

test('uses the current company page in the request and answers about its products', async ({
  page,
}) => {
  await page.goto('/company/COMP_0001/recommendations');
  await openAssistant(page);
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/api/assistant'),
  );
  await page
    .getByRole('button', { name: /Qué productos me recomiendas/ })
    .click();
  expect((await request).postDataJSON().pathname).toBe(
    '/company/COMP_0001/recommendations',
  );
  await expect(page.getByRole('log')).toContainText('productos recomendados');
  await expect(page.getByRole('log')).toContainText('Línea de crédito');
});
