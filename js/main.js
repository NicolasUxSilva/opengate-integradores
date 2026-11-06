// Landing page de integradores OpenGate.
import { initCalculator } from './calculator-ui.js';
import { formatPhone, isValidPhone, PHONE_ERROR_MESSAGE } from './phone.js';

// Envio dos cadastros de parceiros pelo Web3Forms (web3forms.com), que repassa os dados
// por e-mail. A chave (campo oculto access_key em index.html) define o e-mail de destino.
const PARTNER_FORM_ENDPOINT = 'https://api.web3forms.com/submit';
const PARTNER_FORM_SUBJECT = 'Novo interessado — Programa de Parceiros OpenGate';
const PARTNER_FORM_SENDER = 'Landing page de integradores OpenGate';

// Destino do e-mail de contingência (mailto), usado quando o envio pelo site falha.
// Mantenha igual ao e-mail cadastrado no Web3Forms.
const PARTNER_FORM_EMAIL = 'suporte@msserver.com.br';

const STATUS_MESSAGES = {
  success: 'Recebemos seus dados! Nossa equipe entra em contato em breve para apresentar o programa.',
  error: 'Não foi possível enviar pelo site agora. Envie seus dados por e-mail — a mensagem já vem preenchida:',
};

// Origem do visitante para o evento Lead: "diagnostico" quando veio do CTA do diagnóstico
// (que acrescenta origem=diagnostico à URL), senão "direto". Nenhum dado pessoal vai ao Pixel.
function trafficOrigin() {
  try {
    return new URLSearchParams(window.location.search).get('origem') === 'diagnostico' ? 'diagnostico' : 'direto';
  } catch {
    return 'direto';
  }
}

// Evento de conversão da campanha: só depois que o Web3Forms confirmou o envio (success === true).
// Cada envio confirmado gera um único Lead, com eventID próprio para a Meta deduplicar repetições
// do mesmo envio. Um novo envio válido (outra pessoa ou novo contato) é um novo Lead.
function trackLead() {
  try {
    const eventID = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.fbq?.('track', 'Lead', { content_name: 'Programa de Parceiros OpenGate', origem: trafficOrigin() }, { eventID });
  } catch {
    // Mensuração nunca deve atrapalhar o envio.
  }
}

// Rótulos dos campos no e-mail recebido e no e-mail de contingência, na ordem do formulário.
const FIELD_LABELS = {
  nome: 'Nome completo',
  empresa: 'Empresa',
  whatsapp: 'WhatsApp / telefone',
  receita_recorrente: 'Tem interesse em uma nova fonte de receita recorrente?',
  seguranca_eletronica: 'Você já instala ou trabalha com dispositivos de segurança eletrônica?',
  carteira_clientes: 'Você tem uma carteira ativa de clientes?',
};
const UNANSWERED = 'Não respondido';

// Respostas com a pergunta por extenso. Perguntas sem opção marcada também entram
// (o navegador omite rádios não marcados), para o e-mail sempre trazer as três.
function labeledAnswers(data) {
  return Object.fromEntries(
    Object.entries(FIELD_LABELS).map(([name, label]) => [label, data[name] || UNANSWERED]),
  );
}

// Se o serviço de envio falhar, o visitante ainda consegue mandar os dados pelo próprio e-mail.
function buildMailtoLink(data) {
  const lines = Object.entries(labeledAnswers(data)).map(([label, value]) => `${label}: ${value}`);
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

  let submitting = false;

  // WhatsApp/telefone: máscara enquanto digita e validação nativa (bloqueia o envio se inválido).
  const phone = form.querySelector('#whatsapp');
  const phoneHint = form.querySelector('#whatsapp-hint');
  const phoneHintText = phoneHint.textContent;
  const validatePhone = (showError) => {
    const ok = !phone.value || isValidPhone(phone.value);
    phone.setCustomValidity(ok ? '' : PHONE_ERROR_MESSAGE);
    const visible = showError && !ok;
    phone.setAttribute('aria-invalid', String(visible));
    phoneHint.textContent = visible ? PHONE_ERROR_MESSAGE : phoneHintText;
    if (visible) phoneHint.dataset.error = '';
    else delete phoneHint.dataset.error;
  };
  phone.addEventListener('input', () => {
    phone.value = formatPhone(phone.value);
    validatePhone(phone.getAttribute('aria-invalid') === 'true');
  });
  phone.addEventListener('blur', () => validatePhone(Boolean(phone.value)));
  form.addEventListener('invalid', (event) => { if (event.target === phone) validatePhone(Boolean(phone.value)); }, true);

  // Só chega aqui depois da validação nativa (nome e empresa obrigatórios).
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return; // impede envio duplo (e Lead duplo) enquanto o primeiro está em andamento
    validatePhone(true);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    submitting = true;

    const data = Object.fromEntries(new FormData(form));
    data.whatsapp = formatPhone(data.whatsapp);
    const payload = {
      access_key: data.access_key,
      botcheck: data.botcheck,
      ...labeledAnswers(data),
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
      // Armadilha anti-spam preenchida = robô: não conta como Lead.
      if (!data.botcheck) trackLead();
    } catch (error) {
      console.warn('Falha no envio do formulário de parceiros:', error);
      showStatus('error', buildMailtoLink(data));
    } finally {
      submitting = false;
      button.disabled = false;
      label.textContent = idleLabel;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCalculator(document.querySelector('[data-calculator]'));
  initPartnerForm();
});
