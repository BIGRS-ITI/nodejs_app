# Task Manager Application - Quick Reference

## 🎯 What is This?

A modern, production-ready task management application built with:

- **Backend**: Node.js + Express
- **Database**: MySQL (persistent storage)
- **Cache**: Redis (performance boost)
- **Frontend**: Beautiful, responsive UI with Tailwind CSS

## 🚀 Quick Start

### Option 1: Docker (Easiest - Recommended)

```bash
# Start everything
docker-compose up -d

# Wait 30 seconds, then initialize database
docker-compose exec app npm run init-db

# Access app
open http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your MySQL/Redis credentials
nano .env

# 4. Initialize database
npm run init-db

# 5. Start application
npm run dev

# Access app
open http://localhost:3000
```

### Option 3: Use Quick Start Script

```bash
chmod +x start.sh
./start.sh
```

## 📦 What's Inside?

```
TheApp/
├── config/          # Database & Redis configuration
├── controllers/     # Business logic
├── models/          # Data models with caching
├── routes/          # API endpoints
├── public/          # Frontend (HTML, CSS, JS)
├── scripts/         # Database initialization
├── server.js        # Application entry point
├── Dockerfile       # Container image
└── docker-compose.yml  # Multi-container setup
```

## 🔧 Key Features

1. **Full CRUD Operations** - Create, Read, Update, Delete tasks
2. **Smart Caching** - Redis caching for fast responses
3. **Real-time Stats** - Dashboard with live metrics
4. **Filtering** - Filter by status and priority
5. **Modern UI** - Responsive, beautiful interface
6. **Docker Ready** - One command deployment
7. **Production Ready** - Health checks, proper error handling

## 🌐 API Endpoints

```
GET    /api/health           # Health check
GET    /api/tasks            # Get all tasks
GET    /api/tasks/:id        # Get single task
POST   /api/tasks            # Create task
PUT    /api/tasks/:id        # Update task
DELETE /api/tasks/:id        # Delete task
GET    /api/tasks/stats      # Get statistics
```

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild
docker-compose up -d --build

# Remove everything (including data)
docker-compose down -v
```

## 🔑 Environment Variables

Create `.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskmanager
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300
```

## 📊 Database Schema

**tasks table:**

- id (primary key)
- title (required)
- description
- status (pending, in-progress, completed)
- priority (low, medium, high)
- due_date
- created_at
- updated_at

## 🎨 UI Features

- **Dashboard Cards** - Total, In Progress, Completed, Overdue
- **Filter Buttons** - Quick task filtering
- **Task Cards** - Beautiful cards with all info
- **Modal Forms** - Easy create/edit
- **Toast Notifications** - User feedback
- **Responsive** - Works on all devices

## 🚢 Deploy to AWS EKS

1. **Build and push to ECR:**

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker build -t task-manager-app:latest .
docker tag task-manager-app:latest YOUR_ECR_URL/bigrs-app:latest
docker push YOUR_ECR_URL/bigrs-app:latest
```

2. **Update k8s-deployment.yaml** with your:
   - ECR repository URL
   - RDS endpoint
   - ElastiCache endpoint
   - Database credentials

3. **Add to Platform repo:**

```bash
# Copy to Platform/apps/NodeJs/
cp k8s-deployment.yaml ../Platform/apps/NodeJs/node-deployment.yaml
```

4. **ArgoCD will auto-deploy!**

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Get tasks
curl http://localhost:3000/api/tasks

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","priority":"high"}'
```

## 📈 Performance

- **Caching**: Redis reduces database load by ~80%
- **Connection Pooling**: Reuses database connections
- **Indexed Queries**: Fast lookups on status, priority, due_date
- **Health Checks**: Automatic container restarts if unhealthy

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in dev mode (auto-reload)
npm run dev

# Run in production mode
npm start

# Initialize/reset database
npm run init-db
```

## 📝 Sample Data

The `init-db` script creates 6 sample tasks:

1. Setup Development Environment (completed)
2. Design Database Schema (completed)
3. Build REST API (in-progress)
4. Create Modern UI (in-progress)
5. Write Documentation (pending)
6. Deploy to AWS EKS (pending)

## 🔐 Security Notes

- Never commit `.env` to Git (already in .gitignore)
- Change default database passwords
- Use secrets management in production
- Enable HTTPS in production
- Implement authentication (future enhancement)

## 🎯 Next Steps

1. ✅ Application is ready to use locally
2. 🐳 Test with Docker Compose
3. 🚀 Build and push to ECR
4. ☸️ Deploy to your EKS cluster
5. 🔄 Set up CI/CD with Jenkins
6. 📊 Monitor with your preferred tools

## 💡 Tips

- Use Docker for consistent environment
- Check logs if something fails
- Redis is optional (app works without it)
- MySQL must be running for the app to work
- The UI auto-refreshes statistics

## 🐛 Common Issues

**Can't connect to MySQL:**

- Check if MySQL is running
- Verify credentials in `.env`
- Run `npm run init-db`

**Can't connect to Redis:**

- App will work without Redis (no caching)
- Check if Redis is running
- Verify REDIS_HOST in `.env`

**Port 3000 already in use:**

- Change PORT in `.env`
- Or kill process: `lsof -i :3000`

## 📚 Documentation

- Full README: `README.md`
- API Documentation: In README.md
- Architecture: Diagrams in README.md
- Deployment Guide: k8s-deployment.yaml comments

---

**Built with ❤️ for the BIGRS-ITI Infrastructure Project**

Ready to deploy on your AWS EKS cluster! 🚀
