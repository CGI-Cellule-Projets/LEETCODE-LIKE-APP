/**
 * JWT Configuration
 */
import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
export const JWT_EXPIRY = (process.env.JWT_EXPIRY || '24h') as SignOptions['expiresIn'];
export const PORT = parseInt(process.env.PORT || '3001');
export const NODE_ENV = process.env.NODE_ENV || 'development';
