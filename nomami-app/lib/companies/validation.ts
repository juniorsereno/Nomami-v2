/**
 * Validation functions for Corporate Plans feature
 * Requirements: 1.2, 1.5, 9.2, 9.4
 */

import type {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  AddCorporateSubscriberRequest,
  UpdatePlanRequest,
  ValidationResult,
  ValidationError,
} from './types';

// ============ CNPJ Validation ============

/**
 * Validates CNPJ format and check digits
 * CNPJ format: XX.XXX.XXX/XXXX-XX or XXXXXXXXXXXXXX (14 digits)
 */
export function validateCnpj(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove formatting characters
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');

  // Must have exactly 14 digits
  if (cleanCnpj.length !== 14) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1+$/.test(cleanCnpj)) return false;

  // Validate check digits
  return validateCnpjCheckDigits(cleanCnpj);
}

/**
 * Validates CNPJ check digits using the official algorithm
 */
function validateCnpjCheckDigits(cnpj: string): boolean {
  const digits = cnpj.split('').map(Number);

  // First check digit calculation
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += digits[i] * weights1[i];
  }
  const remainder1 = sum1 % 11;
  const checkDigit1 = remainder1 < 2 ? 0 : 11 - remainder1;

  if (digits[12] !== checkDigit1) return false;

  // Second check digit calculation
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += digits[i] * weights2[i];
  }
  const remainder2 = sum2 % 11;
  const checkDigit2 = remainder2 < 2 ? 0 : 11 - remainder2;

  return digits[13] === checkDigit2;
}

/**
 * Formats CNPJ to standard format XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(cnpj: string): string {
  const clean = cnpj.replace(/[^\d]/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Removes CNPJ formatting, returning only digits
 */
export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '');
}

// ============ CPF Validation ============

/**
 * Validates CPF format and check digits
 * CPF format: XXX.XXX.XXX-XX or XXXXXXXXXXX (11 digits)
 */
export function validateCpf(cpf: string): boolean {
  if (!cpf) return false;

  // Remove formatting characters
  const cleanCpf = cpf.replace(/[^\d]/g, '');

  // Must have exactly 11 digits
  if (cleanCpf.length !== 11) return false;

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1+$/.test(cleanCpf)) return false;

  // Validate check digits
  return validateCpfCheckDigits(cleanCpf);
}

/**
 * Validates CPF check digits using the official algorithm
 */
function validateCpfCheckDigits(cpf: string): boolean {
  const digits = cpf.split('').map(Number);

  // First check digit calculation
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * (10 - i);
  }
  const remainder1 = (sum1 * 10) % 11;
  const checkDigit1 = remainder1 === 10 ? 0 : remainder1;

  if (digits[9] !== checkDigit1) return false;

  // Second check digit calculation
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * (11 - i);
  }
  const remainder2 = (sum2 * 10) % 11;
  const checkDigit2 = remainder2 === 10 ? 0 : remainder2;

  return digits[10] === checkDigit2;
}

/**
 * Formats CPF to standard format XXX.XXX.XXX-XX
 */
