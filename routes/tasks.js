const express = require('express');
const router = express.Router();
const { TaskController, taskValidationRules } = require('../controllers/taskController');

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with optional filters
 * @query   status - Filter by status (pending, in-progress, completed)
 * @query   priority - Filter by priority (low, medium, high)
 * @access  Public
 */
router.get('/', TaskController.getAllTasks);

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics
 * @access  Public
 */
router.get('/stats', TaskController.getStats);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Public
 */
router.get('/:id', TaskController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @body    title, description, status, priority, due_date
 * @access  Public
 */
router.post('/', taskValidationRules.create, TaskController.createTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @body    title, description, status, priority, due_date
 * @access  Public
 */
router.put('/:id', taskValidationRules.update, TaskController.updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Public
 */
router.delete('/:id', TaskController.deleteTask);

module.exports = router;
