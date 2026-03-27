pipeline {
    agent any

    // ── Triggers ──────────────────────────────────────────────────────────────
    // Poll SCM every 5 minutes for new commits.
    // Webhook alternative (preferred in production — no polling delay or load):
    //   triggers { githubPush() }
    //   Requires the GitHub plugin and a webhook pointing at:
    //   http://<jenkins-host>/github-webhook/
    triggers {
        pollSCM('H/5 * * * *')
    }

    // ── Environment ───────────────────────────────────────────────────────────
    environment {
        DOCKER_IMAGE    = 'yourusername/ci-cd-demo'
        DOCKER_TAG      = "${env.BUILD_NUMBER}"
        CONTAINER_NAME  = 'ci-cd-demo'
    }

    stages {

        // ── 1. Checkout ───────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ── 2. Install ────────────────────────────────────────────────────────
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        // ── 3. Test ───────────────────────────────────────────────────────────
        // jest-junit writes results to junit-results/results.xml by default.
        // Set JEST_JUNIT_OUTPUT_DIR / JEST_JUNIT_OUTPUT_NAME via env if needed.
        stage('Test') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'junit-results/results.xml'
                }
            }
        }

        // ── 4. Build ──────────────────────────────────────────────────────────
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        // ── 5. Docker ─────────────────────────────────────────────────────────
        stage('Docker') {
            steps {
                // Build and tag
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest ."

                // Push both tags to Docker Hub
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        // ── 6. Deploy ─────────────────────────────────────────────────────────
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                // Stop and remove the old container (ignore errors if not running)
                sh "docker stop ${CONTAINER_NAME} || true"
                sh "docker rm   ${CONTAINER_NAME} || true"

                // Start the new container
                sh """
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p 3000:3000 \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
        }
    }

    // ── Post ──────────────────────────────────────────────────────────────────
    post {
        always {
            cleanWs()
        }
        failure {
            echo "FAILED — check the stage logs above for details."
        }
    }
}
