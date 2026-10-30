// Landing page de integradores OpenGate.
import { initCalculator } from './calculator-ui.js';

// Envio dos cadastros de parceiros pelo Web3Forms (web3forms.com), que repassa os dados
// por e-mail. A chave (campo oculto access_key em index.html) define o e-mail de destino.
const PARTNER_FORM_ENDPOINT = 'https://api.web3forms.com/submit';
const PARTNER_FORM_SUBJECT = 'Novo interessado — Programa de Parceiros OpenGate';
const PARTNER_FORM_SENDER = 'Landing page de integradores OpenGate';

// Destino do e-mail de contingência (mailto), usado quando o envio pelo site falha.
// Mantenha igual ao e-mail cadastrado no Web3Forms.
const PARTNER_FORM_EMAIL = 'marcio@msserver.com.br';

const STATUS_MESSAGES = {
  success: 'Recebemos seus dados! Nossa equipe entra em contato em breve para apresentar o programa.',
  error: 'Não foi possível enviar pelo site agora. Envie seus dados por e-mail — a mensagem já vem preenchida:',
};

// Rótulos usados no e-mail de contingência (mailto), na ordem do formulário.
const FIELD_LABELS = {
  nome: 'Nome completo',
  empresa: 'Empresa',
  receita_recorrente: 'Tem interesse em uma nova fonte de receita recorrente?',
  seguranca_eletronica: 'Você já instala ou trabalha com dispositivos de segurança eletrônica?',
  carteira_clientes: 'Você tem uma carteira ativa de clientes?',
};

// Se o serviço de envio falhar, o visitante ainda consegue mandar os dados pelo próprio e-mail.
function buildMailtoLink(data) {
  const lines = Object.entries(FIELD_LABELS).map(([name, label]) => `${label}: ${data[name] || '—'}`);
  const params = new URLSearchParams({ subject: PARTNER_FORM_SUBJECT, body: lines.join('\n') });
  // URLSearchParams codifica espaço como "+", que clientes de e-mail não convertem de volta.
  return `mailto:${PARTNER_FORM_EMAIL}?${params.toString().replace(/\+/g, '%20')}`;
}

function initPartnerForm() {
  const form = document.getElementById('partner-form');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const label = form.querySelector('[data-submit-label]');
  const status = form.querySelector('[data-form-status]');
  const idleLabel = label.textContent;

  const showStatus = (type, mailto) => {
    status.textContent = STATUS_MESSAGES[type];
    if (mailto) {
      const link = document.createElement('a');
      link.className = 'form-status__action';
      link.href = mailto;
      link.textContent = 'Enviar por e-mail';
      status.append(link);
    }
    status.dataset.state = type;
    status.hidden = false;
  };

  // Só chega aqui depois da validação nativa (nome e empresa obrigatórios).
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    const payload = {
      ...data,
      subject: PARTNER_FORM_SUBJECT,
      from_name: PARTNER_FORM_SENDER,
    };

    button.disabled = true;
    label.textContent = 'Enviando...';
    status.hidden = true;

    try {
      if (!data.access_key) throw new Error('access_key do Web3Forms não configurada em index.html');

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
      showStatus('error', buildMailtoLink(data));
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
