/**
 * Submissions Routes
 * Protected endpoints for user submissions
 */
import { Router } from 'express';
import { createSubmission, getSubmission } from '../controllers/submissionController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireAuth, createSubmission);
router.get('/:submissionId', requireAuth, getSubmission);

export default router;
