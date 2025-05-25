pipeline {
    agent any

    environment {
        SSH_KEY = '/var/lib/jenkins/.ssh/id_rsa'
        REMOTE_USER = 'vunguyenkhoi47'
        REMOTE_HOST = '34.87.68.190'
        REMOTE_DIR = '/home/vunguyenkhoi47/kanox'
        REMOTE_JAR = "${REMOTE_DIR}/app.jar"
        NGINX_CONF = '/etc/nginx/sites-enabled/kanox.conf'
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

        stage('Determine Active/Standby Port') {
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

                    def activePort, standbyPort

                    if (status9090 == 'active') {
                        activePort = '9090'
                        standbyPort = '9091'
                    } else if (status9091 == 'active') {
                        activePort = '9091'
                        standbyPort = '9090'
                    } else {
                        error "❌ Không có service nào đang chạy (9090 hoặc 9091)."
                    }

                    // Set environment variables
                    env.ACTIVE_PORT = activePort
                    env.STANDBY_PORT = standbyPort

                    echo "✅ ACTIVE_PORT: ${env.ACTIVE_PORT}, STANDBY_PORT: ${env.STANDBY_PORT}"
                }
            }
        }

        stage('Upload to standby') {
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
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} \\
                        'sudo systemctl restart kanox-${STANDBY_PORT}.service'
                """
            }
        }

        stage('Health Check Standby') {
            steps {
                script {
                    def retries = 15
                    def healthy = false

                    for (int i = 0; i < retries; i++) {
                        def response = sh(
                            script: """
                                ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} \\
                                    'curl -s http://localhost:${STANDBY_PORT}/actuator/health || echo FAIL'
                            """,
                            returnStdout: true
                        ).trim()

                        if (response.contains('"status":"UP"')) {
                            echo "✅ Service on port ${STANDBY_PORT} is healthy."
                            healthy = true
                            break
                        }

                        echo "⌛ Waiting for service on port ${STANDBY_PORT} to become healthy (retry ${i + 1}/15)..."
                        sleep time: 5, unit: 'SECONDS'
                    }

                    if (!healthy) {
                        error "❌ Health check failed on port ${STANDBY_PORT} after 15 retries."
                    }
                }
            }
        }

        stage('Switch traffic with NGINX') {
            steps {
                echo "🔁 Switching NGINX traffic from ${ACTIVE_PORT} ➝ ${STANDBY_PORT}"
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} \\
                        'sudo sed -i "s/${ACTIVE_PORT}/${STANDBY_PORT}/g" ${NGINX_CONF} && \\
                         sudo nginx -t && \\
                         sudo systemctl reload nginx'
                """
            }
        }

        stage('Stop old service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} \\
                        'sudo systemctl stop kanox-${ACTIVE_PORT}.service'
                """
            }
        }
    }

    post {
        success {
            echo '✅ Triển khai Zero Downtime hoàn tất thành công!'
        }
        failure {
            echo '❌ Có lỗi xảy ra khi triển khai.'
        }
    }
}
