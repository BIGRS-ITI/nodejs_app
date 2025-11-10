const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import configurations
const { testConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Import routes
const taskRoutes = require('./routes/tasks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: 'connected', // If we got here, Redis is connected
      api: 'running'
    }
  });
});

// Redis stats endpoint
app.get('/api/redis-stats', async (req, res) => {
  try {
    const { redisClient } = require('./config/redis');
    const info = await redisClient.info('stats');
    const keys = await redisClient.keys('*');
    
    // Parse info string
    const stats = {};
    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) stats[key] = value;
      }
    });

    const hits = parseInt(stats.keyspace_hits) || 0;
    const misses = parseInt(stats.keyspace_misses) || 0;
    const total = hits + misses;
    
    let hitRate = '0%';
    if (total > 0) {
      hitRate = ((hits / total) * 100).toFixed(2) + '%';
    }

    res.json({
      success: true,
      data: {
        total_commands_processed: stats.total_commands_processed || '0',
        keyspace_hits: stats.keyspace_hits || '0',
        keyspace_misses: stats.keyspace_misses || '0',
        hit_rate: hitRate,
        cached_keys: keys.length,
        keys: keys
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Reset Redis cache endpoint
app.post('/api/redis-reset', async (req, res) => {
  try {
    const { redisClient } = require('./config/redis');
    
    // Clear all cached data
    await redisClient.flushAll();
    
    // Reset statistics using CONFIG RESETSTAT
    await redisClient.sendCommand(['CONFIG', 'RESETSTAT']);
    
    res.json({
      success: true,
      message: 'Redis cache and statistics cleared successfully'
    });
  } catch (error) {
    console.error('Redis reset error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API info route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Manager API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tasks: '/api/tasks',
      stats: '/api/tasks/stats',
      redis_stats: '/api/redis-stats',
      redis_reset: '/api/redis-reset (POST)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('⚠️  Warning: Database connection failed. Some features may not work.');
    }

    // Connect to Redis
    console.log('🔍 Connecting to Redis...');
    const redisConnected = await connectRedis();
    if (!redisConnected) {
      console.error('⚠️  Warning: Redis connection failed. Caching will be disabled.');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('🚀 Task Manager Application Started!');
      console.log('═══════════════════════════════════════════════');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`📦 Redis Cache: ${redisConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log('═══════════════════════════════════════════════');
      console.log('');
      console.log('📚 API Endpoints:');
      console.log('   GET    /api/health         - Health check');
      console.log('   GET    /api/tasks          - Get all tasks');
      console.log('   GET    /api/tasks/stats    - Get statistics');
      console.log('   GET    /api/tasks/:id      - Get task by ID');
      console.log('   POST   /api/tasks          - Create task');
      console.log('   PUT    /api/tasks/:id      - Update task');
      console.log('   DELETE /api/tasks/:id      - Delete task');
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
