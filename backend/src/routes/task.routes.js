const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');

const taskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('title').isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
];

router.use(authenticate);

router.post('/', taskValidation, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
