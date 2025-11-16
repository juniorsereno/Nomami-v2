import { NextResponse } from 'next/server';

// Esta função auxiliar será usada por outras rotas de API no backend para obter as credenciais.
// Ela lê diretamente das variáveis de ambiente do servidor.
export function getTelemedicineCredentials() {
  const apiUser = process.env.TELEMEDICINE_API_USER;
  const apiPassword = process.env.TELEMEDICINE_API_PASSWORD;
  return { apiUser, apiPassword };
}

// O endpoint GET pode ser usado para verificar se o usuário da API está configurado,
// sem expor a senha.
export async function GET() {
  const { apiUser } = getTelemedicineCredentials();

  if (!apiUser) {
    return NextResponse.json({ error: 'Usuário da API de Telemedicina não configurado no servidor.' }, { status: 404 });
  }
  
  return NextResponse.json({ apiUser });
}

// O endpoint POST para salvar credenciais foi removido.
// A configuração agora deve ser feita através de variáveis de ambiente.