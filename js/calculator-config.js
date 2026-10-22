// Configuração da calculadora de ganho anual.
// Valores comerciais ILUSTRATIVOS, fornecidos como ponto de partida e ainda
// pendentes de confirmação comercial. Ajuste aqui; a interface lê tudo deste arquivo.

export const CALCULATOR_CONFIG = {
  // Período projetado, em meses.
  months: 12,

  // Controles exibidos na página: limites dos sliders e valor inicial.
  controls: {
    // Novas instalações (ou clientes) conquistadas por mês.
    unitsPerMonth: { min: 1, max: 30, step: 1, initial: 1 },
    // Ganho por instalação, em reais.
    installFee: { min: 0, max: 1500, step: 10, initial: 600 },
    // Ganho por implantação/integração (sistemas de hospedagem ou cadastro de contas), em reais.
    deploymentFee: { min: 0, max: 1000, step: 10, initial: 380 },
    // Ganho recorrente por aparelho ativo, em reais por mês.
    recurringFee: { min: 0, max: 100, step: 1, initial: 30 },
  },

  // Premissas que ligam uma nova instalação às demais remunerações.
  // Não estão confirmadas comercialmente; ficam explícitas para poderem ser ajustadas.
  assumptions: {
    // Implantações realizadas para cada nova instalação (0 = instalação sem implantação).
    deploymentsPerUnit: 1,
    // Aparelhos ativos com recorrência gerados por cada nova instalação.
    devicesPerUnit: 1,
    // true: o aparelho gera recorrência já no mês da instalação; false: a partir do mês seguinte.
    recurrenceStartsInInstallMonth: true,
    // Fração da carteira cancelada a cada mês (0.02 = 2% ao mês).
    monthlyChurnRate: 0,
  },
};
