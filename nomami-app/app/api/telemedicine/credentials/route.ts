import { NextResponse } from 'next/server';
import { getTelemedicineCredentials } from '@/lib/telemedicine-config';

// O endpoint GET pode ser usado para verificar se o usuário da API está configurado,
// sem expor a senha.
export async function GET() {
  const { apiUser } = getTelemedicineCredentials();

  if (!apiUser) {
    return NextResponse.json({ error: 'Usuário da API de Telemedicina não configurado no servidor.' }, { status: 404 });
  }
  
  return NextResponse.json({ apiUser });
}