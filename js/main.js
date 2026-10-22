// Landing page de integradores OpenGate.
import { initCalculator } from './calculator-ui.js';

// URL de envio do formulário. No original ("Form URL" do componente Framer) está vazia,
// então o envio é bloqueado após a validação nativa dos campos obrigatórios.
const PARTNER_FORM_ACTION = '';

function initPartnerForm() {
  const form = document.getElementById('partner-form');
  if (!form) return;

  if (PARTNER_FORM_ACTION) {
    form.action = PARTNER_FORM_ACTION;
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCalculator(document.querySelector('[data-calculator]'));
  initPartnerForm();
});
