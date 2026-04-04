/**
 * Submissions Routes
 * Protected endpoints for user submissions
 */
import { Router } from 'express';
import { createSubmission, getSubmission } from '../controllers/submissionController';

const router = Router();

router.post('/', createSubmission);
router.get('/:submissionId', getSubmission);

export default router;
