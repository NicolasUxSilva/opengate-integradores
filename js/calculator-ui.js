// Liga a seção #calculadora ao cálculo: lê os sliders, recalcula a cada movimento
// e escreve os resultados. Os valores comerciais vêm de calculator-config.js.
import { CALCULATOR_CONFIG } from './calculator-config.js';
import { calculateEarnings, formatBRL, formatInteger } from './calculator.js';

const plural = (count, singular, pluralForm) => (count === 1 ? singular : pluralForm);

// Texto exibido ao lado de cada slider.
const FIELD_FORMAT = {
  unitsPerMonth: (v) => `${formatInteger(v)} por mês`,
  installFee: (v) => formatBRL(v),
  deploymentFee: (v) => formatBRL(v),
  recurringFee: (v) => `${formatBRL(v)}/mês`,
};

// Rótulos curtos das extremidades de cada slider.
const SCALE_FORMAT = {
  unitsPerMonth: (v) => formatInteger(v),
  installFee: (v) => `R$ ${formatInteger(v)}`,
  deploymentFee: (v) => `R$ ${formatInteger(v)}`,
  recurringFee: (v) => `R$ ${formatInteger(v)}`,
};

function describeAssumptions({ months, assumptions }) {
  const { deploymentsPerUnit, devicesPerUnit, recurrenceStartsInInstallMonth, monthlyChurnRate } = assumptions;
  const start = recurrenceStartsInInstallMonth ? 'no mês da instalação' : 'no mês seguinte à instalação';
  const churn = monthlyChurnRate > 0
    ? `cancelamento de ${formatInteger(monthlyChurnRate * 100)}% da carteira ao mês`
    : 'sem cancelamentos';
  return `Premissas: projeção de ${months} meses; cada nova instalação gera `
    + `${formatInteger(deploymentsPerUnit)} ${plural(deploymentsPerUnit, 'implantação', 'implantações')} e `
    + `${formatInteger(devicesPerUnit)} ${plural(devicesPerUnit, 'aparelho ativo', 'aparelhos ativos')}; `
    + `a recorrência começa ${start}, ${churn}.`;
}

export function initCalculator(root, config = CALCULATOR_CONFIG) {
  if (!root) return;

  const fields = [...root.querySelectorAll('[data-field]')].map((field) => {
    const key = field.dataset.field;
    const { min, max, step, initial } = config.controls[key];
    const input = field.querySelector('input[type="range"]');
    Object.assign(input, { min, max, step, value: initial });
    field.querySelector('[data-scale="min"]').textContent = SCALE_FORMAT[key](min);
    field.querySelector('[data-scale="max"]').textContent = SCALE_FORMAT[key](max);
    return { key, input, output: field.querySelector('output'), min, max };
  });

  const results = Object.fromEntries(
    [...root.querySelectorAll('[data-result]')].map((el) => [el.dataset.result, el]),
  );
  const bars = Object.fromEntries(
    [...root.querySelectorAll('[data-bar]')].map((el) => [el.dataset.bar, el]),
  );

  root.querySelectorAll('[data-months]').forEach((el) => {
    el.textContent = formatInteger(config.months);
  });
  const assumptionsText = root.querySelector('[data-assumptions]');
  if (assumptionsText) assumptionsText.textContent = describeAssumptions(config);

  function update() {
    const input = {};
    for (const { key, input: range, output, min, max } of fields) {
      const value = Number(range.value);
      input[key] = value;
      const text = FIELD_FORMAT[key](value);
      output.textContent = text;
      range.setAttribute('aria-valuetext', text);
      range.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
    }

    const r = calculateEarnings(input, config);
    const [whole, cents] = formatBRL(r.total).split(',');
    results.total.innerHTML = `${whole}<small>,${cents}</small>`;
    results.install.textContent = formatBRL(r.installEarnings);
    results.deployment.textContent = formatBRL(r.deploymentEarnings);
    results.recurring.textContent = formatBRL(r.recurringEarnings);
    results.sum.textContent = formatBRL(r.total);
    results.totalCompact.textContent = formatBRL(r.total);
    results.newUnits.textContent = formatInteger(r.newUnits);
    const devices = Math.round(r.endActiveDevices);
    results.portfolio.textContent = formatInteger(devices);
    results.portfolioUnit.textContent = plural(devices, 'aparelho', 'aparelhos');
    results.monthlyEnd.textContent = `${formatBRL(r.endMonthlyRecurring)}/mês`;

    for (const key of ['install', 'deployment', 'recurring']) {
      const share = r.total > 0 ? (r[`${key}Earnings`] / r.total) * 100 : 0;
      bars[key].style.width = `${share}%`;
    }
  }

  root.addEventListener('input', update);
  update();
}
