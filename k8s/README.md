# Task Manager - AWS EKS Deployment Guide

This guide explains how to deploy the Task Manager application to AWS EKS (Elastic Kubernetes Service).

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- kubectl installed and configured
- Docker installed
- eksctl installed (optional, for cluster creation)
- Existing EKS cluster or create one

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────┐
│                  AWS EKS Cluster                  │
│                                                   │
│  ┌──────────────┐      ┌──────────────────────┐   │
│  │   Ingress    │      │    LoadBalancer      │   │
│  │     ALB      │      │      (ELB)           │   │
│  └──────┬───────┘      └──────────┬───────────┘   │
│         │                          │              │
│  ┌──────▼───────┐         ┌───────▼────────┐      │
│  │   Frontend   │         │    Frontend    │      │
│  │   (Nginx)    │◄────────┤    Service     │      │
│  │   Pods (2-5) │         └────────────────┘      │
│  └──────┬───────┘                                 │
│         │ /api/*                                  │
│  ┌──────▼───────┐         ┌────────────────┐      │
│  │   Backend    │         │    Backend     │      │
│  │   (Node.js)  │◄────────┤    Service     │      │
│  │   Pods (2-10)│         └────────────────┘      │
│  └──────┬───┬───┘                                 │
│         │   │                                     │
│  ┌──────▼───▼───────┐    ┌─────────────────┐      │
│  │    MySQL         │    │     Redis       │      │
│  │  StatefulSet     │    │   Deployment    │      │
│  │  (+ EBS Volume)  │    │  (+ EBS Volume) │      │
│  └──────────────────┘    └─────────────────┘      │
│                                                   │
└───────────────────────────────────────────────────┘
```

## 📁 File Structure

```
k8s/
├── namespace.yaml              # Namespace definition
├── secrets.yaml                # Database & Redis passwords
├── configmaps.yaml            # Application configuration
├── persistent-volumes.yaml    # PVC for MySQL & Redis
├── mysql-deployment.yaml      # MySQL StatefulSet + Service
├── redis-deployment.yaml      # Redis Deployment + Service
├── backend-deployment.yaml    # Backend Deployment + Service + HPA
├── frontend-deployment.yaml   # Frontend Deployment + Service + HPA
├── ingress.yaml               # ALB Ingress (optional)
├── build-and-push.sh          # Build & push images to ECR
├── deploy.sh                  # Deploy to EKS
└── README.md                  # This file
```

## 🔐 Secrets and ConfigMaps

### Secrets (secrets.yaml)

**IMPORTANT: Update these before deploying!**

```yaml
mysql-root-password: "YOUR_SECURE_ROOT_PASSWORD_HERE"
mysql-password: "YOUR_SECURE_DB_PASSWORD_HERE"
redis-password: ""  # Optional, leave empty if no auth
```

### ConfigMaps (configmaps.yaml)

Backend configuration:

- `NODE_ENV`: production
- `DB_HOST`: mysql (Kubernetes service name)
- `DB_PORT`: 3306
- `DB_USER`: taskuser
- `DB_NAME`: taskmanager
- `REDIS_HOST`: redis (Kubernetes service name)
- `REDIS_PORT`: 6379
- `CACHE_TTL`: 300 (5 minutes)

## 🚀 Deployment Steps

### Step 1: Prepare Your AWS Environment

```bash
# Set your AWS credentials
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Update the build script with your account ID
sed -i "s/YOUR_AWS_ACCOUNT_ID/$AWS_ACCOUNT_ID/" k8s/build-and-push.sh
```

### Step 2: Update Secrets

```bash
# Edit secrets.yaml and replace placeholder passwords
vi k8s/secrets.yaml

# Generate secure passwords:
openssl rand -base64 32  # For MySQL root password
openssl rand -base64 32  # For MySQL user password
```

### Step 3: Build and Push Docker Images to ECR

```bash
# Navigate to app directory
cd TheApp

# Run the build and push script
chmod +x k8s/build-and-push.sh
./k8s/build-and-push.sh
```

This script will:

- Login to AWS ECR
- Create ECR repositories (if they don't exist)
- Build backend and frontend images
- Tag images with `latest` and timestamp
- Push images to ECR

### Step 4: Update Deployment Manifests

```bash
# Update backend deployment with your ECR image
export ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
sed -i "s|YOUR_ECR_REPO|$ECR_REPO|g" k8s/backend-deployment.yaml
sed -i "s|YOUR_ECR_REPO|$ECR_REPO|g" k8s/frontend-deployment.yaml
```

### Step 5: Deploy to EKS

```bash
# Make deploy script executable
chmod +x k8s/deploy.sh

# Run deployment
./k8s/deploy.sh
```

The script will:

1. Create namespace
2. Apply secrets and configmaps
3. Create persistent volumes
4. Deploy MySQL and Redis
5. Deploy backend API
6. Deploy frontend
7. Optionally deploy Ingress/ALB

### Step 6: Verify Deployment

```bash
# Check all resources
kubectl get all -n taskmanager

# Check pods
kubectl get pods -n taskmanager

# Check services
kubectl get svc -n taskmanager

# Check HPA
kubectl get hpa -n taskmanager

# Check logs
kubectl logs -f deployment/backend -n taskmanager
kubectl logs -f deployment/frontend -n taskmanager
```

## 🌐 Accessing the Application

### Option 1: Using LoadBalancer (Default)

```bash
# Get the LoadBalancer URL
kubectl get svc frontend -n taskmanager

# Access at:
http://<EXTERNAL-IP>
```

### Option 2: Using ALB Ingress

```bash
# Get the ALB DNS name
kubectl get ingress taskmanager-ingress -n taskmanager

# Access at:
http://<ALB-DNS-NAME>
```

## 📊 Environment Variables Summary

### Backend Container

| Variable | Source | Value | Required |
|----------|--------|-------|----------|
| `NODE_ENV` | ConfigMap | production | Yes |
| `PORT` | ConfigMap | 3000 | Yes |
| `DB_HOST` | ConfigMap | mysql | Yes |
| `DB_PORT` | ConfigMap | 3306 | Yes |
| `DB_USER` | ConfigMap | taskuser | Yes |
| `DB_NAME` | ConfigMap | taskmanager | Yes |
| `DB_PASSWORD` | Secret | (encrypted) | Yes |
| `REDIS_HOST` | ConfigMap | redis | Yes |
| `REDIS_PORT` | ConfigMap | 6379 | Yes |
| `REDIS_PASSWORD` | Secret | (encrypted) | No |
| `CACHE_TTL` | ConfigMap | 300 | Yes |
| `FRONTEND_URL` | ConfigMap | <http://localhost:8080> | No |

### MySQL Container

| Variable | Source | Value | Required |
|----------|--------|-------|----------|
| `MYSQL_DATABASE` | ConfigMap | taskmanager | Yes |
| `MYSQL_USER` | ConfigMap | taskuser | Yes |
| `MYSQL_ROOT_PASSWORD` | Secret | (encrypted) | Yes |
| `MYSQL_PASSWORD` | Secret | (encrypted) | Yes |

### Frontend Container

No environment variables required (all configuration in nginx.conf).

## 🔄 Auto-Scaling Configuration

### Backend HPA

- Min Replicas: 2
- Max Replicas: 10
- Target CPU: 70%
- Target Memory: 80%

### Frontend HPA

- Min Replicas: 2
- Max Replicas: 5
- Target CPU: 70%
- Target Memory: 80%

## 💾 Persistent Storage

### MySQL

- Storage Class: `gp3` (AWS EBS)
- Size: 10Gi
- Access Mode: ReadWriteOnce

### Redis

- Storage Class: `gp3` (AWS EBS)
- Size: 5Gi
- Access Mode: ReadWriteOnce

## 🛠️ Resource Limits

### Backend Pods

- Requests: 256Mi RAM, 200m CPU
- Limits: 512Mi RAM, 500m CPU

### Frontend Pods

- Requests: 64Mi RAM, 50m CPU
- Limits: 128Mi RAM, 100m CPU

### MySQL

- Requests: 512Mi RAM, 250m CPU
- Limits: 1Gi RAM, 500m CPU

### Redis

- Requests: 256Mi RAM, 100m CPU
- Limits: 512Mi RAM, 250m CPU

## 📝 Useful Commands

```bash
# View all resources
kubectl get all -n taskmanager

# Check pod logs
kubectl logs -f <pod-name> -n taskmanager

# Execute commands in pod
kubectl exec -it <pod-name> -n taskmanager -- /bin/sh

# Scale deployment
kubectl scale deployment backend --replicas=5 -n taskmanager

# Check health endpoint
kubectl exec -it deployment/backend -n taskmanager -- wget -qO- http://localhost:3000/api/health

# Port forward for local testing
kubectl port-forward svc/backend 3000:3000 -n taskmanager
kubectl port-forward svc/frontend 8080:80 -n taskmanager

# Get deployment status
kubectl rollout status deployment/backend -n taskmanager

# Restart deployment
kubectl rollout restart deployment/backend -n taskmanager

# View HPA metrics
kubectl describe hpa backend-hpa -n taskmanager
```

## 🔍 Troubleshooting

### Pods not starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n taskmanager

# Check logs
kubectl logs <pod-name> -n taskmanager

# Check previous logs (if pod restarted)
kubectl logs <pod-name> -n taskmanager --previous
```

### Database connection issues

```bash
# Check if MySQL is running
kubectl get pods -l app=mysql -n taskmanager

# Test database connection
kubectl exec -it deployment/backend -n taskmanager -- \
  node -e "const mysql = require('mysql2/promise'); \
  mysql.createConnection({host: 'mysql', user: 'taskuser', password: process.env.DB_PASSWORD, database: 'taskmanager'}) \
  .then(() => console.log('Connected!')).catch(console.error)"
```

### Redis connection issues

```bash
# Check if Redis is running
kubectl get pods -l app=redis -n taskmanager

# Test Redis connection
kubectl exec -it deployment/redis -n taskmanager -- redis-cli ping
```

### Image pull errors

```bash
# Check ECR login
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Verify image exists in ECR
aws ecr describe-images --repository-name taskmanager-backend --region $AWS_REGION
aws ecr describe-images --repository-name taskmanager-frontend --region $AWS_REGION
```

## 🧹 Cleanup

```bash
# Delete all resources
kubectl delete namespace taskmanager

# Delete ECR repositories
aws ecr delete-repository --repository-name taskmanager-backend --force --region $AWS_REGION
aws ecr delete-repository --repository-name taskmanager-frontend --force --region $AWS_REGION

# Delete EBS volumes (if not auto-deleted)
aws ec2 describe-volumes --filters "Name=tag:kubernetes.io/created-for/pvc/namespace,Values=taskmanager" --region $AWS_REGION
# Then delete each volume
```

## 📚 Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

## 🎯 Production Checklist

- [ ] Updated secrets with strong passwords
- [ ] Configured SSL certificate in Ingress
- [ ] Set up monitoring (CloudWatch, Prometheus)
- [ ] Configured backup strategy for MySQL
- [ ] Set up log aggregation (CloudWatch Logs, ELK)
- [ ] Implemented network policies
- [ ] Configured pod security policies
- [ ] Set up CI/CD pipeline
- [ ] Configured alerts and notifications
- [ ] Performance testing completed
- [ ] Security scan completed
- [ ] Documentation updated
