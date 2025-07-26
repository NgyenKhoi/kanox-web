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
                    script {
                        withCredentials([
                            file(credentialsId: 'my-ssh-key', variable: 'SECRET_FILE'),
                            file(credentialsId: 'gcp-credentials', variable: 'GCP_CREDENTIALS_FILE')
                        ]) {
                            sh 'chmod +x mvnw'
        
                            // ✅ Copy file vào src/main/resources (đúng classpath Spring)
                            sh '''
                                rm -rf src/main/resources
                                mkdir -p src/main/resources
                                cp "$SECRET_FILE" src/main/resources/application-secret.properties
                                cp "$GCP_CREDENTIALS_FILE" src/main/resources/gcp-credentials.json
                            '''
        
                            // ✅ Không cần GOOGLE_APPLICATION_CREDENTIALS nếu file nằm trong classpath
                            sh './mvnw clean package -DskipTests'
        
                            // Gán lại để dùng ở stage sau
                            env.GCP_CREDENTIALS_FILE = GCP_CREDENTIALS_FILE
                        }
                    }
                }
            }
        }


        stage('Determine Active/Standby Port') {
            steps {
                script {
                    def status9090 = sh(script: "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'systemctl is-active kanox-9090.service || true'", returnStdout: true).trim()
                    def status9091 = sh(script: "ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'systemctl is-active kanox-9091.service || true'", returnStdout: true).trim()

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

                    env.ACTIVE_PORT = activePort
                    env.STANDBY_PORT = standbyPort
                    echo "✅ ACTIVE_PORT: ${activePort}, STANDBY_PORT: ${standbyPort}"
                }
            }
        }

                stage('Upload to standby') {
                    steps {
                        script {
                            // Copy jar và secrets trước
                            sh """
                                ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} 'mkdir -p ${REMOTE_DIR}'
        
                                scp -i ${SSH_KEY} backend/target/*.jar ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_JAR}
        
                                scp -i ${SSH_KEY} backend/tmp/application-secret.properties ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/application-secret.properties
                            """
        
                            // Sau đó copy GCP credentials trong withCredentials
                            withCredentials([
                                file(credentialsId: 'gcp-credentials', variable: 'GCP_CREDENTIALS_FILE')
                            ]) {
                                sh """
                                    scp -i ${SSH_KEY} \$GCP_CREDENTIALS_FILE ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/gcp-credentials.json
        
                                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                                        chmod 600 ${REMOTE_DIR}/application-secret.properties ${REMOTE_DIR}/gcp-credentials.json
                                        chown ${REMOTE_USER}:${REMOTE_USER} ${REMOTE_DIR}/application-secret.properties ${REMOTE_DIR}/gcp-credentials.json
                                    '
                                """
                            }
                        }
                    }
                }

        stage('Restart standby service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        set -e
                        echo "🛑 Dừng service kanox-${STANDBY_PORT} nếu đang chạy..."
                        sudo systemctl stop kanox-${STANDBY_PORT}.service || true
                        sleep 2
                        if sudo lsof -i :${STANDBY_PORT}; then
                            echo "⚠️ Port ${STANDBY_PORT} vẫn bị chiếm, kill thủ công..."
                            sudo fuser -k ${STANDBY_PORT}/tcp || true
                            sleep 2
                        fi
                        echo "🚀 Khởi động service kanox-${STANDBY_PORT}..."
                        sudo systemctl start kanox-${STANDBY_PORT}.service
                    '
                """
            }
        }

        stage('Health Check Standby') {
            steps {
                script {
                    def healthy = false
                    for (int i = 0; i < 30; i++) {
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

                        echo "⌛ Đợi service trên port ${STANDBY_PORT} khởi động (lần ${i+1}/30)..."
                        sleep time: 5, unit: 'SECONDS'
                    }

                    if (!healthy) {
                        error "❌ Service on port ${STANDBY_PORT} không khỏe sau 30 lần kiểm tra."
                    }
                }
            }
        }

        stage('Switch traffic with NGINX') {
            steps {
                echo "🔁 Đổi NGINX từ ${ACTIVE_PORT} ➝ ${STANDBY_PORT}"
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        sudo sed -i "s/${ACTIVE_PORT}/${STANDBY_PORT}/g" ${NGINX_CONF} && \
                        sudo nginx -t && \
                        sudo systemctl reload nginx
                    '
                """
            }
        }

        stage('Stop old service') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        echo "🛑 Dừng service cũ kanox-${ACTIVE_PORT}..."
                        sudo systemctl stop kanox-${ACTIVE_PORT}.service || true
                        sleep 2
                        if sudo lsof -i :${ACTIVE_PORT}; then
                            echo "⚠️ Port ${ACTIVE_PORT} vẫn bị chiếm, kill thủ công..."
                            sudo fuser -k ${ACTIVE_PORT}/tcp || true
                        fi
                    '
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
