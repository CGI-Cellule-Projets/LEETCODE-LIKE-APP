import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/authController';

const router = Router();

// Route: POST /api/auth/register
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
