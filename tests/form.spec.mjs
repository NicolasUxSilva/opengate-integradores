import { test, expect } from '@playwright/test';

// Bloqueia a Meta e registra as chamadas de fbq; simula o Web3Forms conforme o cenário.
async function setup(page, { web3 } = {}) {
  await page.route(/connect\.facebook\.net|facebook\.com\/tr/, (r) => r.abort());
  await page.addInitScript(() => {
    window.__fbqCalls = [];
    window.fbq = (...a) => window.__fbqCalls.push(a);
  });
  const posts = [];
  await page.route('https://api.web3forms.com/submit', async (route) => {
    posts.push(route.request().postDataJSON());
    if (web3 === 'offline') return route.abort('internetdisconnected');
    if (web3 === 'http500') return route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"erro"}' });
    if (web3 === 'fail200') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false,"message":"invalid"}' });
    await new Promise((r) => setTimeout(r, 300));
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"message":"ok"}' });
  });
  return posts;
}
const events = (page) => page.evaluate(() => window.__fbqCalls.filter((c) => c[0] === 'track' || c[0] === 'trackCustom').map((c) => c[1]));
const submit = (page) => page.click('#partner-form button[type=submit]');

async function fill(page) {
  await page.fill('#nome', 'TESTE automatizado - nao contatar');
  await page.fill('#empresa', 'TESTE Empresa Ficticia');
  await page.locator('#whatsapp').pressSequentially('11912345678');
  await page.locator('label.option', { hasText: 'Sim' }).first().click();
}

test('PageView único com o Pixel correto, sem Lead no carregamento e sem erros', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const inits = await page.evaluate(() => window.__fbqCalls.filter((c) => c[0] === 'init').map((c) => c[1]));
  expect(inits).toEqual(['351480523756375']);
  expect(await events(page)).toEqual(['PageView']);
  expect(errors).toEqual([]);
});

test('formulário vazio: nenhum envio e nenhum Lead', async ({ page }) => {
  const posts = await setup(page, { web3: 'ok' });
  await page.goto('/');
  await submit(page);
  await page.waitForTimeout(500);
  expect(posts).toHaveLength(0);
  expect(await events(page)).toEqual(['PageView']);
});

test('WhatsApp ausente ou inválido: nenhum envio, nenhum Lead e aviso no campo', async ({ page }) => {
  const posts = await setup(page, { web3: 'ok' });
  await page.goto('/');
  await page.fill('#nome', 'TESTE automatizado - nao contatar');
  await page.fill('#empresa', 'TESTE Empresa Ficticia');
  await submit(page);
  await page.locator('#whatsapp').pressSequentially('1191234');
  await submit(page);
  await page.waitForTimeout(500);
  expect(posts).toHaveLength(0);
  expect(await events(page)).toEqual(['PageView']);
  await expect(page.locator('#whatsapp')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#whatsapp-hint')).toContainText('com DDD');
  expect(await page.locator('#whatsapp').evaluate((el) => el.validity.valid)).toBe(false);
});

test('máscara do WhatsApp aceita celular, fixo e número colado com +55', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  const input = page.locator('#whatsapp');
  for (const [typed, shown] of [['11912345678', '(11) 91234-5678'], ['1131234567', '(11) 3123-4567']]) {
    await input.fill('');
    await input.pressSequentially(typed);
    await expect(input).toHaveValue(shown);
    expect(await input.evaluate((el) => el.validity.valid)).toBe(true);
  }
  await input.fill('+55 11 91234-5678');
  await input.dispatchEvent('input');
  await expect(input).toHaveValue('(11) 91234-5678');
});

for (const mode of ['http500', 'fail200', 'offline']) {
  test(`envio com falha (${mode}): sem Lead e com contingência por e-mail`, async ({ page }) => {
    const posts = await setup(page, { web3: mode });
    await page.goto('/');
    await fill(page);
    await submit(page);
    await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'error');
    expect(posts).toHaveLength(1);
    expect(await events(page)).toEqual(['PageView']);
    await expect(page.locator('.form-status__action')).toHaveAttribute('href', /WhatsApp%20%2F%20telefone%3A%20%2811%29%2091234-5678/);
  });
}

test('envio confirmado: WhatsApp no e-mail e exatamente um Lead, mesmo com clique duplo', async ({ page }) => {
  const posts = await setup(page, { web3: 'ok' });
  await page.goto('/?utm_source=meta&utm_campaign=integradores');
  await fill(page);
  await page.locator('#partner-form button[type=submit]').dblclick();
  await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'success');
  await page.waitForTimeout(500);
  expect(posts).toHaveLength(1);
  expect(posts[0]['WhatsApp / telefone']).toBe('(11) 91234-5678');
  expect(posts[0]['Nome completo']).toBe('TESTE automatizado - nao contatar');
  expect(await events(page)).toEqual(['PageView', 'Lead']);
  const lead = await page.evaluate(() => window.__fbqCalls.find((c) => c[1] === 'Lead'));
  expect(lead[2]).toEqual({ content_name: 'Programa de Parceiros OpenGate', origem: 'direto' });
  expect(lead[3].eventID).toMatch(/^lead-/);
  // Nenhum dado do formulário vai ao Pixel
  expect(JSON.stringify(lead)).not.toContain('TESTE');
  expect(JSON.stringify(lead)).not.toContain('91234');
  await expect(page.locator('#whatsapp')).toHaveValue('');
});

test('vindo do diagnóstico: Lead com origem=diagnostico', async ({ page }) => {
  await setup(page, { web3: 'ok' });
  await page.goto('/?utm_source=meta&utm_content=criativo01&origem=diagnostico');
  await fill(page);
  await submit(page);
  await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'success');
  const lead = await page.evaluate(() => window.__fbqCalls.find((c) => c[1] === 'Lead'));
  expect(lead[2].origem).toBe('diagnostico');
});

test('formulário sem rolagem horizontal e campo de WhatsApp visível', async ({ page }) => {
  await setup(page);
  await page.goto('/#seja-parceiro');
  await expect(page.locator('#whatsapp')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
