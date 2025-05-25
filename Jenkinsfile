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

        stage('Determine current active port') {
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

                    echo "kanox-9090 status: ${status9090}"
                    echo "kanox-9091 status: ${status9091}"

                    if (status9090 == 'active') {
                        env.ACTIVE_PORT = '9090'
                        env.STANDBY_PORT = '9091'
                    } else if (status9091 == 'active') {
                        env.ACTIVE_PORT = '9091'
                        env.STANDBY_PORT = '9090'
                    } else {
                        error "❌ Không có service nào đang chạy (9090 hoặc 9091). Không thể xác định ACTIVE_PORT."
                    }

                    echo "✅ ACTIVE_PORT: ${env.ACTIVE_PORT}, STANDBY_PORT: ${env.STANDBY_PORT}"
                }
            }
        }

        stage('Upload to standby port') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'mkdir -p ${REMOTE_DIR}'
                    scp -i ${SSH_KEY} backend/target/*.jar ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_JAR}
                """
            }
        }

        stage('Restart standby service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl restart kanox-${STANDBY_PORT}.service'
                """
            }
        }

        stage('Health check standby service') {
            steps {
                script {
                    def retries = 15
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

        stage('Switch traffic') {
            steps {
                echo "🔁 Switching traffic in NGINX from port ${ACTIVE_PORT} ➝ ${STANDBY_PORT}"
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        sudo nginx -t &&
                        sudo sed -i "s/${ACTIVE_PORT}/${STANDBY_PORT}/g" ${NGINX_CONF} &&
                        sudo systemctl reload nginx
                    '
                """
            }
        }

        stage('Stop old service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl stop kanox-${ACTIVE_PORT}.service'
                """
            }
        }
    }

    post {
        success {
            echo '✅ Zero Downtime Deployment hoàn tất thành công!'
        }
        failure {
            echo '❌ Có lỗi xảy ra khi triển khai.'
        }
    }
}
