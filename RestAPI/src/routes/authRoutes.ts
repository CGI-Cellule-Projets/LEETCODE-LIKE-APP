import { Router } from 'express';
import { registerUser } from '../controllers/authController';

const router = Router();

// Route: POST /api/auth/register
router.post('/register', registerUser);

export default router;
