import { AppError } from '../middleware/errorHandler';

const DISALLOWED_CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

function stripControlCharacters(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(DISALLOWED_CONTROL_CHARS, '');
}

type TextOptions = {
  fieldName: string;
  maxLength: number;
  preserveNewlines?: boolean;
  trim?: boolean;
};

export function sanitizeRequiredText(
  value: unknown,
  {
    fieldName,
    maxLength,
    preserveNewlines = false,
    trim = true,
  }: TextOptions,
): string {
  if (typeof value !== 'string') {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be a string`);
  }

  const stripped = stripControlCharacters(value);
  const normalized = trim
    ? (preserveNewlines ? stripped.trim() : stripped.replace(/\s+/g, ' ').trim())
    : stripped;

  if (!normalized) {
    throw new AppError(400, 'Missing required fields', `${fieldName} is required`);
  }

  if (normalized.length > maxLength) {
    throw new AppError(400, 'Input too long', `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return normalized;
}

export function sanitizeOptionalText(
  value: unknown,
  {
    fieldName,
    maxLength,
    preserveNewlines = false,
    trim = true,
  }: TextOptions,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be a string`);
  }

  const stripped = stripControlCharacters(value);
  const normalized = trim
    ? (preserveNewlines ? stripped.trim() : stripped.replace(/\s+/g, ' ').trim())
    : stripped;

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new AppError(400, 'Input too long', `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return normalized.length > 0 ? normalized : null;
}

export function sanitizeEmail(value: unknown): string {
  const email = sanitizeRequiredText(value, {
    fieldName: 'email',
    maxLength: 320,
  }).toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(400, 'Invalid email format', 'The provided email is not a valid email address');
  }

  return email;
}

export function sanitizePassword(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError(400, 'Invalid payload', 'password must be a string');
  }

  const password = stripControlCharacters(value);
  if (password.length < 6) {
    throw new AppError(400, 'Password too short', 'Password must be at least 6 characters long');
  }

  if (password.length > 128) {
    throw new AppError(400, 'Password too long', 'Password must be 128 characters or fewer');
  }

  return password;
}

export function sanitizeInteger(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number } = {},
): number {
  const numericValue = typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(numericValue)) {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be a valid integer`);
  }

  if (options.min !== undefined && numericValue < options.min) {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be at least ${options.min}`);
  }

  if (options.max !== undefined && numericValue > options.max) {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be ${options.max} or smaller`);
  }

  return numericValue;
}

export function sanitizeBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be a boolean`);
  }

  return value;
}

export function sanitizeIsoDate(value: unknown, fieldName: string): string {
  const rawValue = sanitizeRequiredText(value, {
    fieldName,
    maxLength: 64,
  });
  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, 'Invalid payload', `${fieldName} must be a valid date`);
  }

  return parsedDate.toISOString();
}
