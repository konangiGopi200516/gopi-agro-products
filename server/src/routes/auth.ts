import { Router } from 'express';
import { login, signup, getMe } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/signup', asyncHandler(signup));
router.get('/me', verifyToken, asyncHandler(getMe));

export default router;
