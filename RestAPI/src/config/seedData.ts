/**
 * Database Initialization & Seed Data
 * Auto-creates default admin user for development
 */
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './database';

/**
 * Create default admin user if in development mode and admin doesn't exist
 */
export async function initializeDefaultAdmin(): Promise<void> {
  try {
    const db = getDB();
    
    // Allow this to be disabled explicitly, but keep it on by default for setup/testing.
    if (process.env.DISABLE_DEFAULT_ADMIN === 'true') {
      return;
    }

    // Check if admin already exists
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length > 0) {
      console.log(' Default admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    const userId = uuidv4();

    // Create default admin
    await db.query(
      `INSERT INTO users (user_id, username, password, email, user_level, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'admin', hashedPassword, 'admin@dev.local', 'beginner', true]
    );

    console.log(' Default admin user created');
    console.log('  Username: admin');
    console.log('  Email: admin@dev.local');
    console.log('  Password: admin123');
    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';
    console.log(`  Access at: ${appOrigin}/admin/dashboard.html\n`);
  } catch (error) {
    // Silently fail if table doesn't exist yet (first startup)
    if ((error as any).code === 'ECONNREFUSED' || (error as any).code === '42P1') {
      console.warn('  Could not auto-create admin (database not ready yet)');
      return;
    }
    console.warn('  Error creating default admin:', (error as any).message);
  }
}

