import { logger } from '@/lib/logger';

const ASAAS_API_BASE_URL = 'https://api.asaas.com/v3';

/**
 * Wrapper para chamadas à API do Asaas com logging automático.
 */
export async function fetchAsaas(endpoint: string, options: RequestInit = {}) {
  const url = `${ASAAS_API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = options.method || 'GET';
  const apiKey = process.env.ASAAS_API_KEY;
  const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'UNDEFINED';

  // Log da requisição
  logger.info({
    service: 'asaas',
    url,
    method,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) : null
  }, `
╭──────────────────────────────────────────────────
│ 🚀 ASAAS API REQUEST
│
│ 📡 Method: ${method}
│ 🔗 URL:    ${url}
│ 🔑 API Key: ${maskedKey}
╰──────────────────────────────────────────────────`);
  if (!apiKey) {
    const errorMsg = 'ASAAS_API_KEY não está configurada nas variáveis de ambiente.';
    logger.error({ service: 'asaas' }, errorMsg);
    throw new Error(errorMsg);
  }

  const headers: HeadersInit = {
    'accept': 'application/json',
    'access_token': apiKey,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Log da resposta
    const isSuccess = response.ok;
    const icon = isSuccess ? '✅' : '❌';
    const title = isSuccess ? 'ASAAS API RESPONSE' : 'ASAAS API ERROR';

    logger.info({
      service: 'asaas',
      url,
      method,
      status: response.status,
      statusText: response.statusText,
    }, `
╭──────────────────────────────────────────────────
│ ${icon} ${title}
│
│ 📡 Method: ${method}
│ 🔗 URL:    ${url}
│ 🔢 Status: ${response.status} ${response.statusText}
╰──────────────────────────────────────────────────`);

    return response;
  } catch (error) {
    logger.error({
      service: 'asaas',
      url,
      method,
      err: error
    }, `
╭──────────────────────────────────────────────────
│ 💥 ASAAS API EXCEPTION
│
│ 📡 Method: ${method}
│ 🔗 URL:    ${url}
│ ❗ Error:  ${error instanceof Error ? error.message : String(error)}
╰──────────────────────────────────────────────────`);
    throw error;
  }
}