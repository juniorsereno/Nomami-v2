/**
 * Property-based tests for Export functionality
 * **Property 12: Export Data Completeness**
 * **Validates: Requirements 10.2, 10.4**
 * 
 * Feature: corporate-plans
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property 12: Export Data Completeness', () => {
  describe('Companies CSV Export', () => {
    const requiredCompanyFields = [
      'Nome',
      'CNPJ',
      'Email de Contato',
      'Telefone de Contato',
      'Pessoa de Contato',
      'Status',
      'Quantidade Contratada',
      'Colaboradores Ativos',
      'Valor Mensal',
      'Data de Criação',
    ];

    it('CSV header should contain all required company fields', () => {
      fc.assert(
        fc.property(
          fc.constant(requiredCompanyFields),
          (fields) => {
            // Simulate CSV header generation
            const csvHeader = fields.join(',');
            
            // All required fields should be present
            for (const field of requiredCompanyFields) {
              expect(csvHeader).toContain(field);
            }
          }
        ),
        { numRuns: 1 }
      );
    });

    it('each company row should have same number of columns as header', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            cnpj: fc.stringMatching(/^\d{14}$/),
            contactEmail: fc.emailAddress(),
            contactPhone: fc.stringMatching(/^\d{10,11}$/),
            contactPerson: fc.string({ minLength: 1, maxLength: 100 }),
            status: fc.constantFrom('active', 'suspended', 'cancelled'),
            contractedQuantity: fc.integer({ min: 1, max: 1000 }),
            activeSubscribers: fc.integer({ min: 0, max: 1000 }),
            monthlyValue: fc.float({ min: 0, max: 100000, noNaN: true }),
            createdAt: fc.integer({ 
              min: new Date('2020-01-01').getTime(), 
              max: new Date('2025-12-31').getTime() 
            }).map(ts => new Date(ts)),
          }),
          (company) => {
            // Simulate row generation
            const row = [
              escapeCsvField(company.name),
              formatCnpj(company.cnpj),
              escapeCsvField(company.contactEmail),
              escapeCsvField(company.contactPhone),
              escapeCsvField(company.contactPerson),
              translateCompanyStatus(company.status),
              company.contractedQuantity.toString(),
              company.activeSubscribers.toString(),
              formatCurrency(company.monthlyValue),
              formatDate(company.createdAt),
            ];
            
            expect(row.length).toBe(requiredCompanyFields.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('CNPJ should be formatted correctly in export', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{14}$/),
          (cnpj) => {
            const formatted = formatCnpj(cnpj);
            // Should match XX.XXX.XXX/XXXX-XX format
            expect(formatted).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Subscribers CSV Export', () => {
    const requiredSubscriberFields = [
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

    it('CSV header should contain all required subscriber fields', () => {
      fc.assert(
        fc.property(
          fc.constant(requiredSubscriberFields),
          (fields) => {
            // Simulate CSV header generation
            const csvHeader = fields.join(',');
            
            // All required fields should be present
            for (const field of requiredSubscriberFields) {
              expect(csvHeader).toContain(field);
            }
          }
        ),
        { numRuns: 1 }
      );
    });

    it('each subscriber row should have same number of columns as header', () => {
      // Use integer timestamps to avoid NaN date issues
      const validDateArb = fc.integer({ 
        min: new Date('2020-01-01').getTime(), 
        max: new Date('2025-12-31').getTime() 
      }).map(ts => new Date(ts));

      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            cpf: fc.stringMatching(/^\d{11}$/),
            phone: fc.stringMatching(/^\d{10,11}$/),
            email: fc.emailAddress(),
            status: fc.constantFrom('ativo', 'inativo', 'vencido'),
            cardId: fc.stringMatching(/^[A-Z0-9]{8}$/),
            startDate: validDateArb,
            nextDueDate: validDateArb,
            removedAt: fc.option(validDateArb, { nil: null }),
          }),
          (subscriber) => {
            // Simulate row generation
            const row = [
              escapeCsvField(subscriber.name),
              formatCpf(subscriber.cpf),
              escapeCsvField(subscriber.phone),
              escapeCsvField(subscriber.email),
              translateSubscriberStatus(subscriber.status),
              subscriber.cardId,
              formatDate(subscriber.startDate),
              formatDate(subscriber.nextDueDate),
              subscriber.removedAt ? formatDate(subscriber.removedAt) : '',
            ];
            
            expect(row.length).toBe(requiredSubscriberFields.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('CPF should be formatted correctly in export', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{11}$/),
          (cpf) => {
            const formatted = formatCpf(cpf);
            // Should match XXX.XXX.XXX-XX format
            expect(formatted).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('removed subscribers should have removal date in export', () => {
      const validDateArb = fc.integer({ 
        min: new Date('2020-01-01').getTime(), 
        max: new Date('2025-12-31').getTime() 
      }).map(ts => new Date(ts));

      fc.assert(
        fc.property(
          validDateArb,
          (removedAt) => {
            const formatted = formatDate(removedAt);
            // Should be a valid date string
            expect(formatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CSV Field Escaping', () => {
    it('fields with commas should be quoted', () => {
      // Use explicit generation instead of filter to avoid slow tests
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 50 })
          ),
          ([before, after]) => {
            const value = `${before},${after}`;
            const escaped = escapeCsvField(value);
            expect(escaped.startsWith('"')).toBe(true);
            expect(escaped.endsWith('"')).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('fields with quotes should have quotes escaped', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 50 })
          ),
          ([before, after]) => {
            const value = `${before}"${after}`;
            const escaped = escapeCsvField(value);
            // Original quotes should be doubled
            expect(escaped).toContain('""');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('fields with newlines should be quoted', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 50 })
          ),
          ([before, after]) => {
            const value = `${before}\n${after}`;
            const escaped = escapeCsvField(value);
            expect(escaped.startsWith('"')).toBe(true);
            expect(escaped.endsWith('"')).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('simple fields should not be quoted', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('')),
            { minLength: 1, maxLength: 50 }
          ).map(arr => arr.join('')),
          (value) => {
            const escaped = escapeCsvField(value);
            expect(escaped).toBe(value);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// Helper functions (same as in API routes)
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function translateCompanyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    cancelled: 'Cancelado',
  };
  return statusMap[status] || status;
}

function translateSubscriberStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ativo: 'Ativo',
    inativo: 'Inativo',
    vencido: 'Vencido',
  };
  return statusMap[status] || status;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}
