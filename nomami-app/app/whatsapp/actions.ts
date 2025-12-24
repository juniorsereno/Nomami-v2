'use server'

const API_KEY = process.env.WHATSAPP_API_KEY || '';
const BASE_URL = process.env.WHATSAPP_API_URL || '';
const INSTANCE_NAME = process.env.WHATSAPP_INSTANCE || 'nomami';

// Log para debug em produção
console.log('[WhatsApp Actions] Environment check:', {
  hasApiUrl: !!BASE_URL,
  hasApiKey: !!API_KEY,
  instance: INSTANCE_NAME,
  apiUrlLength: BASE_URL.length
});

export async function getConnectionState() {
    try {
        if (!BASE_URL) {
            console.error('[WhatsApp Actions] WHATSAPP_API_URL não está configurada. Valor:', process.env.WHATSAPP_API_URL);
            return { instance: { state: 'error', message: 'API URL não configurada' } };
        }

        const url = `${BASE_URL}/instance/connectionState/${INSTANCE_NAME}`;
        console.log('[WhatsApp Actions] Fetching:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch connection state: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching connection state:', error);
        return { instance: { state: 'error' } };
    }
}

export async function connectInstance() {
    try {
        if (!BASE_URL) {
            console.error('[WhatsApp Actions] WHATSAPP_API_URL não está configurada');
            return null;
        }

        const url = `${BASE_URL}/instance/connect/${INSTANCE_NAME}`;
        console.log('[WhatsApp Actions] Connecting:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to connect instance: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error connecting instance:', error);
        return null;
    }
}
