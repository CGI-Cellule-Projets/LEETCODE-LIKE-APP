/**
 * JWT Configuration
 */
import dotenv from 'dotenv';
import crypto from 'crypto';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) {
    return process.env.JWT_SECRET.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be defined in production.');
  }

  const ephemeralSecret = crypto.randomBytes(48).toString('hex');
  console.warn('JWT_SECRET is not set. Using an ephemeral development-only secret for this process.');
  return ephemeralSecret;
}

export const JWT_SECRET = resolveJwtSecret();
export const JWT_EXPIRY = (process.env.JWT_EXPIRY || '24h') as SignOptions['expiresIn'];
export const PORT = parseInt(process.env.PORT || '3001');
export const NODE_ENV = process.env.NODE_ENV || 'development';
