#!/bin/bash

# Task Manager - AWS EKS Deployment Script
# This script deploys the Task Manager application to AWS EKS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Task Manager - AWS EKS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install AWS CLI first.${NC}"
    exit 1
fi

# Variables
NAMESPACE="taskmanager"
ECR_REPO="${ECR_REPO:-YOUR_AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com}"
BACKEND_IMAGE="${ECR_REPO}/taskmanager-backend:latest"
FRONTEND_IMAGE="${ECR_REPO}/taskmanager-frontend:latest"

echo -e "\n${YELLOW}Configuration:${NC}"
echo "Namespace: $NAMESPACE"
echo "Backend Image: $BACKEND_IMAGE"
echo "Frontend Image: $FRONTEND_IMAGE"

# Step 1: Create namespace
echo -e "\n${GREEN}Step 1: Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Step 2: Create secrets
echo -e "\n${GREEN}Step 2: Creating secrets...${NC}"
echo -e "${YELLOW}⚠️  Make sure to update secrets.yaml with your actual passwords before deploying!${NC}"
read -p "Have you updated the secrets? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Please update k8s/secrets.yaml with your actual passwords and run again.${NC}"
    exit 1
fi
kubectl apply -f k8s/secrets.yaml

# Step 3: Create ConfigMaps
echo -e "\n${GREEN}Step 3: Creating ConfigMaps...${NC}"
kubectl apply -f k8s/configmaps.yaml

# Step 4: Create Persistent Volume Claims
echo -e "\n${GREEN}Step 4: Creating Persistent Volume Claims...${NC}"
kubectl apply -f k8s/persistent-volumes.yaml

# Step 5: Deploy MySQL
echo -e "\n${GREEN}Step 5: Deploying MySQL...${NC}"
kubectl apply -f k8s/mysql-deployment.yaml
echo "Waiting for MySQL to be ready..."
kubectl wait --for=condition=ready pod -l app=mysql -n $NAMESPACE --timeout=300s

# Step 6: Deploy Redis
echo -e "\n${GREEN}Step 6: Deploying Redis...${NC}"
kubectl apply -f k8s/redis-deployment.yaml
echo "Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=120s

# Step 7: Update deployment manifests with ECR images
echo -e "\n${GREEN}Step 7: Updating deployment manifests with ECR images...${NC}"
sed -i.bak "s|YOUR_ECR_REPO/taskmanager-backend:latest|$BACKEND_IMAGE|g" k8s/backend-deployment.yaml
sed -i.bak "s|YOUR_ECR_REPO/taskmanager-frontend:latest|$FRONTEND_IMAGE|g" k8s/frontend-deployment.yaml

# Step 8: Deploy Backend
echo -e "\n${GREEN}Step 8: Deploying Backend API...${NC}"
kubectl apply -f k8s/backend-deployment.yaml
echo "Waiting for Backend to be ready..."
kubectl wait --for=condition=available deployment/backend -n $NAMESPACE --timeout=300s

# Step 9: Deploy Frontend
echo -e "\n${GREEN}Step 9: Deploying Frontend...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml
echo "Waiting for Frontend to be ready..."
kubectl wait --for=condition=available deployment/frontend -n $NAMESPACE --timeout=180s

# Step 10: Deploy Ingress (optional)
echo -e "\n${YELLOW}Step 10: Deploy Ingress? (ALB will be created)${NC}"
read -p "Deploy Ingress? (yes/no): " deploy_ingress
if [ "$deploy_ingress" == "yes" ]; then
    kubectl apply -f k8s/ingress.yaml
    echo -e "${GREEN}Ingress deployed. Waiting for ALB to be provisioned...${NC}"
    echo -e "${YELLOW}This may take 2-3 minutes...${NC}"
fi

# Display deployment status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Status${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Pods:${NC}"
kubectl get pods -n $NAMESPACE

echo -e "\n${YELLOW}Services:${NC}"
kubectl get svc -n $NAMESPACE

echo -e "\n${YELLOW}HPA (Horizontal Pod Autoscalers):${NC}"
kubectl get hpa -n $NAMESPACE

if [ "$deploy_ingress" == "yes" ]; then
    echo -e "\n${YELLOW}Ingress:${NC}"
    kubectl get ingress -n $NAMESPACE
    
    echo -e "\n${YELLOW}Getting ALB DNS name...${NC}"
    sleep 10
    ALB_DNS=$(kubectl get ingress taskmanager-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Not ready yet")
    echo -e "${GREEN}Application URL: http://$ALB_DNS${NC}"
else
    echo -e "\n${YELLOW}Getting LoadBalancer URL...${NC}"
    LB_URL=$(kubectl get svc frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Pending...")
    echo -e "${GREEN}Application URL: http://$LB_URL${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Useful commands:${NC}"
echo "View logs (backend): kubectl logs -f deployment/backend -n $NAMESPACE"
echo "View logs (frontend): kubectl logs -f deployment/frontend -n $NAMESPACE"
echo "Scale backend: kubectl scale deployment backend --replicas=5 -n $NAMESPACE"
echo "Get pod details: kubectl describe pod <pod-name> -n $NAMESPACE"
echo "Check health: kubectl exec -it deployment/backend -n $NAMESPACE -- wget -qO- http://localhost:3000/api/health"
