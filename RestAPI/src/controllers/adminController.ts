/**
 * Admin Controller
 * Handles admin-only operations for problem and test case management
 */
import { Request, Response } from 'express';
import { getDB } from '../config/database';
import { CreateProblemRequest, UpdateProblemRequest, CreateTestCaseRequest, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import {
  sanitizeBoolean,
  sanitizeInteger,
  sanitizeIsoDate,
  sanitizeOptionalText,
  sanitizeRequiredText,
} from '../utils/sanitize';

const allowedVisibilities = ['HIDDEN', 'CONTEST_ONLY', 'PUBLIC'] as const;

function resolveProblemVisibility(
  visibility: CreateProblemRequest['visibility'] | UpdateProblemRequest['visibility'] | undefined,
  isPublished: boolean | undefined,
): 'HIDDEN' | 'CONTEST_ONLY' | 'PUBLIC' | undefined {
  if (visibility !== undefined) {
    if (!allowedVisibilities.includes(visibility)) {
      throw new AppError(400, 'Invalid visibility', 'visibility must be HIDDEN, CONTEST_ONLY, or PUBLIC');
    }

    return visibility;
  }

  if (isPublished === undefined) {
    return undefined;
  }

  return isPublished ? 'PUBLIC' : 'HIDDEN';
}

/**
 * GET /api/admin/problems
 * Returns ALL problems including unpublished drafts (admin only)
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Problems retrieved successfully",
 *   "data": [
 *     {
 *       "problem_id": 1,
 *       "name": "Two Sum",
 *       "difficulty_level": "easy",
 *       "solve_rate": 45.50,
 *       "is_published": true,
 *       "description": "Given an array of integers..."
 *     }
 *   ]
 * }
 */
export async function getAllProblemsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const db = getDB();

    const result = await db.query(`
      SELECT problem_id, name, difficulty_level, solve_rate, description, constraints, visibility, is_published
      FROM problems
      ORDER BY problem_id ASC
    `);

    const problems = result.rows || [];

    res.status(200).json({
      success: true,
      message: 'Problems retrieved successfully',
      data: problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve problems',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/admin/stats
 * Returns dashboard counters for admin monitoring.
 */
export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const db = getDB();

    const [problemsResult, usersResult, submissionsResult] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM problems'),
      db.query('SELECT COUNT(*)::int AS total FROM users'),
      db.query('SELECT COUNT(*)::int AS total FROM submissions'),
    ]);

    res.status(200).json({
      success: true,
      message: 'Admin stats retrieved successfully',
      data: {
        totalProblems: Number(problemsResult.rows?.[0]?.total || 0),
        totalUsers: Number(usersResult.rows?.[0]?.total || 0),
        totalSubmissions: Number(submissionsResult.rows?.[0]?.total || 0),
        systemStatus: 'ONLINE',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin stats',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/admin/users
 * Returns users with activity metrics for admin listing.
 */
export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  try {
    const db = getDB();

    const result = await db.query(`
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.user_level,
        u.is_admin,
        COALESCE(COUNT(s.submission_id), 0)::int AS submissions_count,
        MAX(s.submitted_at) AS last_activity
      FROM users u
      LEFT JOIN submissions s ON s.user_id = u.user_id
      GROUP BY u.user_id, u.username, u.email, u.user_level, u.is_admin
      ORDER BY u.is_admin DESC, submissions_count DESC, u.username ASC
    `);

    const users = result.rows || [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const totalUsers = users.length;
    const totalAdmins = users.filter((user: any) => Boolean(user.is_admin)).length;
    const active24h = users.filter((user: any) => {
      if (!user.last_activity) return false;
      return now - new Date(user.last_activity).getTime() <= oneDayMs;
    }).length;

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        stats: {
          totalUsers,
          totalAdmins,
          active24h,
          suspended: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/admin/problems/:id
 * Returns a problem with all of its test cases for admin editing
 */
export async function getProblemByIdAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const problemId = sanitizeInteger(id, 'problem ID', { min: 1 });

    const db = getDB();

    const problemResult = await db.query(`
      SELECT problem_id, name, difficulty_level, solve_rate, description, constraints, visibility, is_published
      FROM problems
      WHERE problem_id = $1
    `, [problemId]);

    if (!problemResult.rows || problemResult.rows.length === 0) {
      throw new AppError(404, 'Problem not found', `Problem with ID ${problemId} does not exist`);
    }

    const testCasesResult = await db.query(`
      SELECT test_case_id, problem_id, input_data, expected_output, is_hidden
      FROM test_cases
      WHERE problem_id = $1
      ORDER BY test_case_id ASC
    `, [problemId]);

    res.status(200).json({
      success: true,
      message: 'Problem retrieved successfully',
      data: {
        ...problemResult.rows[0],
        test_cases: testCasesResult.rows || [],
      },
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
        message: 'Failed to retrieve problem',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * POST /api/admin/problems
 * Create a new problem
 * 
 * REQUEST BODY:
 * {
 *   "name": "Two Sum",
 *   "difficulty_level": "easy",
 *   "description": "Given an array of integers nums and an integer target...",
 *   "is_published": false,
 *   "constraints": "1 <= nums.length <= 10^4..."
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Problem created successfully",
 *   "data": {
 *     "problem_id": 1,
 *     "name": "Two Sum",
 *     "difficulty_level": "easy",
 *     "solve_rate": 0.00,
 *     "description": "Given an array of integers...",
 *     "is_published": false
 *   }
 * }
 */
export async function createProblem(req: Request, res: Response): Promise<void> {
  try {
    const { name, difficulty_level, description, is_published, constraints, visibility } = req.body as CreateProblemRequest;
    const safeName = sanitizeRequiredText(name, {
      fieldName: 'name',
      maxLength: 255,
    });
    const safeDescription = sanitizeOptionalText(description, {
      fieldName: 'description',
      maxLength: 10000,
      preserveNewlines: true,
    });
    const safeConstraints = sanitizeOptionalText(constraints, {
      fieldName: 'constraints',
      maxLength: 5000,
      preserveNewlines: true,
    });

    if (!['easy', 'med', 'hard'].includes(difficulty_level)) {
      throw new AppError(400, 'Invalid difficulty level', 'difficulty_level must be "easy", "med", or "hard"');
    }

    const safePublished = is_published === undefined
      ? false
      : sanitizeBoolean(is_published, 'is_published');
    const safeVisibility = resolveProblemVisibility(visibility, safePublished) || 'HIDDEN';

    const db = getDB();

    // Insert problem
    const result = await db.query(`
      INSERT INTO problems (name, difficulty_level, description, is_published, constraints, solve_rate, visibility)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING problem_id, name, difficulty_level, solve_rate, description, is_published, constraints, visibility
    `, [safeName, difficulty_level, safeDescription ?? null, safePublished, safeConstraints ?? null, 0.0, safeVisibility]);

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(500, 'Failed to create problem', 'Database insertion failed');
    }

    const problem = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem,
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
        message: 'Failed to create problem',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * PUT /api/admin/problems/:id
 * Update an existing problem
 * 
 * REQUEST BODY:
 * {
 *   "name": "Two Sum (Updated)",
 *   "difficulty_level": "medium",
 *   "description": "Updated description..."
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Problem updated successfully",
 *   "data": {
 *     "problem_id": 1,
 *     "name": "Two Sum (Updated)",
 *     "difficulty_level": "med",
 *     "solve_rate": 45.50
 *   }
 * }
 */
export async function updateProblem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const problemId = sanitizeInteger(id, 'problem ID', { min: 1 });
    const { name, difficulty_level, description, is_published, constraints, visibility } = req.body as UpdateProblemRequest;

    if (difficulty_level && !['easy', 'med', 'hard'].includes(difficulty_level)) {
      throw new AppError(400, 'Invalid difficulty level', 'difficulty_level must be "easy", "med", or "hard"');
    }

    const safePublished = is_published === undefined
      ? undefined
      : sanitizeBoolean(is_published, 'is_published');
    const safeVisibility = resolveProblemVisibility(visibility, safePublished);

    const db = getDB();

    // Verify problem exists
    const problemResult = await db.query(
      'SELECT problem_id FROM problems WHERE problem_id = $1',
      [problemId]
    );

    if (!problemResult.rows || problemResult.rows.length === 0) {
      throw new AppError(404, 'Problem not found', `Problem with ID ${problemId} does not exist`);
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      const safeName = sanitizeRequiredText(name, {
        fieldName: 'name',
        maxLength: 255,
      });
      updates.push(`name = $${paramIndex++}`);
      values.push(safeName);
    }
    if (difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramIndex++}`);
      values.push(difficulty_level);
    }
    if (description !== undefined) {
      const safeDescription = sanitizeOptionalText(description, {
        fieldName: 'description',
        maxLength: 10000,
        preserveNewlines: true,
      });
      updates.push(`description = $${paramIndex++}`);
      values.push(safeDescription);
    }
    if (safePublished !== undefined) {
      updates.push(`is_published = $${paramIndex++}`);
      values.push(safePublished);
    }
    if (constraints !== undefined) {
      const safeConstraints = sanitizeOptionalText(constraints, {
        fieldName: 'constraints',
        maxLength: 5000,
        preserveNewlines: true,
      });
      updates.push(`constraints = $${paramIndex++}`);
      values.push(safeConstraints);
    }
    if (safeVisibility !== undefined) {
      updates.push(`visibility = $${paramIndex++}`);
      values.push(safeVisibility);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No fields to update', 'Provide at least one field to update');
    }

    values.push(problemId);

    const query = `
      UPDATE problems
      SET ${updates.join(', ')}
      WHERE problem_id = $${paramIndex}
      RETURNING problem_id, name, difficulty_level, solve_rate, description, is_published, constraints, visibility
    `;

    const result = await db.query(query, values);

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(500, 'Failed to update problem', 'Update operation failed');
    }

    res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: result.rows[0],
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
        message: 'Failed to update problem',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * DELETE /api/admin/problems/:id
 * Delete a problem and all its test cases (cascade)
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Problem deleted successfully"
 * }
 */
export async function deleteProblem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const problemId = sanitizeInteger(id, 'problem ID', { min: 1 });

    const db = getDB();

    // Verify problem exists
    const problemResult = await db.query(
      'SELECT problem_id FROM problems WHERE problem_id = $1',
      [problemId]
    );

    if (!problemResult.rows || problemResult.rows.length === 0) {
      throw new AppError(404, 'Problem not found', `Problem with ID ${problemId} does not exist`);
    }

    // Delete problem (cascade will delete test cases)
    await db.query('DELETE FROM problems WHERE problem_id = $1', [problemId]);

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully',
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
        message: 'Failed to delete problem',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * POST /api/admin/problems/:id/testcases
 * Add test cases to a problem
 * 
 * REQUEST BODY:
 * {
 *   "input_data": "[2,7,11,15], target = 9",
 *   "expected_output": "[0,1]",
 *   "is_hidden": false
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Test case added successfully",
 *   "data": {
 *     "test_case_id": 1,
 *     "problem_id": 1,
 *     "input_data": "[2,7,11,15], target = 9",
 *     "expected_output": "[0,1]",
 *     "is_hidden": false
 *   }
 * }
 */
export async function addTestCase(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const problemId = sanitizeInteger(id, 'problem ID', { min: 1 });
    const { input_data, expected_output, is_hidden } = req.body as CreateTestCaseRequest;

    // Validation
    if (input_data === undefined || expected_output === undefined || is_hidden === undefined) {
      throw new AppError(
        400,
        'Missing required fields',
        'input_data, expected_output, and is_hidden are required'
      );
    }

    const safeInput = sanitizeRequiredText(input_data, {
      fieldName: 'input_data',
      maxLength: 20000,
      preserveNewlines: true,
    });
    const safeExpectedOutput = sanitizeRequiredText(expected_output, {
      fieldName: 'expected_output',
      maxLength: 20000,
      preserveNewlines: true,
    });
    const safeHiddenFlag = sanitizeBoolean(is_hidden, 'is_hidden');

    const db = getDB();

    // Verify problem exists
    const problemResult = await db.query(
      'SELECT problem_id FROM problems WHERE problem_id = $1',
      [problemId]
    );

    if (!problemResult.rows || problemResult.rows.length === 0) {
      throw new AppError(404, 'Problem not found', `Problem with ID ${problemId} does not exist`);
    }

    // Insert test case
    const result = await db.query(`
      INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
      VALUES ($1, $2, $3, $4)
      RETURNING test_case_id, problem_id, input_data, expected_output, is_hidden
    `, [problemId, safeInput, safeExpectedOutput, safeHiddenFlag]);

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(500, 'Failed to add test case', 'Database insertion failed');
    }

    res.status(201).json({
      success: true,
      message: 'Test case added successfully',
      data: result.rows[0],
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
        message: 'Failed to add test case',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * POST /api/admin/contests
 * Create a new contest
 */
export async function createContestAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, start_time, end_time } = req.body;
    const safeTitle = sanitizeRequiredText(title, {
      fieldName: 'title',
      maxLength: 160,
    });
    const safeDescription = sanitizeOptionalText(description, {
      fieldName: 'description',
      maxLength: 4000,
      preserveNewlines: true,
    });
    const safeStartTime = sanitizeIsoDate(start_time, 'start_time');
    const safeEndTime = sanitizeIsoDate(end_time, 'end_time');

    if (new Date(safeEndTime).getTime() <= new Date(safeStartTime).getTime()) {
      throw new AppError(400, 'Invalid contest schedule', 'end_time must be later than start_time');
    }

    const db = getDB();

    const result = await db.query(`
      INSERT INTO contests (title, description, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING contest_id, title, start_time, end_time, description
    `, [safeTitle, safeDescription ?? null, safeStartTime, safeEndTime]);

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(500, 'Failed to create contest', 'Database insertion failed');
    }

    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message, errors: error.details });
    } else {
      res.status(500).json({ success: false, message: 'Creation failed', errors: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

/**
 * PUT /api/admin/contests/:id
 * Update an existing contest
 */
export async function updateContestAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contestId = sanitizeInteger(id, 'contest ID', { min: 1 });
    const { title, description, start_time, end_time } = req.body;

    const db = getDB();
    const existingContestResult = await db.query(
      'SELECT contest_id, start_time, end_time FROM contests WHERE contest_id = $1',
      [contestId],
    );

    if (!existingContestResult.rows || existingContestResult.rows.length === 0) {
      throw new AppError(404, 'Contest not found', `Contest ${contestId} does not exist`);
    }

    const existingContest = existingContestResult.rows[0] as { start_time: string; end_time: string };

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    let nextStartTime: string | undefined;
    let nextEndTime: string | undefined;

    if (title !== undefined) {
      const safeTitle = sanitizeRequiredText(title, {
        fieldName: 'title',
        maxLength: 160,
      });
      updates.push(`title = $${paramIndex++}`);
      values.push(safeTitle);
    }
    if (description !== undefined) {
      const safeDescription = sanitizeOptionalText(description, {
        fieldName: 'description',
        maxLength: 4000,
        preserveNewlines: true,
      });
      updates.push(`description = $${paramIndex++}`);
      values.push(safeDescription);
    }
    if (start_time !== undefined) {
      nextStartTime = sanitizeIsoDate(start_time, 'start_time');
      updates.push(`start_time = $${paramIndex++}`);
      values.push(nextStartTime);
    }
    if (end_time !== undefined) {
      nextEndTime = sanitizeIsoDate(end_time, 'end_time');
      updates.push(`end_time = $${paramIndex++}`);
      values.push(nextEndTime);
    }

    const effectiveStartTime = nextStartTime || existingContest.start_time;
    const effectiveEndTime = nextEndTime || existingContest.end_time;
    if (new Date(effectiveEndTime).getTime() <= new Date(effectiveStartTime).getTime()) {
      throw new AppError(400, 'Invalid contest schedule', 'end_time must be later than start_time');
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No fields to update', 'Provide at least one valid field to update');
    }

    values.push(contestId);

    const result = await db.query(`
      UPDATE contests
      SET ${updates.join(', ')}
      WHERE contest_id = $${paramIndex}
      RETURNING contest_id, title, start_time, end_time, description
    `, values);

    if (!result.rows || result.rows.length === 0) {
      throw new AppError(404, 'Failed to update contest', 'Contest not found or update failed');
    }

    res.status(200).json({
      success: true,
      message: 'Contest updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message, errors: error.details });
    } else {
      res.status(500).json({ success: false, message: 'Update failed', errors: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

/**
 * POST /api/admin/contests/:id/problems
 * Overwrite or assign problems to a contest
 * Expects: { problems: [ { problem_id: 1, points: 100 }, ... ] }
 */
export async function assignContestProblems(req: Request, res: Response): Promise<void> {
  let didBeginTransaction = false;
  try {
    const { id } = req.params;
    const contestId = sanitizeInteger(id, 'contest ID', { min: 1 });
    const { problems } = req.body;
    if (!Array.isArray(problems)) {
      throw new AppError(400, 'Invalid payload', 'problems must be an array of objects');
    }
    if (problems.length === 0) {
      throw new AppError(400, 'Invalid payload', 'problems must contain at least one problem mapping');
    }

    const db = getDB();

    // Verify contest first
    const verify = await db.query('SELECT contest_id FROM contests WHERE contest_id = $1', [contestId]);
    if (!verify.rows || verify.rows.length === 0) {
      throw new AppError(404, 'Contest not found', `Contest ${contestId} does not exist`);
    }

    // Begin mapping manipulation
    await db.query('BEGIN');
    didBeginTransaction = true;
    
    await db.query('DELETE FROM contest_problems WHERE contest_id = $1', [contestId]);

    for (const prob of problems) {
      const safeProblemId = sanitizeInteger(prob?.problem_id, 'problem_id', { min: 1 });
      const pts = prob?.points === undefined
        ? 100
        : sanitizeInteger(prob.points, 'points', { min: 1, max: 10000 });

      // Keep contest problem writes inside one transaction so partial remaps cannot leak through.
      await db.query(`
        INSERT INTO contest_problems (contest_id, problem_id, points)
        VALUES ($1, $2, $3)
      `, [contestId, safeProblemId, pts]);

      await db.query(`
        UPDATE problems
        SET visibility = 'CONTEST_ONLY'
        WHERE problem_id = $1
      `, [safeProblemId]);
    }

    await db.query('COMMIT');
    didBeginTransaction = false;

    res.status(201).json({
      success: true,
      message: 'Problems successfully assigned to the contest',
    });
  } catch (error) {
    if (didBeginTransaction) {
      const db = getDB();
      try {
        await db.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback contest assignment transaction:', rollbackError);
      }
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message, errors: error.details });
    } else {
      res.status(500).json({ success: false, message: 'Assignment failed', errors: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
