// Origem do visitante: parâmetros de campanha da URL de entrada, guardados na aba
// (sessionStorage) para não se perderem se a pessoa navegar pela página antes de enviar.
// Vão em campos ocultos do formulário e no e-mail do Web3Forms. Nada disso vai ao Pixel.

export const TRACKED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origem'];
const STORAGE_KEY = 'og-campaign-params';
const MAX_LENGTH = 200;

// Lê os parâmetros permitidos de uma query string (sem DOM, testável).
export function readCampaignParams(search) {
  const params = new URLSearchParams(search || '');
  const found = {};
  for (const key of TRACKED_PARAMS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, MAX_LENGTH);
  }
  return found;
}

// Parâmetros da URL atual; se a URL não tiver nenhum, usa os guardados nesta aba.
export function captureCampaignParams() {
  let params = {};
  try {
    params = readCampaignParams(window.location.search);
    if (Object.keys(params).length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    else params = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    // sessionStorage indisponível: segue só com a URL.
  }
  return params;
}

// Preenche os campos ocultos do formulário com os parâmetros capturados.
export function fillHiddenFields(form, params) {
  for (const key of TRACKED_PARAMS) {
    const input = form.querySelector(`input[type="hidden"][name="${key}"]`);
    if (input) input.value = params[key] || '';
  }
}
