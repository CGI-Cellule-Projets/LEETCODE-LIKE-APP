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

    // 1. Validation
    if (!username || !email || !password) {
      throw new AppError(400, 'All fields are required', 'Missing username, email, or password in the request body');
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'Invalid email format', 'The provided email is not a valid email address');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password too short', 'Password must be at least 6 characters long');
    }

    const db = getDB();

    // 2. Duplication Check
    const existingUser = await db.query(
      `SELECT user_id, username, email FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (existingUser.rows && existingUser.rows.length > 0) {
      const conflictMsg = existingUser.rows[0].email === email 
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
      [newUserId, username, email, hashedPassword]
    );

    // 5. Success Response
    const token = jwt.sign(
      { id: newUserId, username, role: 'user' },
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
          username,
          email,
          level: 'beginner'
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
