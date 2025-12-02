const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        // Remove quotes if present
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

const apiKey = envVars['ASAAS_API_KEY'];

if (!apiKey) {
    console.error('ASAAS_API_KEY not found in .env');
    process.exit(1);
}

const customerId = 'cus_000145256084';
const url = `https://api.asaas.com/v3/customers/${customerId}`;

console.log(`Fetching customer ${customerId}...`);

fetch(url, {
    method: 'GET',
    headers: {
        'accept': 'application/json',
        'access_token': apiKey
    }
})
.then(response => {
    if (!response.ok) {
        return response.text().then(text => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
        });
    }
    return response.json();
})
.then(data => {
    console.log(JSON.stringify(data, null, 2));
})
.catch(error => {
    console.error('Error:', error.message);
});