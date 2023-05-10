// Jenkinsfile — Declarative pipeline for the Scientific Journal Platform
// Runs on any agent with PHP 8.1+, Composer, and Node.js installed.

pipeline {
    agent any

    environment {
        APP_ENV       = 'testing'
        DB_CONNECTION = 'sqlite'
        DB_DATABASE   = ':memory:'
        COMPOSE_DIR   = 'Laravel'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh 'composer install --no-interaction --prefer-dist --no-progress'
                    sh 'cp .env.example .env'
                    sh 'php artisan key:generate'
                }
            }
        }

        stage('Static Analysis') {
            steps {
                dir("${COMPOSE_DIR}") {
                    // If PHPStan is installed:
                    // sh './vendor/bin/phpstan analyse --memory-limit=512M'
                    sh 'php artisan route:list --json > /dev/null'   // sanity check
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh 'php artisan test --parallel --log-junit=storage/test-results.xml'
                }
            }
            post {
                always {
                    junit "${COMPOSE_DIR}/storage/test-results.xml"
                }
            }
        }

        stage('Build Assets') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to staging server...'
                // Example: rsync or Envoy deploy
                // sh 'php vendor/bin/envoy run deploy --server=staging'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                echo 'Deploying to production server...'
                dir("${COMPOSE_DIR}") {
                    // sh 'php vendor/bin/envoy run deploy --server=production'
                    sh 'php artisan migrate --force'
                    sh 'php artisan config:cache'
                    sh 'php artisan route:cache'
                    sh 'php artisan view:cache'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed — check test results and logs.'
            // Rollback: redeploy previous artifact
            // sh 'php vendor/bin/envoy run rollback --server=production'
        }
        always {
            cleanWs()
        }
    }
}
