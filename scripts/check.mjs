// Verificação rápida: arquivos locais referenciados existem, âncoras e ícones resolvem,
// todo link tem destino, o JS tem sintaxe válida e o cálculo da calculadora confere
// com cenários feitos à mão. Uso: npm run check
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateEarnings, formatBRL } from '../js/calculator.js';
import { CALCULATOR_CONFIG } from '../js/calculator-config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const errors = [];

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const dupes = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, all) => all.indexOf(id) !== i);
dupes.forEach((id) => errors.push(`id duplicado: ${id}`));

for (const [, attr, value] of html.matchAll(/\s(src|href)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|tel:)/.test(value)) continue;
  if (value.startsWith('#')) {
    if (!ids.has(value.slice(1))) errors.push(`${attr}="${value}" aponta para id inexistente`);
    continue;
  }
  if (!existsSync(resolve(ROOT, value))) errors.push(`${attr}="${value}" não encontrado`);
}

for (const [tag] of html.matchAll(/<a\s[^>]*>/g)) {
  if (!/\shref="[^"]+"/.test(tag)) errors.push(`link sem destino: ${tag}`);
}

const jsFiles = ['js/main.js', 'js/calculator.js', 'js/calculator-config.js', 'js/calculator-ui.js', 'scripts/serve.mjs'];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', resolve(ROOT, file)], { stdio: 'pipe' });
  } catch (err) {
    errors.push(`sintaxe inválida em ${file}: ${err.stderr}`);
  }
}

const css = ['css/tokens.css', 'css/base.css', 'css/sections.css', 'css/calculator.css', 'css/form.css'];
for (const file of css) {
  const src = readFileSync(resolve(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const open = (src.match(/{/g) || []).length;
  const close = (src.match(/}/g) || []).length;
  if (open !== close) errors.push(`chaves desbalanceadas em ${file} (${open} { / ${close} })`);
}

// ---------- Calculadora ----------
// Premissas fixas para os cenários (independem de futuras edições na config).
const SCENARIO_CONFIG = {
  months: 12,
  assumptions: { deploymentsPerUnit: 1, devicesPerUnit: 1, recurrenceStartsInInstallMonth: true, monthlyChurnRate: 0 },
};
const scenarios = [
  // v=1, I=600, P=380, c=30: 1×600×12 = 7.200; 12×380 = 4.560; 30×1×(12×13/2) = 2.340
  { input: [1, 600, 380, 30], expect: { installEarnings: 7200, deploymentEarnings: 4560, recurringEarnings: 2340, total: 14100, endActiveDevices: 12, endMonthlyRecurring: 360 } },
  // v=3: 3×600×12 = 21.600; 36×380 = 13.680; 30×3×78 = 7.020
  { input: [3, 600, 380, 30], expect: { installEarnings: 21600, deploymentEarnings: 13680, recurringEarnings: 7020, total: 42300, endActiveDevices: 36, endMonthlyRecurring: 1080 } },
  // Máximos dos sliders: 30×1500×12 = 540.000; 360×1000 = 360.000; 100×30×78 = 234.000
  { input: [30, 1500, 1000, 100], expect: { total: 1134000, endMonthlyRecurring: 36000 } },
  // Mínimos: 1 instalação/mês e valores zerados
  { input: [1, 0, 0, 0], expect: { total: 0, endActiveDevices: 12 } },
];
for (const { input: [unitsPerMonth, installFee, deploymentFee, recurringFee], expect } of scenarios) {
  const r = calculateEarnings({ unitsPerMonth, installFee, deploymentFee, recurringFee }, SCENARIO_CONFIG);
  for (const [key, value] of Object.entries(expect)) {
    if (r[key] !== value) errors.push(`calculadora v=${unitsPerMonth}: ${key} = ${r[key]}, esperado ${value}`);
  }
  // Recorrência acumulada = c × v × n(n+1)/2 (ativação no mês, sem cancelamento)
  const closedForm = recurringFee * unitsPerMonth * (12 * 13) / 2;
  if (r.recurringEarnings !== closedForm) errors.push(`calculadora v=${unitsPerMonth}: recorrência ${r.recurringEarnings} ≠ fórmula ${closedForm}`);
  if (r.total !== r.installEarnings + r.deploymentEarnings + r.recurringEarnings) errors.push(`calculadora v=${unitsPerMonth}: total ≠ soma dos componentes`);
}

// Premissas explícitas mudam o resultado: sem implantação e recorrência só a partir do mês seguinte.
const alt = calculateEarnings(
  { unitsPerMonth: 1, installFee: 600, deploymentFee: 380, recurringFee: 30 },
  { months: 12, assumptions: { deploymentsPerUnit: 0, devicesPerUnit: 1, recurrenceStartsInInstallMonth: false, monthlyChurnRate: 0 } },
);
if (alt.deploymentEarnings !== 0 || alt.recurringEarnings !== 30 * 66) errors.push('calculadora: premissas alternativas não aplicadas');

const initial = Object.fromEntries(Object.entries(CALCULATOR_CONFIG.controls).map(([k, c]) => [k, c.initial]));
for (const [k, c] of Object.entries(CALCULATOR_CONFIG.controls)) {
  if (c.initial < c.min || c.initial > c.max) errors.push(`config: ${k} inicial fora dos limites`);
}
if (formatBRL(7200).replace(/\s/g, ' ') !== 'R$ 7.200,00') errors.push(`formatação BRL inesperada: ${formatBRL(7200)}`);

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
const r0 = calculateEarnings(initial, CALCULATOR_CONFIG);
console.log('✓ referências, âncoras, links, JS e CSS ok');
console.log(`✓ calculadora: ${scenarios.length + 1} cenários conferidos; valores iniciais da config = ${formatBRL(r0.total)} no ano`);
