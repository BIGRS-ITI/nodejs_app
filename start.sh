#!/bin/bash

# Task Manager - Quick Start Script
# This script helps you get started quickly with the application

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     Task Manager - Quick Start Setup                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env and add your database credentials"
    echo ""
fi

# Check if Docker is installed
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected! Would you like to use Docker? (recommended)"
    echo "   1) Yes - Use Docker Compose (easiest)"
    echo "   2) No - Manual setup with local MySQL/Redis"
    read -p "Enter your choice (1 or 2): " docker_choice
    echo ""
    
    if [ "$docker_choice" == "1" ]; then
        echo "🚀 Starting services with Docker Compose..."
        docker-compose up -d
        
        echo ""
        echo "⏳ Waiting for MySQL to be ready..."
        sleep 30
        
        echo "🔧 Initializing database..."
        docker-compose exec app npm run init-db
        
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo "✅ Application is running!"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "🌐 Access the application:"
        echo "   👉 http://localhost:3000"
        echo ""
        echo "📊 Service URLs:"
        echo "   - MySQL:  localhost:3306"
        echo "   - Redis:  localhost:6379"
        echo "   - API:    http://localhost:3000/api"
        echo ""
        echo "📚 Useful commands:"
        echo "   - View logs:    docker-compose logs -f app"
        echo "   - Stop:         docker-compose down"
        echo "   - Restart:      docker-compose restart"
        echo ""
        exit 0
    fi
fi

# Manual setup
echo "🔧 Manual Setup Selected"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm $(npm --version) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check MySQL
echo ""
echo "🔍 Checking MySQL connection..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL client found"
    echo "⚠️  Make sure MySQL server is running!"
else
    echo "⚠️  MySQL client not found in PATH"
    echo "   Please ensure MySQL is installed and running"
fi

# Check Redis
echo ""
echo "🔍 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running"
        echo "   Please start Redis server"
    fi
else
    echo "⚠️  Redis client not found in PATH"
    echo "   Please ensure Redis is installed and running"
fi

# Initialize database
echo ""
read -p "Would you like to initialize the database now? (y/n): " init_db

if [ "$init_db" == "y" ] || [ "$init_db" == "Y" ]; then
    echo "🔧 Initializing database..."
    npm run init-db
    
    if [ $? -eq 0 ]; then
        echo "✅ Database initialized successfully"
    else
        echo "⚠️  Database initialization failed"
        echo "   Please check your .env configuration"
    fi
fi

# Final instructions
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🚀 To start the application:"
echo "   - Development:  npm run dev"
echo "   - Production:   npm start"
echo ""
echo "🌐 The app will be available at:"
echo "   👉 http://localhost:3000"
echo ""
echo "📚 API Documentation:"
echo "   👉 http://localhost:3000/api/health"
echo ""
echo "⚙️  Before starting:"
echo "   1. Ensure MySQL is running"
echo "   2. Ensure Redis is running"
echo "   3. Update .env with your credentials"
echo ""
