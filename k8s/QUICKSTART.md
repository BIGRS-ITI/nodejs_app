# AWS EKS Deployment - Quick Reference

## 🚀 Quick Start (TL;DR)

```bash
# 1. Set AWS credentials
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 2. Update secrets
vi k8s/secrets.yaml  # Replace placeholder passwords

# 3. Build and push images
cd TheApp
chmod +x k8s/build-and-push.sh k8s/deploy.sh
./k8s/build-and-push.sh

# 4. Deploy to EKS
./k8s/deploy.sh

# 5. Get application URL
kubectl get svc frontend -n taskmanager
```

## 📋 Required Environment Variables

### ConfigMaps (Public Configuration)

**backend-config:**

- `NODE_ENV=production`
- `PORT=3000`
- `DB_HOST=mysql`
- `DB_PORT=3306`
- `DB_USER=taskuser`
- `DB_NAME=taskmanager`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- `CACHE_TTL=300`
- `FRONTEND_URL=http://localhost:8080`

**mysql-config:**

- `MYSQL_DATABASE=taskmanager`
- `MYSQL_USER=taskuser`

### Secrets (Sensitive Data)

**taskmanager-secrets:**

- `mysql-root-password` ← ⚠️ UPDATE THIS
- `mysql-password` ← ⚠️ UPDATE THIS
- `redis-password` (optional)

**mysql-secrets:**

- `MYSQL_ROOT_PASSWORD` ← ⚠️ UPDATE THIS
- `MYSQL_PASSWORD` ← ⚠️ UPDATE THIS

## 🔑 Generate Secure Passwords

```bash
# MySQL root password
openssl rand -base64 32

# MySQL user password  
openssl rand -base64 32

# Update secrets.yaml
sed -i 's/YOUR_SECURE_ROOT_PASSWORD_HERE/GENERATED_PASSWORD/' k8s/secrets.yaml
sed -i 's/YOUR_SECURE_DB_PASSWORD_HERE/GENERATED_PASSWORD/' k8s/secrets.yaml
```

## 📦 Container Images

**Backend:** `${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/taskmanager-backend:latest`

**Frontend:** `${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/taskmanager-frontend:latest`

## 🌐 Access Points

| Service | Type | Port | URL |
|---------|------|------|-----|
| Frontend | LoadBalancer | 80 | `http://<LB-DNS>` |
| Backend API | ClusterIP | 3000 | Internal only |
| MySQL | ClusterIP | 3306 | Internal only |
| Redis | ClusterIP | 6379 | Internal only |

## 📊 Resource Requirements

| Component | CPU Request | CPU Limit | RAM Request | RAM Limit |
|-----------|-------------|-----------|-------------|-----------|
| Backend | 200m | 500m | 256Mi | 512Mi |
| Frontend | 50m | 100m | 64Mi | 128Mi |
| MySQL | 250m | 500m | 512Mi | 1Gi |
| Redis | 100m | 250m | 256Mi | 512Mi |

## 🔄 Auto-Scaling

**Backend HPA:** 2-10 replicas (CPU: 70%, Memory: 80%)

**Frontend HPA:** 2-5 replicas (CPU: 70%, Memory: 80%)

## 🛠️ Common Commands

```bash
# Check status
kubectl get all -n taskmanager

# View logs
kubectl logs -f deployment/backend -n taskmanager
kubectl logs -f deployment/frontend -n taskmanager

# Scale manually
kubectl scale deployment backend --replicas=5 -n taskmanager

# Update image
kubectl set image deployment/backend backend=NEW_IMAGE -n taskmanager

# Restart deployment
kubectl rollout restart deployment/backend -n taskmanager

# Check health
kubectl exec -it deployment/backend -n taskmanager -- wget -qO- http://localhost:3000/api/health

# Port forward (local testing)
kubectl port-forward svc/frontend 8080:80 -n taskmanager
```

## ⚠️ Before Production

- [ ] Update all passwords in `secrets.yaml`
- [ ] Configure SSL certificate in `ingress.yaml`
- [ ] Set up monitoring (CloudWatch/Prometheus)
- [ ] Configure backups for MySQL
- [ ] Set up CI/CD pipeline
- [ ] Review and adjust resource limits
- [ ] Enable pod security policies
- [ ] Configure network policies
- [ ] Set up log aggregation
- [ ] Test disaster recovery

## 🧹 Cleanup

```bash
# Delete everything
kubectl delete namespace taskmanager

# Delete ECR repos
aws ecr delete-repository --repository-name taskmanager-backend --force
aws ecr delete-repository --repository-name taskmanager-frontend --force
```
