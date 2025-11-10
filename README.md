# Task Manager Application

A modern, full-stack task management application built with Node.js, Express, MySQL, and Redis. Features a beautiful responsive UI with real-time statistics and caching for optimal performance.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Express](https://img.shields.io/badge/Express-4.18-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)
![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🌟 Features

- ✅ **Full CRUD Operations** - Create, read, update, and delete tasks
- 📊 **Real-time Statistics** - Dashboard with task metrics
- 🚀 **Redis Caching** - Fast data retrieval with intelligent caching
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🔍 **Advanced Filtering** - Filter tasks by status and priority
- 📅 **Due Date Management** - Track deadlines and overdue tasks
- 🏷️ **Priority Levels** - Low, Medium, High priority tasks
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 💾 **Persistent Storage** - MySQL database with proper indexing
- 🔄 **Auto-refresh** - Real-time data updates
- ⚡ **Performance** - Optimized with connection pooling and caching

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│              (Modern UI - Tailwind CSS)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │→ │ Controllers  │→ │    Models    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              ↓                           ↓
┌─────────────────────────┐   ┌──────────────────────┐
│    Redis Cache          │   │   MySQL Database     │
│  - Query results        │   │  - tasks table       │
│  - Statistics           │   │  - users table       │
│  - TTL: 300s           │   │  - Indexed queries   │
└─────────────────────────┘   └──────────────────────┘
```

### Data Flow

1. **Client Request** → Express API
2. **Cache Check** → Redis (if hit, return cached data)
3. **Database Query** → MySQL (if cache miss)
4. **Cache Update** → Store in Redis for future requests
5. **Response** → Return JSON to client

### Caching Strategy

- **Tasks List**: Cached for 5 minutes (300s)
- **Individual Task**: Cached for 5 minutes
- **Statistics**: Cached for 1 minute (60s)
- **Cache Invalidation**: On CREATE, UPDATE, DELETE operations

## 🛠️ Tech Stack

### Backend

- **Node.js** (18+) - JavaScript runtime
- **Express.js** (4.18) - Web framework
- **MySQL2** (3.6) - Database driver with Promise support
- **Redis** (4.6) - In-memory cache
- **dotenv** - Environment configuration
- **express-validator** - Input validation
- **CORS** - Cross-Origin Resource Sharing

### Frontend

- **HTML5** - Structure
- **Tailwind CSS** - Styling framework
- **Vanilla JavaScript** - Client-side logic
- **Font Awesome** - Icons

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nodemon** - Development auto-reload

## 📦 Prerequisites

### Option 1: Local Development

- Node.js 18+ ([Download](https://nodejs.org/))
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- Redis 7.0+ ([Download](https://redis.io/download))

### Option 2: Docker (Recommended)

- Docker 20+ ([Download](https://www.docker.com/))
- Docker Compose 2+ (included with Docker Desktop)

## 🚀 Installation

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/task-manager-app.git
cd task-manager-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskmanager

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

CACHE_TTL=300
```

4. **Start MySQL and Redis**

Make sure MySQL and Redis are running on your system.

5. **Initialize database**

```bash
npm run init-db
```

This will:

- Create the `taskmanager` database
- Create necessary tables
- Insert sample data

6. **Start the application**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

7. **Access the application**

Open your browser and navigate to: `http://localhost:3000`

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/task-manager-app.git
cd task-manager-app
```

2. **Start all services**

```bash
docker-compose up -d
```

This will start:

- MySQL database on port 3306
- Redis cache on port 6379
- Node.js application on port 3000

3. **Initialize the database**

```bash
# Wait for MySQL to be healthy (about 30 seconds)
docker-compose exec app npm run init-db
```

4. **Access the application**

```
http://localhost:3000
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (delete all data)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Check service status
docker-compose ps
```

### Build Docker Image

```bash
# Build image
docker build -t task-manager-app:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=your-mysql-host \
  -e DB_PASSWORD=your-password \
  -e REDIS_HOST=your-redis-host \
  --name taskmanager \
  task-manager-app:latest
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | - |
| `DB_NAME` | Database name | `taskmanager` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (optional) | - |
| `CACHE_TTL` | Cache time-to-live (seconds) | `300` |

### Database Schema

#### tasks table

```sql
CREATE TABLE tasks (
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
);
```

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "api": "running"
  }
}
```

#### Get All Tasks

```http
GET /api/tasks
```

**Query Parameters:**

- `status` (optional): Filter by status (`pending`, `in-progress`, `completed`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)

**Response:**

```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "id": 1,
      "title": "Setup Development Environment",
      "description": "Install Node.js, MySQL, and Redis",
      "status": "completed",
      "priority": "high",
      "due_date": "2025-11-10",
      "created_at": "2025-11-10T10:00:00.000Z",
      "updated_at": "2025-11-10T10:00:00.000Z"
    }
  ]
}
```

#### Get Task by ID

```http
GET /api/tasks/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Setup Development Environment",
    "description": "Install Node.js, MySQL, and Redis",
    "status": "completed",
    "priority": "high",
    "due_date": "2025-11-10",
    "created_at": "2025-11-10T10:00:00.000Z",
    "updated_at": "2025-11-10T10:00:00.000Z"
  }
}
```

#### Create Task

```http
POST /api/tasks
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "due_date": "2025-11-15"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 7,
    "title": "New Task",
    "description": "Task description",
    "status": "pending",
    "priority": "medium",
    "due_date": "2025-11-15"
  }
}
```

#### Update Task

```http
PUT /api/tasks/:id
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Updated Task",
  "status": "in-progress",
  "priority": "high"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Task",
    "description": "Task description",
    "status": "in-progress",
    "priority": "high",
    "due_date": "2025-11-15",
    "created_at": "2025-11-10T10:00:00.000Z",
    "updated_at": "2025-11-10T12:00:00.000Z"
  }
}
```

#### Delete Task

```http
DELETE /api/tasks/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

