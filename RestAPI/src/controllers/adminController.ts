/**
 * Admin Controller
 * Handles admin-only operations for problem and test case management
 */
import { Request, Response } from 'express';
import { getDB } from '../config/database';
import { CreateProblemRequest, UpdateProblemRequest, CreateTestCaseRequest, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

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
      SELECT problem_id, name, difficulty_level, solve_rate, description
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
    const { name, difficulty_level, description, is_published, constraints } = req.body as CreateProblemRequest;

    // Validation
    if (!name || !difficulty_level) {
      throw new AppError(400, 'Missing required fields', 'name and difficulty_level are required');
    }

    if (!['easy', 'med', 'hard'].includes(difficulty_level)) {
      throw new AppError(400, 'Invalid difficulty level', 'difficulty_level must be "easy", "med", or "hard"');
    }

    const db = getDB();

    // Insert problem
    const result = await db.query(`
      INSERT INTO problems (name, difficulty_level, solve_rate)
      VALUES ($1, $2, $3)
      RETURNING problem_id, name, difficulty_level, solve_rate
    `, [name, difficulty_level, 0.0]);

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
    const problemId = parseInt(id);
    const { name, difficulty_level, description, is_published, constraints } = req.body as UpdateProblemRequest;

    if (isNaN(problemId)) {
      throw new AppError(400, 'Invalid problem ID', 'Problem ID must be a valid number');
    }

    if (difficulty_level && !['easy', 'med', 'hard'].includes(difficulty_level)) {
      throw new AppError(400, 'Invalid difficulty level', 'difficulty_level must be "easy", "med", or "hard"');
    }

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
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramIndex++}`);
      values.push(difficulty_level);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No fields to update', 'Provide at least one field to update');
    }

    values.push(problemId);

    const query = `
      UPDATE problems
      SET ${updates.join(', ')}
      WHERE problem_id = $${paramIndex}
      RETURNING problem_id, name, difficulty_level, solve_rate
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
    const problemId = parseInt(id);

    if (isNaN(problemId)) {
      throw new AppError(400, 'Invalid problem ID', 'Problem ID must be a valid number');
    }

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
    const problemId = parseInt(id);
    const { input_data, expected_output, is_hidden } = req.body as CreateTestCaseRequest;

    if (isNaN(problemId)) {
      throw new AppError(400, 'Invalid problem ID', 'Problem ID must be a valid number');
    }

    // Validation
    if (input_data === undefined || expected_output === undefined || is_hidden === undefined) {
      throw new AppError(
        400,
        'Missing required fields',
        'input_data, expected_output, and is_hidden are required'
      );
    }

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
    `, [problemId, input_data, expected_output, is_hidden]);

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
