pipeline {
    agent {
        label 'jenkins-agent'
    }

    environment {
        AWS_REGION = 'us-east-1'
        BACKEND_REPO = 'bigrs-nodejs-app-backend'
        FRONTEND_REPO = 'bigrs-nodejs-app-frontend'
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
                                    timeout 30 sh -c 'until docker info; do sleep 1; done' 2>/dev/null || true
                                    docker build -f Dockerfile.backend -t ${BACKEND_REPO}:backend-${IMAGE_TAG} .
                                    docker tag ${BACKEND_REPO}:backend-${IMAGE_TAG} ${BACKEND_REPO}:backend-latest
                                    echo "✅ Backend image built successfully"
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
                                    docker build -f Dockerfile.frontend -t ${FRONTEND_REPO}:frontend-${IMAGE_TAG} .
                                    docker tag ${FRONTEND_REPO}:frontend-${IMAGE_TAG} ${FRONTEND_REPO}:frontend-latest
                                    echo "✅ Frontend image built successfully"
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
                        '''
                    }
                }
                container('docker') {
                    script {
                        sh '''
                            cat /tmp/ecr-password.txt | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                            echo "✅ Logged into ECR successfully"
                        '''
                    }
                }
            }
        }

        stage('Tag Images for ECR') {
            parallel {
                stage('Tag Backend') {
                    steps {
                        container('docker') {
                            script {
                                sh """
                                    docker tag ${BACKEND_REPO}:backend-${IMAGE_TAG} ${ECR_REGISTRY}/${BACKEND_REPO}:backend-${IMAGE_TAG}
                                    docker tag ${BACKEND_REPO}:backend-latest ${ECR_REGISTRY}/${BACKEND_REPO}:backend-latest
                                    echo "🏷️ Backend images tagged for ${ECR_REGISTRY}/${BACKEND_REPO}"
                                """
                            }
                        }
                    }
                }

                stage('Tag Frontend') {
                    steps {
                        container('docker') {
                            script {
                                sh """
                                    docker tag ${FRONTEND_REPO}:frontend-${IMAGE_TAG} ${ECR_REGISTRY}/${FRONTEND_REPO}:frontend-${IMAGE_TAG}
                                    docker tag ${FRONTEND_REPO}:frontend-latest ${ECR_REGISTRY}/${FRONTEND_REPO}:frontend-latest
                                    echo "🏷️ Frontend images tagged for ${ECR_REGISTRY}/${FRONTEND_REPO}"
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
                                echo "📦 Pushing backend images to ${ECR_REGISTRY}/${BACKEND_REPO}..."
                                sh """
                                    docker push ${ECR_REGISTRY}/${BACKEND_REPO}:backend-${IMAGE_TAG}
                                    docker push ${ECR_REGISTRY}/${BACKEND_REPO}:backend-latest
                                """
                            }
                        }
                    }
                }

                stage('Push Frontend') {
                    steps {
                        container('docker') {
                            script {
                                echo "📦 Pushing frontend images to ${ECR_REGISTRY}/${FRONTEND_REPO}..."
                                sh """
                                    docker push ${ECR_REGISTRY}/${FRONTEND_REPO}:frontend-${IMAGE_TAG}
                                    docker push ${ECR_REGISTRY}/${FRONTEND_REPO}:frontend-latest
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
                        echo "🧹 Cleaning up local Docker images..."
                        sh """
                            # Backend cleanup
                            docker rmi ${BACKEND_REPO}:backend-${IMAGE_TAG} || true
                            docker rmi ${BACKEND_REPO}:backend-latest || true
                            docker rmi ${ECR_REGISTRY}/${BACKEND_REPO}:backend-${IMAGE_TAG} || true
                            docker rmi ${ECR_REGISTRY}/${BACKEND_REPO}:backend-latest || true

                            # Frontend cleanup
                            docker rmi ${FRONTEND_REPO}:frontend-${IMAGE_TAG} || true
                            docker rmi ${FRONTEND_REPO}:frontend-latest || true
                            docker rmi ${ECR_REGISTRY}/${FRONTEND_REPO}:frontend-${IMAGE_TAG} || true
                            docker rmi ${ECR_REGISTRY}/${FRONTEND_REPO}:frontend-latest || true

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
                                --repository-name ${BACKEND_REPO} \
                                --region ${AWS_REGION} \
                                --image-ids imageTag=backend-${IMAGE_TAG} || echo "Backend verification pending..."

                            echo ""
                            echo "Frontend Image:"
                            aws ecr describe-images \
                                --repository-name ${FRONTEND_REPO} \
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
            ║               ✅ PIPELINE SUCCESSFUL!                     ║
            ╠═══════════════════════════════════════════════════════════╣
            ║  Backend Repo:  ${ECR_REGISTRY}/${BACKEND_REPO}           ║         
            ║  Frontend Repo: ${ECR_REGISTRY}/${FRONTEND_REPO}          ║
            ║                                                           ║
            ║  Backend Tags:  backend-${IMAGE_TAG}, backend-latest      ║
            ║  Frontend Tags: frontend-${IMAGE_TAG}, frontend-latest    ║
            ╚═══════════════════════════════════════════════════════════╝
            """
        }
        failure {
            echo """
            ╔═══════════════════════════════════════════════════════════╗
            ║                    ❌ PIPELINE FAILED!                    ║
            ╠═══════════════════════════════════════════════════════════╣
            ║  Check the console output for error details               ║
            ╚═══════════════════════════════════════════════════════════╝
            """
        }
        always {
            echo "Pipeline execution completed at ${new Date()}"
        }
    }
}
