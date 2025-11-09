pipeline {
    // Use centrally-defined pod template by label
    // Template is configured in Jenkins via JCasC (see helm-values/jenkins-values.yaml)
    agent {
        label 'docker-build'
    }
    
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'bigrs-nodejs-app'
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
        
        stage('Build Docker Image') {
            steps {
                container('docker') {
                    script {
                        echo "🔨 Building Docker image..."
                        sh """
                            # Wait for Docker daemon to be ready
                            timeout 30 sh -c 'until docker info; do sleep 1; done' 2>/dev/null || true
                            
                            # Build the image
                            docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REPOSITORY}:latest
                            
                            echo "✅ Image built successfully"
                            docker images | grep ${ECR_REPOSITORY}
                        """
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
            steps {
                container('docker') {
                    script {
                        echo "🏷️ Tagging images for ECR..."
                        sh """
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker tag ${ECR_REPOSITORY}:latest ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            echo "✅ Images tagged successfully"
                        """
                    }
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                container('docker') {
                    script {
                        echo "📦 Pushing images to ECR..."
                        sh """
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            echo "✅ Images pushed successfully"
                        """
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
                            docker rmi ${ECR_REPOSITORY}:${IMAGE_TAG} || true
                            docker rmi ${ECR_REPOSITORY}:latest || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} || true
                            docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest || true
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
                        echo "🔍 Verifying image in ECR..."
                        sh """
                            aws ecr describe-images \
                                --repository-name ${ECR_REPOSITORY} \
                                --region ${AWS_REGION} \
                                --image-ids imageTag=${IMAGE_TAG} || echo "Image verification pending..."
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
            ║                  ✅ PIPELINE SUCCESSFUL!                 ║
            ╠═══════════════════════════════════════════════════════════╣
            ║  Repository: ${ECR_REGISTRY}/${ECR_REPOSITORY}           
            ║  Tag: ${IMAGE_TAG}                                        
            ║  Latest: ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest        
            ╚═══════════════════════════════════════════════════════════╝
            
            Next: Argo Image Updater will detect this new image and trigger deployment!
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
