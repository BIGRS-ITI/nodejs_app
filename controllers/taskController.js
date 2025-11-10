const Task = require('../models/Task');
const { body, validationResult } = require('express-validator');

class TaskController {
  // Get all tasks
  static async getAllTasks(req, res) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority
      };

      const tasks = await Task.getAll(filters);

      res.json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    } catch (error) {
      console.error('Error in getAllTasks:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get task by ID
  static async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.getById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('Error in getTaskById:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new task
  static async createTask(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const task = await Task.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      console.error('Error in createTask:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update task
  static async updateTask(req, res) {
    try {
      const { id } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const task = await Task.update(id, req.body);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      console.error('Error in updateTask:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete task
  static async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Task.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteTask:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get statistics
  static async getStats(req, res) {
    try {
      const stats = await Task.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

// Validation rules
const taskValidationRules = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }).withMessage('Title too long'),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('due_date').optional().isISO8601().withMessage('Invalid date format')
  ],
  update: [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 255 }).withMessage('Title too long'),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('due_date').optional().isISO8601().withMessage('Invalid date format')
  ]
};

module.exports = { TaskController, taskValidationRules };
