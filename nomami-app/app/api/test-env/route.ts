import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASAAS_API_KEY;

  if (apiKey) {
    return NextResponse.json({
      message: 'Variável de ambiente ASAAS_API_KEY encontrada.',
      value: apiKey,
    });
  } else {
    return NextResponse.json({
      message: 'ERRO: A variável de ambiente ASAAS_API_KEY não foi encontrada pelo servidor.',
    }, { status: 500 });
  }
}