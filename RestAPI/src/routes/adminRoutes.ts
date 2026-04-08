/**
 * Admin Routes
 * Protected endpoints for admin problem management
 */
import { Router } from 'express';
import {
  getAllProblemsAdmin,
  getAdminStats,
  getProblemByIdAdmin,
  createProblem,
  updateProblem,
  deleteProblem,
  addTestCase,
  createContestAdmin,
  updateContestAdmin,
  assignContestProblems
} from '../controllers/adminController';
import { requireAdminAccess } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAdminAccess);

// Problem Management
router.get('/stats', getAdminStats);
router.get('/problems', getAllProblemsAdmin);
router.get('/problems/:id', getProblemByIdAdmin);
router.post('/problems', createProblem);
router.put('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);
router.post('/problems/:id/testcases', addTestCase);

// Contest Management
router.post('/contests', createContestAdmin);
router.put('/contests/:id', updateContestAdmin);
router.post('/contests/:id/problems', assignContestProblems);

export default router;
