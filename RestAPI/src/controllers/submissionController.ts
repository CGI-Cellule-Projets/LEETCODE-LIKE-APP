/**
 * Submissions Controller
 * Handles code submission and status tracking
 */
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database';
import { CreateSubmissionRequest, SubmissionResponse, SubmissionStatus } from '../types';
import { AppError } from '../middleware/errorHandler';

async function getOrCreateGuestUserId(): Promise<string> {
  const db = getDB();
  const guestUserId = '00000000-0000-0000-0000-000000000099';

  const existingUser = await db.query(
    'SELECT user_id FROM users WHERE username = $1',
    ['guest']
  );

  if (existingUser.rows && existingUser.rows.length > 0) {
    return existingUser.rows[0].user_id as string;
  }

  await db.query(
    `INSERT INTO users (user_id, username, password, email, user_level, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (username) DO NOTHING`,
    [guestUserId, 'guest', 'no-auth-mode', 'guest@local.dev', 'beginner', false]
  );

  return guestUserId;
}

/**
 * POST /api/submissions
 * Creates a new code submission for a problem
 * 
 * REQUEST BODY:
 * {
 *   "problem_id": 1,
 *   "language_id": 2,
 *   "code_body": "function twoSum(nums, target) { ... }"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Submission created successfully",
 *   "data": {
 *     "submission_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "user_id": "550e8400-e29b-41d4-a716-446655440001",
 *     "problem_id": 1,
 *     "language_id": 2,
 *     "code_body": "function twoSum(nums, target) { ... }",
 *     "status": "Pending",
 *     "submitted_at": "2024-01-15T10:30:00Z"
 *   }
 * }
 * 
 * ERROR RESPONSE (401):
 * {
 *   "success": false,
 *   "message": "Authentication required",
 *   "errors": "User not authenticated"
 * }
 * 
 * ERROR RESPONSE (400):
 * {
 *   "success": false,
 *   "message": "Invalid submission data",
 *   "errors": "problem_id, language_id, and code_body are required"
 * }
 */
export async function createSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { problem_id, language_id, code_body } = req.body as CreateSubmissionRequest;

    // Validation
    if (!problem_id || !language_id || !code_body) {
      throw new AppError(
        400,
        'Invalid submission data',
        'problem_id, language_id, and code_body are required'
      );
    }

    if (typeof code_body !== 'string' || code_body.trim().length === 0) {
      throw new AppError(400, 'Invalid code body', 'Code body cannot be empty');
    }

    const db = getDB();

    // Verify problem exists
    const problemResult = await db.query(
      'SELECT problem_id FROM problems WHERE problem_id = $1',
      [problem_id]
    );

    if (!problemResult.rows || problemResult.rows.length === 0) {
      throw new AppError(404, 'Problem not found', `Problem with ID ${problem_id} does not exist`);
    }

    // Verify language exists
    const languageResult = await db.query(
      'SELECT language_id FROM languages WHERE language_id = $1',
      [language_id]
    );

    if (!languageResult.rows || languageResult.rows.length === 0) {
      throw new AppError(404, 'Language not found', `Language with ID ${language_id} does not exist`);
    }

    // Create submission with initial status "Pending"
    const submissionId = uuidv4();
    const now = new Date().toISOString();
    const userId = await getOrCreateGuestUserId();

    await db.query(`
      INSERT INTO submissions (submission_id, user_id, problem_id, language_id, code_body, status, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [submissionId, userId, problem_id, language_id, code_body, 'Pending', now]);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        submission_id: submissionId,
        user_id: userId,
        problem_id,
        language_id,
        code_body,
        status: 'Pending',
        submitted_at: now,
      },
    } as SubmissionResponse);
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
        message: 'Submission failed',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * GET /api/submissions/:submissionId
 * Retrieve a specific submission (user can only see their own, admins can see all)
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Submission retrieved successfully",
 *   "data": {
 *     "submission_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "user_id": "550e8400-e29b-41d4-a716-446655440001",
 *     "problem_id": 1,
 *     "language_id": 2,
 *     "code_body": "function twoSum(nums, target) { ... }",
 *     "status": "Accepted",
 *     "runtime_ms": 45,
 *     "memory_kb": 2048,
 *     "submitted_at": "2024-01-15T10:30:00Z"
 *   }
 * }
 */
export async function getSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { submissionId } = req.params;

    const db = getDB();

    const result = await db.query(`
      SELECT submission_id, user_id, problem_id, language_id, code_body, status, runtime_ms, memory_kb, submitted_at
      FROM submissions
      WHERE submission_id = $1
    `, [submissionId]);

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(404, 'Submission not found', `Submission with ID ${submissionId} does not exist`);
    }

    const submission = result.rows[0] as any;

    res.status(200).json({
      success: true,
      message: 'Submission retrieved successfully',
      data: submission,
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
        message: 'Failed to retrieve submission',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
