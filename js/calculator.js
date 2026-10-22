// Cálculo do ganho anual estimado. Funções puras, sem acesso ao DOM,
// para poderem ser verificadas em scripts/check.mjs.

const toCents = (value) => Math.round(value * 100) / 100;

/**
 * Projeta os ganhos mês a mês.
 * @param {{unitsPerMonth:number, installFee:number, deploymentFee:number, recurringFee:number}} input
 * @param {{months:number, assumptions:object}} config
 */
export function calculateEarnings(input, config) {
  const { unitsPerMonth, installFee, deploymentFee, recurringFee } = input;
  const { months, assumptions } = config;
  const { deploymentsPerUnit, devicesPerUnit, recurrenceStartsInInstallMonth, monthlyChurnRate } = assumptions;

  let activeDevices = 0;
  let recurringEarnings = 0;
  const timeline = [];

  for (let month = 1; month <= months; month += 1) {
    const carried = activeDevices * (1 - monthlyChurnRate);
    const added = unitsPerMonth * devicesPerUnit;
    // Aparelhos que geram recorrência neste mês.
    const billed = recurrenceStartsInInstallMonth ? carried + added : carried;
    const recurring = billed * recurringFee;

    recurringEarnings += recurring;
    activeDevices = carried + added;
    timeline.push({ month, billedDevices: billed, recurring });
  }

  const newUnits = unitsPerMonth * months;
  const installEarnings = newUnits * installFee;
  const deploymentEarnings = newUnits * deploymentsPerUnit * deploymentFee;

  return {
    newUnits,
    deployments: newUnits * deploymentsPerUnit,
    installEarnings: toCents(installEarnings),
    deploymentEarnings: toCents(deploymentEarnings),
    recurringEarnings: toCents(recurringEarnings),
    total: toCents(installEarnings + deploymentEarnings + recurringEarnings),
    // Carteira ativa ao fim do período e quanto ela passa a render por mês.
    endActiveDevices: activeDevices,
    endMonthlyRecurring: toCents(activeDevices * recurringFee),
    timeline,
  };
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const formatBRL = (value) => brl.format(value);
export const formatInteger = (value) => integer.format(value);