export function formatCpf(cpf: string): string {
  const clean = cpf.replace(/[^\d]/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Removes CPF formatting, returning only digits
 */
export function cleanCpf(cpf: string): string {
  return cpf.replace(/[^\d]/g, '');
}

// ============ Email Validation ============

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ============ Phone Validation ============

/**
 * Validates Brazilian phone number format
 * Accepts: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, or just digits
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[^\d]/g, '');
  // Brazilian phone: 10 or 11 digits (with area code)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Formats phone to standard format (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

// ============ Billing Day Validation ============

/**
 * Validates billing day (1-28)
 */
export function validateBillingDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 28;
}

// ============ Company Validation ============

/**
 * Validates a create company request
 */
export function validateCreateCompanyRequest(
  request: CreateCompanyRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!request.name?.trim()) {
    errors.push({
      field: 'name',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Nome da empresa é obrigatório',
    });
  }

  if (!request.cnpj?.trim()) {
    errors.push({
      field: 'cnpj',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'CNPJ é obrigatório',
    });
  } else if (!validateCnpj(request.cnpj)) {
    errors.push({
      field: 'cnpj',
      code: 'INVALID_CNPJ',
      message: 'CNPJ inválido',
    });
  }

  if (!request.contactEmail?.trim()) {
    errors.push({
      field: 'contactEmail',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Email de contato é obrigatório',
    });
  } else if (!validateEmail(request.contactEmail)) {
    errors.push({
      field: 'contactEmail',
      code: 'INVALID_EMAIL',
      message: 'Email inválido',
    });
  }

  if (!request.contactPhone?.trim()) {
    errors.push({
      field: 'contactPhone',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Telefone de contato é obrigatório',
    });
  } else if (!validatePhone(request.contactPhone)) {
    errors.push({
      field: 'contactPhone',
      code: 'INVALID_PHONE',
      message: 'Telefone inválido',
    });
  }

  if (!request.contactPerson?.trim()) {
    errors.push({
      field: 'contactPerson',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Nome do contato é obrigatório',
    });
  }

  // Plan validation
  if (!request.plan) {
    errors.push({
      field: 'plan',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Configuração do plano é obrigatória',
    });
  } else {
    if (
      !request.plan.contractedQuantity ||
      request.plan.contractedQuantity <= 0
    ) {
      errors.push({
        field: 'plan.contractedQuantity',
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Quantidade contratada deve ser maior que zero',
      });
    }

    if (
      request.plan.pricePerSubscriber === undefined ||
      request.plan.pricePerSubscriber < 0
    ) {
      errors.push({
        field: 'plan.pricePerSubscriber',
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Preço por assinante é obrigatório',
      });
    }

    if (!validateBillingDay(request.plan.billingDay)) {
      errors.push({
        field: 'plan.billingDay',
        code: 'INVALID_BILLING_DAY',
        message: 'Dia de cobrança deve ser entre 1 e 28',
      });
    }

    if (!request.plan.startDate) {
      errors.push({
        field: 'plan.startDate',
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Data de início é obrigatória',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an update company request
 */
export function validateUpdateCompanyRequest(
  request: UpdateCompanyRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  if (request.contactEmail !== undefined && !validateEmail(request.contactEmail)) {
    errors.push({
      field: 'contactEmail',
      code: 'INVALID_EMAIL',
      message: 'Email inválido',
    });
  }

  if (request.contactPhone !== undefined && !validatePhone(request.contactPhone)) {
    errors.push({
      field: 'contactPhone',
      code: 'INVALID_PHONE',
      message: 'Telefone inválido',
    });
  }

  if (request.status !== undefined) {
    const validStatuses = ['active', 'suspended', 'cancelled'];
    if (!validStatuses.includes(request.status)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: 'Status inválido',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an update plan request
 */
export function validateUpdatePlanRequest(
  request: UpdatePlanRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  if (
    request.contractedQuantity !== undefined &&
    request.contractedQuantity <= 0
  ) {
    errors.push({
      field: 'contractedQuantity',
      code: 'INVALID_QUANTITY',
      message: 'Quantidade contratada deve ser maior que zero',
    });
  }

  if (
    request.pricePerSubscriber !== undefined &&
    request.pricePerSubscriber < 0
  ) {
    errors.push({
      field: 'pricePerSubscriber',
      code: 'INVALID_PRICE',
      message: 'Preço por assinante não pode ser negativo',
    });
  }

  if (
    request.billingDay !== undefined &&
    !validateBillingDay(request.billingDay)
  ) {
    errors.push({
      field: 'billingDay',
      code: 'INVALID_BILLING_DAY',
      message: 'Dia de cobrança deve ser entre 1 e 28',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============ Corporate Subscriber Validation ============

/**
 * Validates an add corporate subscriber request
 */
export function validateAddCorporateSubscriberRequest(
  request: AddCorporateSubscriberRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!request.name?.trim()) {
    errors.push({
      field: 'name',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Nome é obrigatório',
    });
  }

  if (!request.cpf?.trim()) {
    errors.push({
      field: 'cpf',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'CPF é obrigatório',
    });
  } else if (!validateCpf(request.cpf)) {
    errors.push({
      field: 'cpf',
      code: 'INVALID_CPF',
      message: 'CPF inválido',
    });
  }

  if (!request.phone?.trim()) {
    errors.push({
      field: 'phone',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Telefone é obrigatório',
    });
  } else if (!validatePhone(request.phone)) {
    errors.push({
      field: 'phone',
      code: 'INVALID_PHONE',
      message: 'Telefone inválido',
    });
  }

  if (!request.email?.trim()) {
    errors.push({
      field: 'email',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Email é obrigatório',
    });
  } else if (!validateEmail(request.email)) {
    errors.push({
      field: 'email',
      code: 'INVALID_EMAIL',
      message: 'Email inválido',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
