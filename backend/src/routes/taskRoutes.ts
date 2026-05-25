import express from 'express';
import { body } from 'express-validator';
import {
  createTask,
  deleteTask,
  getDashboardMetrics,
  getTaskById,
  getTasks,
  updateTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

const taskCreateValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('status')
    .optional()
    .isIn(['Todo', 'In Progress', 'Review', 'Done'])
    .withMessage('Invalid task status'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid task priority'),
  body('dueDate')
    .optional()
    .custom((val: string) => {
      if (val && isNaN(Date.parse(val))) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    }),
  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array of strings'),
];

router.get('/', protect, getTasks);
router.get('/dashboard', protect, getDashboardMetrics);
router.get('/:id', protect, getTaskById);
router.post('/', protect, taskCreateValidation, validateRequest, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

export default router;
