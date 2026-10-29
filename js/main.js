// Landing page de integradores OpenGate.
import { initCalculator } from './calculator-ui.js';

// Destino dos cadastros de parceiros. O envio passa pelo FormSubmit (formsubmit.co),
// que repassa os dados por e-mail. Ao trocar o e-mail, atualize também o action do
// formulário em index.html (usado quando o JS não carrega).
// Atenção: no primeiro envio para um endereço novo, o FormSubmit manda a esse endereço
// um e-mail de ativação; até ele ser confirmado, os cadastros não são entregues.
const PARTNER_FORM_EMAIL = 'marcio@msserver.com.br';
const PARTNER_FORM_ENDPOINT = `https://formsubmit.co/ajax/${PARTNER_FORM_EMAIL}`;
const PARTNER_FORM_SUBJECT = 'Novo interessado — Programa de Parceiros OpenGate';

const STATUS_MESSAGES = {
  success: 'Recebemos seus dados! Nossa equipe entra em contato em breve para apresentar o programa.',
  error: 'Não foi possível enviar agora. Tente novamente em instantes.',
};

function initPartnerForm() {
  const form = document.getElementById('partner-form');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const label = form.querySelector('[data-submit-label]');
  const status = form.querySelector('[data-form-status]');
  const idleLabel = label.textContent;

  const showStatus = (type) => {
    status.textContent = STATUS_MESSAGES[type];
    status.dataset.state = type;
    status.hidden = false;
  };

  // Só chega aqui depois da validação nativa (nome e empresa obrigatórios).
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    const payload = {
      ...data,
      _subject: PARTNER_FORM_SUBJECT,
      _template: 'table',
    };

    button.disabled = true;
    label.textContent = 'Enviando...';
    status.hidden = true;

    try {
      const response = await fetch(PARTNER_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || String(result.success) !== 'true') throw new Error(result.message || response.status);

      form.reset();
      showStatus('success');
    } catch (error) {
      console.warn('Falha no envio do formulário de parceiros:', error);
      showStatus('error');
    } finally {
      button.disabled = false;
      label.textContent = idleLabel;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCalculator(document.querySelector('[data-calculator]'));
  initPartnerForm();
});
