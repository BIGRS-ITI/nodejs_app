#!/bin/sh
set -e

echo "🚀 Starting Task Manager Backend..."

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
max_attempts=30
attempt=0

until node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD}).then(() => {console.log('MySQL is ready!'); process.exit(0);}).catch((e) => {console.log('MySQL not ready:', e.message); process.exit(1);});" 2>/dev/null
do
  attempt=$((attempt+1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ MySQL did not become ready in time"
    exit 1
  fi
  echo "Waiting for MySQL... (attempt $attempt/$max_attempts)"
  sleep 2
done

# Run database initialization/migration
echo "📦 Running database migration..."
node scripts/init-db.js

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Database migration completed successfully"
else
  echo "❌ Database migration failed"
  exit 1
fi

# Start the application
echo "🎉 Starting Node.js server..."
exec node server.js
