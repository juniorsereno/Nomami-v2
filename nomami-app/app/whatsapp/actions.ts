'use server'

const API_KEY = process.env.WHATSAPP_API_KEY || '';
const BASE_URL = process.env.WHATSAPP_API_URL || '';
const INSTANCE_NAME = process.env.WHATSAPP_INSTANCE || 'nomami';

export async function getConnectionState() {
    try {
        const response = await fetch(`${BASE_URL}/instance/connectionState/${INSTANCE_NAME}`, {
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
        const response = await fetch(`${BASE_URL}/instance/connect/${INSTANCE_NAME}`, {
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
