/**
 * Database Configuration and Connection
 */
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coding_platform',
});

export async function connectDB() {
  try {
    await client.connect();
    console.log('✓ Database connected successfully');
    return client;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
}

export function getDB() {
  return client;
}

export async function disconnectDB() {
  await client.end();
}
