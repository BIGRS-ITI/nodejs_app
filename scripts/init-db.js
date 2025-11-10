const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  let connection;

  try {
    // Connect without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('📦 Initializing database...');

    // Create database
    const dbName = process.env.DB_NAME || 'taskmanager';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Use database
    await connection.query(`USE ${dbName}`);

    // Create tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_due_date (due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "tasks" created/verified');

    // Create users table (for future expansion)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "users" created/verified');

    // Insert sample data
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM tasks');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO tasks (title, description, status, priority, due_date) VALUES
        ('Setup Development Environment', 'Install Node.js, MySQL, and Redis', 'completed', 'high', CURDATE()),
        ('Design Database Schema', 'Create ERD and table structures', 'completed', 'high', CURDATE()),
        ('Build REST API', 'Implement CRUD endpoints with caching', 'in-progress', 'high', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
        ('Create Modern UI', 'Design responsive interface with Tailwind CSS', 'in-progress', 'medium', DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
        ('Write Documentation', 'API docs and deployment guide', 'pending', 'medium', DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
        ('Deploy to AWS EKS', 'Deploy application using infrastructure', 'pending', 'high', DATE_ADD(CURDATE(), INTERVAL 7 DAY))
      `);
      console.log('✅ Sample data inserted');
    }

    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run initialization
initDatabase();
