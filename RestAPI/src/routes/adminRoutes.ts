/**
 * Admin Routes
 * Protected endpoints for admin problem management
 */
import { Router } from 'express';
import {
  getAllProblemsAdmin,
  createProblem,
  updateProblem,
  deleteProblem,
  addTestCase,
  createContestAdmin,
  updateContestAdmin,
  assignContestProblems
} from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Problem Management
router.get('/problems', getAllProblemsAdmin);
router.post('/problems', createProblem);
router.put('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);
router.post('/problems/:id/testcases', addTestCase);

// Contest Management (Strictly Protected)
router.post('/contests', requireAuth, requireAdmin, createContestAdmin);
router.put('/contests/:id', requireAuth, requireAdmin, updateContestAdmin);
router.post('/contests/:id/problems', requireAuth, requireAdmin, assignContestProblems);

export default router;
