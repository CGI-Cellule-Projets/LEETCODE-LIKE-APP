import { Request, Response } from 'express';
import { getDB } from '../config/database';
import { JWT_SECRET, JWT_EXPIRY } from '../config/jwt';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeRequiredText,
} from '../utils/sanitize';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeStreakDays(activityByDate: Record<string, number>): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = toDateKey(date);

    if (Number(activityByDate[key] || 0) > 0) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

/**
 * POST /api/auth/register
 * 
 * Registers a new user.
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;
    const normalizedUsername = sanitizeRequiredText(username, {
      fieldName: 'username',
      maxLength: 64,
    });
    const normalizedEmail = sanitizeEmail(email);
    const safePassword = sanitizePassword(password);

    // 1. Validation
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
    const hashedPassword = await bcrypt.hash(safePassword, saltRounds);

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
    const normalizedEmail = sanitizeEmail(email);
    const safePassword = sanitizePassword(password);

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

    const isValidPassword = await bcrypt.compare(safePassword, user.password);
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

export async function getCurrentUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      throw new AppError(401, 'Authentication required', 'User not authenticated');
    }

    const db = getDB();

    const userResult = await db.query(
      `SELECT user_id, username, email, user_level, is_admin
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      throw new AppError(404, 'User not found', `User with ID ${userId} does not exist`);
    }

    const user = userResult.rows[0] as {
      user_id: string;
      username: string;
      email: string;
      user_level: string;
      is_admin: boolean;
    };

    const summaryResult = await db.query(
      `SELECT
         COALESCE((SELECT COUNT(*)::int FROM submissions WHERE user_id = $1), 0) AS submission_count,
         COALESCE((SELECT COUNT(*)::int FROM submissions WHERE user_id = $1 AND status = 'Accepted'), 0) AS accepted_submission_count,
         COALESCE((SELECT COUNT(*)::int FROM user_problem WHERE user_id = $1 AND status = 'solved'), 0) AS solved_count,
         COALESCE((SELECT COUNT(*)::int FROM user_problem WHERE user_id = $1 AND status = 'attempted'), 0) AS attempted_count,
         COALESCE((SELECT COUNT(*)::int FROM user_problem up
                   JOIN problems p ON p.problem_id = up.problem_id
                   WHERE up.user_id = $1 AND up.status = 'solved' AND p.difficulty_level = 'easy'), 0) AS easy_solved,
         COALESCE((SELECT COUNT(*)::int FROM user_problem up
                   JOIN problems p ON p.problem_id = up.problem_id
                   WHERE up.user_id = $1 AND up.status = 'solved' AND p.difficulty_level = 'med'), 0) AS medium_solved,
         COALESCE((SELECT COUNT(*)::int FROM user_problem up
                   JOIN problems p ON p.problem_id = up.problem_id
                   WHERE up.user_id = $1 AND up.status = 'solved' AND p.difficulty_level = 'hard'), 0) AS hard_solved,
         COALESCE((SELECT ROUND(AVG(runtime_ms))::int
                   FROM submissions
                   WHERE user_id = $1 AND status = 'Accepted' AND runtime_ms IS NOT NULL), 0) AS avg_runtime_ms`,
      [userId]
    );

    const activityResult = await db.query(
      `SELECT
         TO_CHAR(submitted_at::date, 'YYYY-MM-DD') AS day,
         COUNT(*)::int AS count
       FROM submissions
       WHERE user_id = $1
         AND submitted_at >= CURRENT_DATE - INTERVAL '365 days'
       GROUP BY submitted_at::date
       ORDER BY day ASC`,
      [userId]
    );

    const solvedTagsResult = await db.query(
      `SELECT t.name, COUNT(*)::int AS solved_count
       FROM user_problem up
       JOIN problem_topics pt ON pt.problem_id = up.problem_id
       JOIN topics t ON t.topic_id = pt.topic_id
       WHERE up.user_id = $1 AND up.status = 'solved'
       GROUP BY t.name
       ORDER BY t.name ASC`,
      [userId]
    );

    const summary = (summaryResult.rows && summaryResult.rows[0]) || {};
    const activityByDate = (activityResult.rows || []).reduce<Record<string, number>>((accumulator, row: any) => {
      accumulator[String(row.day)] = Number(row.count || 0);
      return accumulator;
    }, {});

    const solvedByTag = (solvedTagsResult.rows || []).reduce<Record<string, number>>((accumulator, row: any) => {
      accumulator[String(row.name)] = Number(row.solved_count || 0);
      return accumulator;
    }, {});

    const role = user.is_admin ? 'admin' : 'user';

    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved successfully',
      data: {
        user: {
          id: user.user_id,
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          level: user.user_level || 'beginner',
          role,
          is_admin: Boolean(user.is_admin),
        },
        stats: {
          submissionCount: Number(summary.submission_count || 0),
          acceptedSubmissionCount: Number(summary.accepted_submission_count || 0),
          solvedCount: Number(summary.solved_count || 0),
          attemptedCount: Number(summary.attempted_count || 0),
          avgRuntimeMs: Number(summary.avg_runtime_ms || 0),
          solvedByDifficulty: {
            easy: Number(summary.easy_solved || 0),
            medium: Number(summary.medium_solved || 0),
            hard: Number(summary.hard_solved || 0),
          },
          solvedByTag,
          activityByDate,
          activeStreakDays: computeStreakDays(activityByDate),
        },
      },
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
      message: 'Failed to retrieve current user profile',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
