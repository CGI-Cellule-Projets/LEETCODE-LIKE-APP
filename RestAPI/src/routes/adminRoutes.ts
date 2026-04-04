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
} from '../controllers/adminController';

const router = Router();

router.get('/problems', getAllProblemsAdmin);
router.post('/problems', createProblem);
router.put('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);
router.post('/problems/:id/testcases', addTestCase);

export default router;
