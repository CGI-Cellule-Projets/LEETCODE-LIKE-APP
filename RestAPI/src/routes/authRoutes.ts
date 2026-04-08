import { Router } from 'express';
import { getCurrentUserProfile, loginUser, registerUser } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Route: POST /api/auth/register
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getCurrentUserProfile);

export default router;
