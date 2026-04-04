/**
 * Problems Routes
 * Public endpoints for retrieving problem information
 */
import { Router } from 'express';
import { getAllProblems, getProblemById } from '../controllers/problemController';

const router = Router();

router.get('/', getAllProblems);
router.get('/:id', getProblemById);

export default router;
