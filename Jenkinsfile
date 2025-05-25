pipeline {
    agent any

    environment {
        GIT_CREDENTIALS_ID = 'git-token'
        SSH_KEY = '/var/lib/jenkins/.ssh/id_rsa'
        REMOTE_USER = 'vunguyenkhoi47'
        REMOTE_HOST = '34.87.68.190'
        REMOTE_DIR = '/home/vunguyenkhoi47/kanox'
        REMOTE_JAR = "${REMOTE_DIR}/app.jar"
        NGINX_CONF = '/etc/nginx/sites-enabled/kanox.conf'
        DOMAIN = 'kanox.duckdns.org'
    }

    stages {
        stage('Clone & Build') {
            steps {
                dir('backend') {
                    sh 'chmod +x mvnw'
                    sh './mvnw clean install -DskipTests'
                }
            }
        }

        stage('Determine active port') {
            steps {
                script {
                    def status9090 = sh(
                        script: "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'systemctl is-active kanox-9090.service || true'",
                        returnStdout: true
                    ).trim()

                    def status9091 = sh(
                        script: "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'systemctl is-active kanox-9091.service || true'",
                        returnStdout: true
                    ).trim()

                    if (status9090 == 'active') {
                        env.ACTIVE_PORT = '9090'
                        env.STANDBY_PORT = '9091'
                    } else if (status9091 == 'active') {
                        env.ACTIVE_PORT = '9091'
                        env.STANDBY_PORT = '9090'
                    } else {
                        error "❌ Không có service nào đang chạy (9090 hoặc 9091)."
                    }

                    echo "✅ ACTIVE_PORT: ${env.ACTIVE_PORT}, STANDBY_PORT: ${env.STANDBY_PORT}"
                }
            }
        }

        stage('Upload JAR to standby port') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'mkdir -p ${REMOTE_DIR}'
                    scp -i ${SSH_KEY} backend/target/*.jar ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_JAR}
                """
            }
        }

        stage('Stop standby service if running') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        sudo systemctl stop kanox-${STANDBY_PORT}.service || true
                        sudo fuser -k ${STANDBY_PORT}/tcp || true
                    '
                """
            }
        }

        stage('Start standby service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        sudo systemctl start kanox-${STANDBY_PORT}.service
                    '
                """
            }
        }

        stage('Health check standby service') {
            steps {
                script {
                    def retries = 5
                    def healthy = false

                    for (int i = 0; i < retries; i++) {
                        def response = sh(
                            script: "curl -s https://${DOMAIN}/actuator/health --insecure",
                            returnStdout: true
                        ).trim()

                        if (response.contains('"status":"UP"')) {
                            healthy = true
                            echo "✅ Service on port ${STANDBY_PORT} is healthy."
                            break
                        }

                        echo "⌛ Waiting for service on port ${STANDBY_PORT} to become healthy (retry ${i + 1}/${retries})..."
                        sleep(time: 5, unit: 'SECONDS')
                    }

                    if (!healthy) {
                        error "❌ Health check failed on port ${STANDBY_PORT} after ${retries} retries."
                    }
                }
            }
        }

        stage('Switch traffic in NGINX') {
            steps {
                echo "🔁 Switching proxy_pass in NGINX from port ${ACTIVE_PORT} to ${STANDBY_PORT}"
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        sudo sed -i "s/127.0.0.1:${ACTIVE_PORT}/127.0.0.1:${STANDBY_PORT}/g" ${NGINX_CONF} &&
                        sudo nginx -t &&
                        sudo systemctl reload nginx
                    '
                """
            }
        }

        stage('Stop old active service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        sudo systemctl stop kanox-${ACTIVE_PORT}.service
                    '
                """
            }
        }
    }

    post {
        success {
            echo '✅ Deployment hoàn tất, zero downtime thành công!'
        }
        failure {
            echo '❌ Lỗi khi triển khai, vui lòng kiểm tra logs.'
        }
    }
}
