pipeline {
    agent any
    environment {
        SSH_KEY = '/var/lib/jenkins/.ssh/id_rsa'
        REMOTE_USER = 'vunguyenkhoi47'
        REMOTE_HOST = '34.87.68.190'
        REMOTE_PATH = "/home/${REMOTE_USER}/kanox"
        URL_BASE = "https://kanox.duckdns.org"
        MAX_RETRIES = 15
        RETRY_DELAY = 5
        BASIC_AUTH_USER = 'user'
        BASIC_AUTH_PASS = '123'
    }
    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            steps {
                dir('backend') {
                    sh 'chmod +x mvnw'
                    sh './mvnw clean install -DskipTests'
                }
            }
        }
        stage('Determine Active Port') {
            steps {
                script {
                    def active9090 = sh(script: "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} systemctl is-active kanox-9090.service || true", returnStdout: true).trim()
                    def active9091 = sh(script: "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} systemctl is-active kanox-9091.service || true", returnStdout: true).trim()
                    echo "kanox-9090 status: ${active9090}"
                    echo "kanox-9091 status: ${active9091}"

                    if (active9090 == "active" && active9091 != "active") {
                        env.ACTIVE_PORT = "9090"
                        env.STANDBY_PORT = "9091"
                    } else if (active9091 == "active" && active9090 != "active") {
                        env.ACTIVE_PORT = "9091"
                        env.STANDBY_PORT = "9090"
                    } else if (active9090 == "active" && active9091 == "active") {
                        env.ACTIVE_PORT = "9090"
                        env.STANDBY_PORT = "9091"
                    } else {
                        error("Không có service active! Cần kiểm tra hệ thống.")
                    }
                    echo "✅ ACTIVE_PORT: ${env.ACTIVE_PORT}, STANDBY_PORT: ${env.STANDBY_PORT}"
                }
            }
        }
        stage('Upload to Standby Port') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} mkdir -p ${REMOTE_PATH}
                    scp -i ${SSH_KEY} backend/target/social-media-0.0.1-SNAPSHOT.jar ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/app.jar
                """
            }
        }
        stage('Restart Standby Service') {
            steps {
                sh "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} sudo systemctl restart kanox-${env.STANDBY_PORT}.service"
            }
        }
        stage('Health Check Standby Service') {
            steps {
                script {
                    def healthy = false
                    for (int i = 1; i <= env.MAX_RETRIES.toInteger(); i++) {
                        echo "⌛ Waiting for service on port ${env.STANDBY_PORT} to become healthy (retry ${i}/${env.MAX_RETRIES})..."
                        def response = sh(script: "curl -s -u ${BASIC_AUTH_USER}:${BASIC_AUTH_PASS} ${URL_BASE}:${env.STANDBY_PORT}/actuator/health --insecure", returnStdout: true).trim()
                        echo "Health response: ${response}"
                        if (response.contains('"status":"UP"')) {
                            healthy = true
                            break
                        }
                        sleep env.RETRY_DELAY.toInteger()
                    }
                    if (!healthy) {
                        error("❌ Health check failed on port ${env.STANDBY_PORT} after ${env.MAX_RETRIES} retries.")
                    }
                }
            }
        }
        stage('Switch Traffic') {
            steps {
                script {
                    sh """
                        ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} sudo systemctl stop kanox-${env.ACTIVE_PORT}.service
                        ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} sudo systemctl start kanox-${env.STANDBY_PORT}.service
                    """
                }
            }
        }
    }
    post {
        failure {
            echo "❌ Có lỗi xảy ra khi triển khai."
        }
        success {
            echo "✅ Triển khai thành công."
        }
    }
}
