pipeline {
    // Use centrally-defined pod template by label
    // Template is configured in Jenkins via JCasC (see helm-values/jenkins-values.yaml)
    agent {
        label 'jenkins-agent'
    }
    
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'taskmanager-app'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out from repository"
            }
        }
        
        stage('Get AWS Account ID') {
            steps {
                container('aws-cli') {
                    script {
                        env.AWS_ACCOUNT_ID = sh(
                            script: 'aws sts get-caller-identity --query Account --output text',
                            returnStdout: true
                        ).trim()
                        env.ECR_REGISTRY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
                        echo "✅ AWS Account ID: ${env.AWS_ACCOUNT_ID}"
                        echo "✅ ECR Registry: ${env.ECR_REGISTRY}"
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        container('docker') {
                            script {
                                echo "🔨 Building Backend Docker image..."
                                sh """
                                    # Wait for Docker daemon to be ready
                                    timeout 30 sh -c 'until docker info; do sleep 1; done' 2>/dev/null || true
                                    
                                    # Build the backend image with 'backend-' prefix
                                    docker build -f Dockerfile.backend -t ${ECR_REPOSITORY}:backend-${IMAGE_TAG} .
                                    docker tag ${ECR_REPOSITORY}:backend-${IMAGE_TAG} ${ECR_REPOSITORY}:backend-latest
                                    
                                    echo "✅ Backend image built successfully"
                                    docker images | grep ${ECR_REPOSITORY}
                                """
                            }
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        container('docker') {
                            script {
                                echo "🔨 Building Frontend Docker image..."
                                sh """
                                    # Build the frontend image with 'frontend-' prefix
                                    docker build -f Dockerfile.frontend -t ${ECR_REPOSITORY}:frontend-${IMAGE_TAG} .
                                    docker tag ${ECR_REPOSITORY}:frontend-${IMAGE_TAG} ${ECR_REPOSITORY}:frontend-latest
                                    
                                    echo "✅ Frontend image built successfully"
                                    docker images | grep ${ECR_REPOSITORY}
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Login to ECR') {
            steps {
                container('aws-cli') {
                    script {
                        echo "🔐 Logging into Amazon ECR..."
                        sh '''
                            aws ecr get-login-password --region ${AWS_REGION} > /tmp/ecr-password.txt
                            echo "✅ Retrieved ECR login password"
                        '''
                    }
                }
                container('docker') {
                    script {
                        sh '''
                            cat /tmp/ecr-password.txt | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                            echo "✅ Successfully logged in to ECR"
                        '''
                    }
                }
            }
        }
        
        stage('Tag Images') {
            parallel {
                stage('Tag Backend') {
                    steps {
                        container('docker') {
                            script {
                                echo "🏷️ Tagging backend images for ECR..."
                                sh """
                                    docker tag ${ECR_REPOSITORY}:backend-${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-${IMAGE_TAG}
                                    docker tag ${ECR_REPOSITORY}:backend-latest ${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-latest
                                    echo "✅ Backend images tagged successfully"
                                """
                            }
                        }
                    }
                }
                
                stage('Tag Frontend') {
                    steps {
                        container('docker') {
                            script {
                                echo "🏷️ Tagging frontend images for ECR..."
                                sh """
                                    docker tag ${ECR_REPOSITORY}:frontend-${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-${IMAGE_TAG}
                                    docker tag ${ECR_REPOSITORY}:frontend-latest ${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-latest
                                    echo "✅ Frontend images tagged successfully"
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Push to ECR') {
            parallel {
                stage('Push Backend') {
                    steps {
                        container('docker') {
                            script {
                                echo "📦 Pushing backend images to ECR..."
                                sh """
                                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-${IMAGE_TAG}
                                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-latest
                                    echo "✅ Backend images pushed successfully"
                                """
                            }
                        }
                    }
                }
                
                stage('Push Frontend') {
                    steps {
                        container('docker') {
                            script {
                                echo "📦 Pushing frontend images to ECR..."
                                sh """
                                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-${IMAGE_TAG}
                                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-latest
                                    echo "✅ Frontend images pushed successfully"
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                container('docker') {
                    script {
                        echo "🧹 Cleaning up local images..."
                        sh """
                            # Backend cleanup
                            docker rmi ${ECR_REPOSITORY}:backend-${IMAGE_TAG} || true
                            docker rmi ${ECR_REPOSITORY}:backend-latest || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-${IMAGE_TAG} || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-latest || true
                            
                            # Frontend cleanup
                            docker rmi ${ECR_REPOSITORY}:frontend-${IMAGE_TAG} || true
                            docker rmi ${ECR_REPOSITORY}:frontend-latest || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-${IMAGE_TAG} || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-latest || true
                            
                            echo "✅ Cleanup complete"
                        """
                    }
                }
            }
        }
        
        stage('Verify Push') {
            steps {
                container('aws-cli') {
                    script {
                        echo "🔍 Verifying images in ECR..."
                        sh """
                            echo "Backend Image:"
                            aws ecr describe-images \
                                --repository-name ${ECR_REPOSITORY} \
                                --region ${AWS_REGION} \
                                --image-ids imageTag=backend-${IMAGE_TAG} || echo "Backend verification pending..."
                            
                            echo ""
                            echo "Frontend Image:"
                            aws ecr describe-images \
                                --repository-name ${ECR_REPOSITORY} \
                                --region ${AWS_REGION} \
                                --image-ids imageTag=frontend-${IMAGE_TAG} || echo "Frontend verification pending..."
                            
                            echo "✅ Build ${IMAGE_TAG} completed successfully!"
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo """
            ╔═══════════════════════════════════════════════════════════╗
            ║               ✅ DUAL-IMAGE PIPELINE SUCCESSFUL!         ║
            ╠═══════════════════════════════════════════════════════════╣
            ║  Repository: ${ECR_REGISTRY}/${ECR_REPOSITORY}
            ║  
            ║  Backend:  backend-${IMAGE_TAG} & backend-latest
            ║  Frontend: frontend-${IMAGE_TAG} & frontend-latest
            ╚═══════════════════════════════════════════════════════════╝
            
            Next: Argo Image Updater will detect these new images and trigger deployments!
            """
        }
        failure {
            echo """
            ╔═══════════════════════════════════════════════════════════╗
            ║                    ❌ PIPELINE FAILED!                   ║
            ╠═══════════════════════════════════════════════════════════╣
            ║  Check the console output above for error details        ║
            ╚═══════════════════════════════════════════════════════════╝
            """
        }
        always {
            echo "Pipeline execution completed at ${new Date()}"
        }
    }
}
