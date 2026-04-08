import { Request, Response } from 'express';
import { getDB } from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/contests
 * Returns upcoming, active, and past contests
 */
export async function getContests(req: Request, res: Response): Promise<void> {
  try {
    const db = getDB();
    const result = await db.query(`
      SELECT contest_id, title, start_time, end_time, description
      FROM contests
      ORDER BY start_time DESC
    `);

    const contests = result.rows || [];
    const now = new Date().getTime();

    const upcoming = contests.filter(c => new Date(c.start_time).getTime() > now);
    const active = contests.filter(c => new Date(c.start_time).getTime() <= now && new Date(c.end_time).getTime() >= now);
    const past = contests.filter(c => new Date(c.end_time).getTime() < now);

    res.status(200).json({
      success: true,
      message: 'Contests retrieved successfully',
      data: {
        upcoming,
        active,
        past,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contests',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/contests/:id
 * Returns specific contest details including problems
 */
export async function getContestById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contestId = parseInt(id);

    if (isNaN(contestId)) {
      throw new AppError(400, 'Invalid contest ID', 'Contest ID must be a valid number');
    }

    const db = getDB();

    const contestResult = await db.query(`
      SELECT contest_id, title, start_time, end_time, description
      FROM contests
      WHERE contest_id = $1
    `, [contestId]);

    if (!contestResult.rows || contestResult.rows.length === 0) {
      throw new AppError(404, 'Contest not found', `Contest with ID ${contestId} does not exist`);
    }

    const contest = contestResult.rows[0] as any;
    const now = new Date();
    const contestStart = new Date(contest.start_time);
    const isPreStart = now.getTime() < contestStart.getTime();

    if (isPreStart) {
      // Pre-start lock: return only placeholders and points, no statement or test data.
      const lockedProblemsResult = await db.query(`
        SELECT cp.problem_id, cp.points
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.problem_id
        WHERE cp.contest_id = $1 AND p.visibility IN ('CONTEST_ONLY', 'PUBLIC')
        ORDER BY cp.problem_id ASC
      `, [contestId]);

      contest.problems = (lockedProblemsResult.rows || []).map((row: any) => ({
        problem_id: row.problem_id,
        points: row.points,
        locked: true,
        name: 'Locked until contest start',
        description: null,
        constraints: null,
        public_test_cases: []
      }));
    } else {
      const problemsResult = await db.query(`
        SELECT p.problem_id, p.name, p.difficulty_level, p.description, p.constraints, cp.points
        FROM contest_problems cp
        JOIN problems p ON cp.problem_id = p.problem_id
        WHERE cp.contest_id = $1 AND p.visibility IN ('CONTEST_ONLY', 'PUBLIC')
        ORDER BY cp.problem_id ASC
      `, [contestId]);

      const problems = problemsResult.rows || [];

      for (const problem of problems) {
        const testCasesResult = await db.query(`
          SELECT test_case_id, problem_id, input_data, expected_output, is_hidden
          FROM test_cases
          WHERE problem_id = $1 AND is_hidden = false
          ORDER BY test_case_id ASC
        `, [problem.problem_id]);

        problem.public_test_cases = testCasesResult.rows || [];
      }

      contest.problems = problems;
    }

    res.status(200).json({
      success: true,
      message: 'Contest retrieved successfully',
      data: contest,
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
        message: 'Failed to retrieve contest',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * POST /api/contests/:id/register
 * Protected route to register authenticated user for a contest
 */
export async function registerForContest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contestId = parseInt(id);

    if (isNaN(contestId)) {
      throw new AppError(400, 'Invalid contest ID', 'Contest ID must be a valid number');
    }

    const userId = req.user?.user_id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized', 'User identity required missing from request context');
    }

    const db = getDB();

    // Verify contest exists
    const contestResult = await db.query(
      'SELECT contest_id FROM contests WHERE contest_id = $1',
      [contestId]
    );

    if (!contestResult.rows || contestResult.rows.length === 0) {
      throw new AppError(404, 'Contest not found', `Contest with ID ${contestId} does not exist`);
    }

    // Insert registration
    await db.query(`
      INSERT INTO contest_registrations (user_id, contest_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, contest_id) DO NOTHING
    `, [userId, contestId]);

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the contest',
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
        message: 'Registration failed',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

function formatSecondsToMMSS(totalSeconds: number | null): string {
  if (!Number.isFinite(totalSeconds as number) || totalSeconds === null) {
    return '--';
  }

  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * GET /api/contests/:id/leaderboard
 * Returns database-backed leaderboard entries for a contest.
 */
export async function getContestLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contestId = parseInt(id, 10);

    if (isNaN(contestId)) {
      throw new AppError(400, 'Invalid contest ID', 'Contest ID must be a valid number');
    }

    const db = getDB();

    const contestResult = await db.query(
      'SELECT contest_id, start_time, end_time FROM contests WHERE contest_id = $1',
      [contestId]
    );

    if (!contestResult.rows || contestResult.rows.length === 0) {
      throw new AppError(404, 'Contest not found', `Contest with ID ${contestId} does not exist`);
    }

    const rawEntries = await db.query(`
      WITH contest_window AS (
        SELECT contest_id, start_time, end_time
        FROM contests
        WHERE contest_id = $1
      ),
      contest_problem_set AS (
        SELECT cp.problem_id, cp.points
        FROM contest_problems cp
        WHERE cp.contest_id = $1
      ),
      accepted AS (
        SELECT
          s.user_id,
          s.problem_id,
          MIN(s.submitted_at) AS first_accepted_at
        FROM submissions s
        JOIN contest_problem_set cps ON cps.problem_id = s.problem_id
        JOIN contest_window cw ON s.submitted_at BETWEEN cw.start_time AND cw.end_time
        WHERE s.status = 'Accepted'
        GROUP BY s.user_id, s.problem_id
      ),
      scored AS (
        SELECT
          a.user_id,
          SUM(cps.points)::int AS score_total,
          MAX(a.first_accepted_at) AS last_solve_at
        FROM accepted a
        JOIN contest_problem_set cps ON cps.problem_id = a.problem_id
        GROUP BY a.user_id
      ),
      participants AS (
        SELECT DISTINCT cr.user_id
        FROM contest_registrations cr
        WHERE cr.contest_id = $1
        UNION
        SELECT DISTINCT a.user_id
        FROM accepted a
      )
      SELECT
        u.user_id,
        u.username,
        COALESCE(sc.score_total, 0)::int AS score_total,
        CASE
          WHEN sc.last_solve_at IS NULL THEN NULL
          ELSE EXTRACT(EPOCH FROM (sc.last_solve_at - cw.start_time))::int
        END AS solve_seconds
      FROM participants p
      JOIN users u ON u.user_id = p.user_id
      JOIN contest_window cw ON TRUE
      LEFT JOIN scored sc ON sc.user_id = p.user_id
      ORDER BY score_total DESC, solve_seconds ASC NULLS LAST, u.username ASC
    `, [contestId]);

    const entries = (rawEntries.rows || []).map((row: any, index: number) => ({
      user_id: row.user_id,
      username: row.username,
      rank: index + 1,
      score_total: Number(row.score_total || 0),
      solve_seconds: row.solve_seconds === null ? null : Number(row.solve_seconds),
      temps_de_resolution: formatSecondsToMMSS(
        row.solve_seconds === null ? null : Number(row.solve_seconds),
      ),
    }));

    res.status(200).json({
      success: true,
      message: 'Contest leaderboard retrieved successfully',
      data: entries,
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
      message: 'Failed to retrieve contest leaderboard',
      errors: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