#### Get Statistics

```http
GET /api/tasks/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 6,
    "pending": 2,
    "in_progress": 2,
    "completed": 2,
    "high_priority": 3,
    "overdue": 1
  }
}
```

## 🌐 AWS Deployment

This application is designed to work seamlessly with your AWS EKS infrastructure.

### Prerequisites

- EKS cluster (from Infrastructure repo)
- RDS MySQL instance
- ElastiCache Redis
- ECR repository

### Deployment Steps

1. **Build and push Docker image to ECR**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL

# Build image
docker build -t task-manager-app:latest .

# Tag image
docker tag task-manager-app:latest YOUR_ECR_URL/bigrs-app:latest

# Push image
docker push YOUR_ECR_URL/bigrs-app:latest
```

2. **Update Platform repo deployment**

Update `Platform/apps/NodeJs/node-deployment.yaml` with your image URL and environment variables:

```yaml
env:
  - name: DB_HOST
    value: "your-rds-endpoint"
  - name: DB_NAME
    value: "taskmanager"
  - name: REDIS_HOST
    value: "your-elasticache-endpoint"
```

3. **Deploy via ArgoCD**

ArgoCD will automatically sync and deploy your application.

### Environment Variables for AWS

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_NAME=taskmanager
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379
CACHE_TTL=300
```

## 📁 Project Structure

```
task-manager-app/
├── config/
│   ├── database.js          # MySQL connection pool
│   └── redis.js             # Redis client & cache helpers
├── controllers/
│   └── taskController.js    # Request handlers & validation
├── models/
│   └── Task.js              # Task model with caching logic
├── routes/
│   └── tasks.js             # API route definitions
├── scripts/
│   └── init-db.js           # Database initialization script
├── public/
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── style.css        # Custom styles
│   └── js/
│       └── app.js           # Frontend JavaScript
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── .dockerignore            # Docker ignore rules
├── Dockerfile               # Production container image
├── docker-compose.yml       # Multi-container setup
├── package.json             # Dependencies & scripts
├── server.js                # Application entry point
└── README.md                # This file
```

## 🎯 Usage

### Creating a Task

1. Click "New Task" button
2. Fill in task details:
   - Title (required)
   - Description (optional)
   - Status (pending/in-progress/completed)
   - Priority (low/medium/high)
   - Due date (optional)
3. Click "Save Task"

### Filtering Tasks

Use the filter buttons to view:

- All Tasks
- Pending tasks
- In Progress tasks
- Completed tasks

### Editing a Task

1. Click the edit icon on any task card
2. Update the task details
3. Click "Save Task"

### Deleting a Task

1. Click the trash icon on any task card
2. Confirm deletion

### Statistics Dashboard

The dashboard shows real-time metrics:

- **Total Tasks**: All tasks in the system
- **In Progress**: Active tasks being worked on
- **Completed**: Finished tasks
- **Overdue**: Tasks past their due date

## 🧪 Testing

### Test API with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get all tasks
curl http://localhost:3000/api/tasks

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing API",
    "status": "pending",
    "priority": "high"
  }'

# Update task
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Delete task
curl -X DELETE http://localhost:3000/api/tasks/1
```

## 🔧 Troubleshooting

### MySQL Connection Failed

**Solution:**

- Verify MySQL is running: `mysql --version`
- Check credentials in `.env`
- Ensure database exists: `npm run init-db`

### Redis Connection Failed

**Solution:**

- Verify Redis is running: `redis-cli ping`
- Check Redis host/port in `.env`
- Application will still work without Redis (without caching)

### Port Already in Use

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change PORT in .env
PORT=3001
```

### Docker Container Won't Start

**Solution:**

```bash
# Check logs
docker-compose logs app

# Rebuild containers
docker-compose up -d --build

# Reset everything
docker-compose down -v
docker-compose up -d
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the BIGRS-ITI Final Project
- Infrastructure managed by Terraform on AWS EKS
- GitOps deployment via ArgoCD
- CI/CD pipeline with Jenkins

## 📞 Support

For issues and questions:

- Create an issue in the repository
- Contact: <support@bigrs-iti.com>

---

**Made with ❤️ by BIGRS-ITI Team**
