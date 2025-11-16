# Task Manager Application

## Overview

A modern task management web application built with Node.js, Express, MySQL, and Redis. Features a responsive frontend and RESTful API backend with caching.

## Architecture

```text
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────>│   Backend   │─────>│    MySQL    │
│  (Nginx)    │      │  (Express)  │      │  (RDS/K8s)  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ↓
                     ┌─────────────┐
                     │    Redis    │
                     │  (Cache)    │
                     └─────────────┘
```

## Tech Stack

- **Backend**: Node.js 18+, Express.js
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Database**: MySQL 8.0
- **Cache**: Redis 7.0
- **Web Server**: Nginx (frontend)
- **Container**: Docker
- **CI/CD**: Jenkins
- **Deployment**: Kubernetes (EKS)

## Features

- ✅ Create, read, update, delete tasks
- ✅ Task status management (pending, in-progress, completed)
- ✅ Redis caching for performance
- ✅ Health check endpoints
- ✅ Database initialization script
- ✅ Dockerized deployment
- ✅ Kubernetes manifests
- ✅ Jenkins CI/CD pipeline

## Project Structure

```text
nodejs_app/
├── server.js                    # Express server entry point
├── package.json                 # Dependencies and scripts
├── Dockerfile.backend           # Backend container image
├── Dockerfile.frontend          # Frontend container image
├── Jenkinsfile                  # CI/CD pipeline
├── docker-compose.yml           # Local development
│
├── config/                      # Configuration
│   ├── database.js              # MySQL connection
│   └── redis.js                 # Redis connection
│
├── controllers/                 # Business logic
│   └── taskController.js        # Task CRUD operations
│
├── models/                      # Data models
│   └── Task.js                  # Task model
│
├── routes/                      # API routes
│   └── tasks.js                 # Task endpoints
│
├── public/                      # Frontend files
│   ├── index.html               # Main UI
│   ├── css/style.css            # Styles
│   └── js/app.js                # Frontend logic
│
├── scripts/                     # Utility scripts
│   └── init-db.js               # Database initialization
│
└── k8s/                         # Kubernetes manifests
    ├── namespace.yaml
    ├── backend-deployment.yaml
    ├── frontend-deployment.yaml
    ├── redis-deployment.yaml
    ├── mysql-deployment.yaml
    ├── configmaps.yaml
    ├── secrets.yaml
    └── ingress.yaml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/:id` | Get task by ID |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Environment Variables

```bash
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=taskuser
DB_PASSWORD=taskpass
DB_NAME=taskdb
DB_PORT=3306

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend
FRONTEND_URL=http://localhost
```

## Local Development

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access: <http://localhost>

### Manual Setup

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm run dev
```

## Docker Images

### Backend

```bash
docker build -f Dockerfile.backend -t nodejs-backend:latest .
docker run -p 3000:3000 --env-file .env nodejs-backend:latest
```

### Frontend

```bash
docker build -f Dockerfile.frontend -t nodejs-frontend:latest .
docker run -p 80:80 nodejs-frontend:latest
```

## Kubernetes Deployment

### Using kubectl

```bash
cd k8s

# Deploy all resources
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmaps.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f mysql-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml

# Check status
kubectl get all -n taskmanager
```

### Using ArgoCD (Recommended)

The application is automatically deployed via ArgoCD from the Platform repository.

## CI/CD Pipeline

The Jenkinsfile defines a complete CI/CD pipeline:

1. **Checkout** - Clone repository
2. **Build** - Build Docker images (backend & frontend in parallel)
3. **Push** - Push images to ECR
4. **Update Manifests** - Update image tags in Platform repo
5. **Deploy** - ArgoCD auto-syncs and deploys

**Trigger**: Push to main branch

## Database Schema

```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Health Checks

**Backend**: `GET /api/health`

- Returns 200 if healthy
- Checks MySQL and Redis connectivity

**Response**:

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

## Caching Strategy

- **Task List**: Cached for 5 minutes
- **Individual Tasks**: Cached for 10 minutes
- **Cache Invalidation**: On create, update, delete operations

## Monitoring

Key metrics to monitor:

- Response time (target: <100ms)
- Database connection pool
- Redis hit rate
- Error rate
- Active connections

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker logs <backend-container-id>

# Verify database connection
npm run init-db
```

### Database connection failed

```bash
# Verify MySQL is running
docker ps | grep mysql

# Test connection
mysql -h localhost -u taskuser -p
```

### Redis connection failed

```bash
# Check Redis status
docker ps | grep redis

# Test Redis
redis-cli ping
```

## Production Deployment

Deployed on AWS EKS with:

- **Backend**: 2-3 replicas with HPA
- **Frontend**: 2 replicas behind Nginx
- **Database**: AWS RDS MySQL (Multi-AZ)
- **Cache**: Redis cluster
- **Ingress**: AWS NLB + Nginx Ingress Controller
- **TLS**: cert-manager with Let's Encrypt
- **Secrets**: External Secrets Operator (AWS Secrets Manager)
- **Images**: ECR with automated updates via ArgoCD Image Updater

## License

MIT

## Author

BIGRS-ITI Team

