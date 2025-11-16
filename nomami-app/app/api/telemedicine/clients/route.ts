import { NextResponse } from 'next/server';
import { getTelemedicineCredentials } from '../credentials/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validação básica do corpo da requisição
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const { apiUser, apiPassword } = getTelemedicineCredentials();

    if (!apiUser || !apiPassword) {
      return NextResponse.json({ error: 'Credenciais da API de Telemedicina não configuradas no servidor.' }, { status: 500 });
    }

    const response = await fetch('https://webh.criativamaisdigital.com.br/webhook/661ea9ca-69d4-4876-ae67-59b2f9b59f18', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${apiUser}:${apiPassword}`),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API externa:', errorText);
      return NextResponse.json({ error: `Erro na API externa: ${response.statusText}` }, { status: response.status });
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erro ao processar requisição para a API de telemedicina:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}