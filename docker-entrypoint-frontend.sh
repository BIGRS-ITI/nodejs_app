#!/bin/sh
set -e

echo "ðŸŒ Starting Task Manager Frontend..."

# Wait for backend to be available
echo "â³ Waiting for backend to be ready..."
max_attempts=30
attempt=0

until wget --spider -q http://backend:3000/api/health 2>/dev/null
do
  attempt=$((attempt+1))
  if [ $attempt -eq $max_attempts ]; then
    echo "âš ï¸  Backend not ready after $max_attempts attempts, starting nginx anyway..."
    break
  fi
  echo "Waiting for backend... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "âœ… Backend is ready!"
echo "ðŸŽ‰ Starting Nginx..."

# Start nginx
exec nginx -g "daemon off;"
