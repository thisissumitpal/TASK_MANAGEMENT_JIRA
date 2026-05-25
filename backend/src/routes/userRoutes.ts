import express from 'express';
import { getAllUsers, getMe } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.get('/', protect, getAllUsers);

export default router;
