import { test, expect } from '@playwright/test';

// Carrega o fbevents.js real, mas intercepta e descarta os envios para facebook.com/tr:
// conta quantos PageView o Pixel tentaria enviar, sem que nada chegue à Meta.
test('cliques em âncoras (#seja-parceiro) não geram PageView extra', async ({ page }) => {
  const sent = [];
  await page.route(/facebook\.com\/tr/, (route) => {
    sent.push(new URL(route.request().url()).searchParams.get('ev'));
    return route.abort();
  });
  await page.goto('/');
  await expect.poll(() => sent.filter((e) => e === 'PageView').length, { timeout: 15000 }).toBe(1);
  for (const sel of ['[data-cta="header"]', '[data-cta="hero"]']) {
    await page.locator(sel).first().click();
    await page.waitForTimeout(1200);
  }
  await page.goBack();
  await page.waitForTimeout(1200);
  expect(sent.filter((e) => e === 'PageView')).toHaveLength(1);
});
