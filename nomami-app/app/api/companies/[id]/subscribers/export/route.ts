/**
 * Company Subscribers Export API Route
 * GET /api/companies/[id]/subscribers/export - Export company subscribers as CSV
 * Requirements: 10.3, 10.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById } from '@/lib/companies/queries';
import { getCompanySubscribers } from '@/lib/companies/subscriber-queries';
import { logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get company info for filename
    const companyDetail = await getCompanyById(id);
    if (!companyDetail) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Get all subscribers including removed
    const result = await getCompanySubscribers(id, { includeRemoved: true });
    
    // CSV header
    const headers = [
      'Nome',
      'CPF',
      'Telefone',
      'Email',
      'Status',
      'Card ID',
      'Data de Início',
      'Próximo Vencimento',
      'Data de Remoção',
    ];

    // CSV rows
    const rows = result.data.map(subscriber => [
      escapeCsvField(subscriber.name),
      formatCpf(subscriber.cpf),
      escapeCsvField(subscriber.phone),
      escapeCsvField(subscriber.email),
      translateStatus(subscriber.status),
      subscriber.cardId,
      formatDate(subscriber.startDate),
      formatDate(subscriber.nextDueDate),
      subscriber.removedAt ? formatDate(subscriber.removedAt) : '',
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Sanitize company name for filename
    const safeCompanyName = companyDetail.company.name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="colaboradores-${safeCompanyName}-${formatDateForFilename(new Date())}.csv"`,
      },
    });
  } catch (error) {
    logError(error, 'Erro ao exportar colaboradores');
    return NextResponse.json({ error: 'Erro ao exportar colaboradores.' }, { status: 500 });
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    vencido: 'Vencido',
  };
  return statusMap[status] || status;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}
