/**
 * Problems Controller
 * Handles problem-related endpoints
 */
import { Request, Response } from 'express';
import { getDB } from '../config/database';
import { Problem, ProblemDetails, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/problems
 * Returns all published problems with basic info
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
 *       "solve_rate": 45.50
 *     }
 *   ]
 * }
 */
export async function getAllProblems(req: Request, res: Response): Promise<void> {
  try {
    const db = getDB();

    const result = await db.query(`
      SELECT problem_id, name, difficulty_level, solve_rate
      FROM problems
      WHERE visibility = 'PUBLIC'
      ORDER BY problem_id ASC
    `);

    const problems = result.rows || [];

    res.status(200).json({
      success: true,
      message: 'Problems retrieved successfully',
      data: problems,
    } as ApiResponse<Problem[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve problems',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/problems/:id
 * Returns problem details with ONLY public test cases
 * SECURITY: Never return is_hidden=true test cases
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Problem retrieved successfully",
 *   "data": {
 *     "problem_id": 1,
 *     "name": "Two Sum",
 *     "difficulty_level": "easy",
 *     "solve_rate": 45.50,
 *     "description": "Given an array of integers, return...",
 *     "constraints": "1 <= nums.length <= 10^4...",
 *     "public_test_cases": [
 *       {
 *         "test_case_id": 1,
 *         "problem_id": 1,
 *         "input_data": "[2,7,11,15], target = 9",
 *         "expected_output": "[0,1]",
 *         "is_hidden": false
 *       }
 *     ]
 *   }
 * }
 */
export async function getProblemById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const problemId = parseInt(id);

    if (isNaN(problemId)) {
      throw new AppError(400, 'Invalid problem ID', 'Problem ID must be a valid number');
    }

    const db = getDB();

    // Get problem details
    const problemResult = await db.query(`
      SELECT problem_id, name, difficulty_level, solve_rate, description, constraints
      FROM problems
      WHERE problem_id = $1 AND visibility = 'PUBLIC'
    `, [problemId]);

    if (!problemResult.rows || problemResult.rows.length === 0) {
      throw new AppError(404, 'Problem not found', `Problem with ID ${problemId} does not exist`);
    }

    const problem = problemResult.rows[0] as any;

    // Get ONLY public test cases (is_hidden = false)
    const testCasesResult = await db.query(`
      SELECT test_case_id, problem_id, input_data, expected_output, is_hidden
      FROM test_cases
      WHERE problem_id = $1 AND is_hidden = false
      ORDER BY test_case_id ASC
    `, [problemId]);

    const publicTestCases = testCasesResult.rows || [];

    res.status(200).json({
      success: true,
      message: 'Problem retrieved successfully',
      data: {
        ...problem,
        public_test_cases: publicTestCases,
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
