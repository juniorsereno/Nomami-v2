import { fetchAsaas } from './nomami-app/lib/asaas';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

// Mock logger to avoid errors since we are running outside of Next.js context
// and might not have all logger dependencies set up perfectly for a standalone script
// or just to keep output clean.
// However, since we import fetchAsaas which imports logger, we rely on it working or we mock it if needed.
// For this simple test, let's assume fetchAsaas works if env vars are loaded.
// But wait, fetchAsaas uses '@/lib/logger'. The alias '@' might not work with ts-node directly without configuration.
// So instead of importing fetchAsaas, I will reimplement a simple fetch here to avoid module resolution issues.

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

async function getCustomer() {
  if (!ASAAS_API_KEY) {
    console.error('ASAAS_API_KEY not found');
    return;
  }

  const customerId = 'cus_000145256084';
  const url = `https://api.asaas.com/v3/customers/${customerId}`;
  
  console.log(`Fetching customer ${customerId}...`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

getCustomer();