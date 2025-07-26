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
                            sh './mvnw clean package -DskipTests'

                            sh '''
                            mkdir -p tmp
                            cp "$SECRET_FILE" tmp/application-secret.properties
                        '''
                        }
                    }
                }
            }
        }

        stage('🧪 Debug Env: GOOGLE_APPLICATION_CREDENTIALS') {
            steps {
                sh '''
                    echo "🔍 Giá trị GOOGLE_APPLICATION_CREDENTIALS hiện tại:"
                    echo "$GOOGLE_APPLICATION_CREDENTIALS"
                    echo "---"
                    echo "🌍 Tất cả biến môi trường có chứa GOOGLE:"
                    env | grep GOOGLE || echo "❌ Không tìm thấy biến nào"
                '''
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

        stage('Health check standby') {
            steps {
                script {
                    def success = false
                    for (int i = 0; i < 30; i++) {
                        echo "🔁 Checking health on port ${STANDBY_PORT}, attempt ${i + 1}"
                        try {
                            def response = sh(script: "curl -s http://localhost:${STANDBY_PORT}/actuator/health", returnStdout: true).trim()
                            echo "✅ Health check response: ${response}"
                            
                            if (response.contains('"status":"UP"')) {
                                success = true
                                break
                            }
        
                            // ❌ Nếu trả về DOWN hoặc bất kỳ response bất thường nào
                            if (response.contains('"status":"DOWN"') || response == 'FAIL') {
                                echo "❌ Service trả về lỗi: ${response}, dừng kiểm tra sớm."
                                break
                            }
                        } catch (Exception e) {
                            echo "⚠️ Lỗi khi gọi curl: ${e.getMessage()}"
                            break // cũng có thể dùng continue nếu bạn muốn thử lại khi curl lỗi
                        }
        
                        sleep(time: 2, unit: 'SECONDS')
                    }
        
                    if (!success) {
                        error("❌ Service on port ${STANDBY_PORT} không healthy sau 30 lần kiểm tra.")
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

        stage('Cleanup secrets') {
            steps {
                sh """
                    ssh -i ${SSH_KEY} ${REMOTE_USER}@${REMOTE_HOST} '
                        echo "🧹 Xóa file secrets sau khi deploy..."
                        rm -f ${REMOTE_DIR}/application-secret.properties
                        rm -f ${REMOTE_DIR}/gcp-credentials.json
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
