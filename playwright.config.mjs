// Testes de navegador do formulário e do Meta Pixel. Uso: npm run test:e2e
// Com LANDING_URL=https://..., roda contra a URL publicada (sem servidor local).
// Nenhum teste envia dados reais: o Web3Forms é simulado e o Pixel é bloqueado e registrado localmente.
import { devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 4174);
const baseURL = process.env.LANDING_URL || `http://localhost:${PORT}`;

export default {
  testDir: 'tests',
  reporter: [['list']],
  use: { baseURL },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.LANDING_URL
    ? undefined
    : { command: `node scripts/serve.mjs`, url: baseURL, env: { PORT: String(PORT) }, reuseExistingServer: false },
};
