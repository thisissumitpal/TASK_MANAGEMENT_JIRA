import express from 'express';
import { body } from 'express-validator';
import { addComment, deleteComment, editComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

const commentCreateValidation = [
  body('taskId').trim().notEmpty().withMessage('Task ID is required'),
  body('content').trim().notEmpty().withMessage('Comment content cannot be empty'),
];

const commentEditValidation = [
  body('content').trim().notEmpty().withMessage('Comment content cannot be empty'),
];

router.post('/', protect, commentCreateValidation, validateRequest, addComment);
router.put('/:id', protect, commentEditValidation, validateRequest, editComment);
router.delete('/:id', protect, deleteComment);

export default router;
