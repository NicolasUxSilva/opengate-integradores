// Telefone/WhatsApp brasileiro do formulário de parceiros: máscara e validação.
// Funções puras (sem DOM), verificadas por scripts/check.mjs.

// Aceita colagens como "+55 (11) 91234-5678" ou "011 91234-5678": remove o DDI 55
// e o zero de operadora, e limita a DDD + número (11 dígitos).
export function phoneDigits(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length > 11 && digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  return digits.slice(0, 11);
}

// Máscara progressiva: (11) 91234-5678 para celular, (11) 3123-4567 para fixo.
export function formatPhone(value) {
  const d = phoneDigits(value);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

// Válido: DDD de 11 a 99 seguido de fixo (8 dígitos, começa com 2 a 5)
// ou celular (9 dígitos, começa com 9).
export function isValidPhone(value) {
  const d = phoneDigits(value);
  if (!/^[1-9][1-9]/.test(d)) return false;
  const number = d.slice(2);
  if (number.length === 9) return number.startsWith('9');
  if (number.length === 8) return /^[2-5]/.test(number);
  return false;
}

export const PHONE_ERROR_MESSAGE = 'Informe um WhatsApp ou telefone com DDD, por exemplo (11) 91234-5678.';
