# 🌐 Welcome to Kanox Web

Kanox Web is a modern, full-featured **social networking platform** built with scalability, real-time communication, and developer-first CI/CD in mind.

## 🚀 Overview

This project includes:

- A **frontend** hosted on [Netlify]([https://www.netlify.com/](https://kanox-social-media.netlify.app/)
- A **backend** built with **Spring Boot**
- Real-time messaging and call features using **WebSocket** and **Redis Pub/Sub**
- CI/CD pipeline with **Jenkins**
- Logging and monitoring with **Grafana + Loki**
- **Elasticsearch** for advanced search functionality
- Integrated **Map API** for location-based features

---

## 🛠️ Tech Stack

| Layer         | Technology                     |
|--------------|---------------------------------|
| Frontend     | ReactJS + Tailwind CSS          |
| Hosting      | Netlify                         |
| Backend      | Java Spring Boot                |
| CI/CD        | Jenkins                         |
| Logging      | Grafana + Loki                  |
| Search       | Elasticsearch                   |
| Cache / Pub  | Redis                           |
| Realtime     | WebSocket (STOMP protocol)      |
| Database     | SQL Server                      |
| Others       | Map API integration             |

---

## 🔄 CI/CD with Jenkins

- Jenkins pulls from GitHub and builds backend artifacts.
- Zero downtime deployment is configured.
- SSH-based secure deployment to GCP VM or VPS.
- Secrets are separated into `application-secret.properties`.

---

## 📊 Logging & Monitoring

- **Loki** collects logs via Promtail from the backend server.
- **Grafana** visualizes and monitors logs, CPU, memory, and app metrics.
- Dashboards can track error rates, system performance, and alerts.

---

## 🧠 Key Features

### ✅ Core Social Network

- Post creation with text, images, videos, and GIFs
- Privacy settings (public, friends-only, custom list)
- Like, comment, save, share
- Newsfeed algorithm based on privacy and group/friend relations

### 👥 Friend System

- Friend request, accept, reject
- Mutual friends, followers
- Privacy setting based on friend relationship

### 💬 Realtime Messaging

- One-to-one and group chats
- WebSocket + Redis Pub/Sub for scalable messaging
- Message reactions, media attachments
- Typing indicator, read receipt

### 📞 Voice & Video Calling

- WebRTC-based call system using API
- Call notifications integrated with WebSocket
- Call logs and connection status stored

### 👨‍👩‍👧 Groups & Communities

- Create/join public or private groups
- Group feed
- Group role: admin, member
- Invite others to group

### 🔍 Search

- Elasticsearch-powered global search
- Search users, posts, and groups in real-time

### 📍 Location Features

- Map API integration for tagging location in posts
- View posts near your area
- Check-in functionality

---

## 🗝️ Authentication & Security

- Simple JWT-based authentication Google OAuth2 login support
- Custom privacy lists and blocking


