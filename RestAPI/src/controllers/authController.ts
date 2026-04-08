import { Request, Response } from 'express';
import { getDB } from '../config/database';
import { JWT_SECRET, JWT_EXPIRY } from '../config/jwt';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/auth/register
 * 
 * Registers a new user.
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // 1. Validation
    if (!normalizedUsername || !normalizedEmail || !password) {
      throw new AppError(400, 'All fields are required', 'Missing username, email, or password in the request body');
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError(400, 'Invalid email format', 'The provided email is not a valid email address');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password too short', 'Password must be at least 6 characters long');
    }

    const db = getDB();

    // 2. Duplication Check
    const existingUser = await db.query(
      `SELECT user_id, username, email FROM users WHERE email = $1 OR username = $2`,
      [normalizedEmail, normalizedUsername]
    );

    if (existingUser.rows && existingUser.rows.length > 0) {
      const conflictMsg = existingUser.rows[0].email === normalizedEmail
        ? 'Email is already registered' 
        : 'Username is already taken';
      throw new AppError(409, 'Conflict', conflictMsg);
    }

    // 3. Security (Password Hashing)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Creation
    const newUserId = uuidv4();
    
    await db.query(
      `INSERT INTO users (user_id, username, email, password, user_level) 
       VALUES ($1, $2, $3, $4, 'beginner')`,
      [newUserId, normalizedUsername, normalizedEmail, hashedPassword]
    );

    // 5. Success Response
    const token = jwt.sign(
      { id: newUserId, username: normalizedUsername, role: 'user', is_admin: false },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUserId,
          user_id: newUserId,
          username: normalizedUsername,
          email: normalizedEmail,
          level: 'beginner',
          role: 'user',
          is_admin: false
        }
      }
    });

  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.details,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register server',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user by email/password and returns a JWT + normalized user payload.
 */
export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      throw new AppError(400, 'All fields are required', 'Missing email or password in the request body');
    }

    const db = getDB();

    const result = await db.query(
      `SELECT user_id, username, email, password, user_level, is_admin
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(401, 'Invalid credentials', 'Email or password is incorrect');
    }

    const user = result.rows[0] as {
      user_id: string;
      username: string;
      email: string;
      password: string;
      user_level: string;
      is_admin: boolean;
    };

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials', 'Email or password is incorrect');
    }

    const role = user.is_admin ? 'admin' : 'user';
    const token = jwt.sign(
      { id: user.user_id, username: user.username, role, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.user_id,
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          level: user.user_level || 'beginner',
          role,
          is_admin: Boolean(user.is_admin)
        }
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.details,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Login failed',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
