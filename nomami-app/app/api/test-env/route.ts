import { NextResponse } from 'next/server';
import { env } from 'process';
env.ASAAS_API_KEY = "_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjgyY2ViNGVkLTBmNTEtNDJiNS04Mzg0LTY4OWMzNzQzYTljMDo6JGFhY2hfNGM0MjJhOTEtMzEzYi00ZWFlLTg4ZDktYjEyOWU1ZGRkZjVl";

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