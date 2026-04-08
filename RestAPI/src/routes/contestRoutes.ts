import { Router } from 'express';
import { getContests, getContestById, getContestLeaderboard, registerForContest } from '../controllers/contestController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Route: GET /api/contests
router.get('/', getContests);

// Route: GET /api/contests/:id
router.get('/:id', getContestById);
router.get('/:id/leaderboard', getContestLeaderboard);

// Route: POST /api/contests/:id/register
router.post('/:id/register', requireAuth, registerForContest);

export default router;
