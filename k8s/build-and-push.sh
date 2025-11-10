#!/bin/bash

# Build and Push Docker Images to AWS ECR
# This script builds both frontend and backend images and pushes them to ECR

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building and Pushing Docker Images${NC}"
echo -e "${GREEN}========================================${NC}"

# Variables - UPDATE THESE
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-YOUR_AWS_ACCOUNT_ID}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_REPO="taskmanager-backend"
FRONTEND_REPO="taskmanager-frontend"

echo -e "\n${YELLOW}Configuration:${NC}"
echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "ECR Registry: $ECR_REGISTRY"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Step 1: Login to ECR
echo -e "\n${GREEN}Step 1: Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Step 2: Create ECR repositories if they don't exist
echo -e "\n${GREEN}Step 2: Creating ECR repositories...${NC}"

# Create backend repository
if ! aws ecr describe-repositories --repository-names $BACKEND_REPO --region $AWS_REGION &> /dev/null; then
    echo "Creating backend repository..."
    aws ecr create-repository \
        --repository-name $BACKEND_REPO \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
else
    echo "Backend repository already exists"
fi

# Create frontend repository
if ! aws ecr describe-repositories --repository-names $FRONTEND_REPO --region $AWS_REGION &> /dev/null; then
    echo "Creating frontend repository..."
    aws ecr create-repository \
        --repository-name $FRONTEND_REPO \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
else
    echo "Frontend repository already exists"
fi

# Step 3: Build Backend Image
echo -e "\n${GREEN}Step 3: Building Backend Image...${NC}"
docker build -f Dockerfile.backend -t $BACKEND_REPO:latest .
docker tag $BACKEND_REPO:latest $ECR_REGISTRY/$BACKEND_REPO:latest
docker tag $BACKEND_REPO:latest $ECR_REGISTRY/$BACKEND_REPO:$(date +%Y%m%d-%H%M%S)

# Step 4: Build Frontend Image
echo -e "\n${GREEN}Step 4: Building Frontend Image...${NC}"
docker build -f Dockerfile.frontend -t $FRONTEND_REPO:latest .
docker tag $FRONTEND_REPO:latest $ECR_REGISTRY/$FRONTEND_REPO:latest
docker tag $FRONTEND_REPO:latest $ECR_REGISTRY/$FRONTEND_REPO:$(date +%Y%m%d-%H%M%S)

# Step 5: Push Backend Image
echo -e "\n${GREEN}Step 5: Pushing Backend Image to ECR...${NC}"
docker push $ECR_REGISTRY/$BACKEND_REPO:latest
docker push $ECR_REGISTRY/$BACKEND_REPO:$(date +%Y%m%d-%H%M%S)

# Step 6: Push Frontend Image
echo -e "\n${GREEN}Step 6: Pushing Frontend Image to ECR...${NC}"
docker push $ECR_REGISTRY/$FRONTEND_REPO:latest
docker push $ECR_REGISTRY/$FRONTEND_REPO:$(date +%Y%m%d-%H%M%S)

# Display summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Build and Push Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Images pushed:${NC}"
echo "Backend: $ECR_REGISTRY/$BACKEND_REPO:latest"
echo "Frontend: $ECR_REGISTRY/$FRONTEND_REPO:latest"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update k8s/backend-deployment.yaml with: $ECR_REGISTRY/$BACKEND_REPO:latest"
echo "2. Update k8s/frontend-deployment.yaml with: $ECR_REGISTRY/$FRONTEND_REPO:latest"
echo "3. Run: ./k8s/deploy.sh"
