const { pool } = require('../config/database');
const { cache } = require('../config/redis');

class Task {
  // Get all tasks with caching
  static async getAll(filters = {}) {
    try {
      // Build cache key based on filters
      const cacheKey = `tasks:all:${JSON.stringify(filters)}`;
      
      // Check cache first
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log('📦 Cache hit for tasks');
        return cachedData;
      }

      // Build query
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      query += ' ORDER BY created_at DESC';

      // Execute query
      const [rows] = await pool.execute(query, params);

      // Cache the results
      await cache.set(cacheKey, rows);
      console.log('💾 Data cached for tasks');

      return rows;
    } catch (error) {
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  }

  // Get task by ID with caching
  static async getById(id) {
    try {
      const cacheKey = `task:${id}`;

      // Check cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log(`📦 Cache hit for task ${id}`);
        return cachedData;
      }

      // Query database
      const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);

      if (rows.length === 0) {
        return null;
      }

      // Cache result
      await cache.set(cacheKey, rows[0]);
      console.log(`💾 Data cached for task ${id}`);

      return rows[0];
    } catch (error) {
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  // Create new task
  static async create(taskData) {
    try {
      const { title, description, status, priority, due_date } = taskData;

      const [result] = await pool.execute(
        'INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?)',
        [title, description || null, status || 'pending', priority || 'medium', due_date || null]
      );

      // Invalidate cache
      await cache.delPattern('tasks:all:*');
      console.log('🗑️  Cache invalidated for tasks list');

      return {
        id: result.insertId,
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        due_date
      };
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  // Update task
  static async update(id, taskData) {
    try {
      const { title, description, status, priority, due_date } = taskData;

      // Build dynamic update query
      const updates = [];
      const params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (priority !== undefined) {
        updates.push('priority = ?');
        params.push(priority);
      }
      if (due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(due_date);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(id);

      const [result] = await pool.execute(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return null;
      }

      // Invalidate cache
      await cache.del(`task:${id}`);
      await cache.delPattern('tasks:all:*');
      console.log(`🗑️  Cache invalidated for task ${id}`);

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  // Delete task
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return false;
      }

      // Invalidate cache
      await cache.del(`task:${id}`);
      await cache.delPattern('tasks:all:*');
      console.log(`🗑️  Cache invalidated for task ${id}`);

      return true;
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  // Get statistics
  static async getStats() {
    try {
      const cacheKey = 'tasks:stats';

      // Check cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log('📦 Cache hit for stats');
        return cachedData;
      }

      const query = 'SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as in_progress, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN priority = ? THEN 1 ELSE 0 END) as highpriority, SUM(CASE WHEN due_date < CURDATE() AND status <> ? THEN 1 ELSE 0 END) as overdue FROM tasks';

      const [stats] = await pool.execute(query, ['pending', 'in-progress', 'completed', 'high', 'completed']);

      // Rename for consistency
      const result = {
        total: stats[0].total,
        pending: stats[0].pending,
        in_progress: stats[0].in_progress,
        completed: stats[0].completed,
        high_priority: stats[0].highpriority,
        overdue: stats[0].overdue
      };

      // Cache for shorter time (60 seconds)
      await cache.set(cacheKey, result, 60);
      console.log('💾 Stats cached');

      return result;
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
}

module.exports = Task;
