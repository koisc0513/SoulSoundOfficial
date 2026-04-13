🎧 SoulSound - Music Streaming Web App



📌 Overview

SoulSound là một ứng dụng web nghe nhạc trực tuyến, cho phép người dùng:

Đăng ký / đăng nhập tài khoản
Tìm kiếm và phát bài hát
Tạo và quản lý playlist cá nhân

Dự án được xây dựng theo kiến trúc Client - Server (RESTful API), tách biệt rõ ràng giữa frontend và backend.
-----------------------------------------------------------------------
🚀 Tech Stack
🔧 Backend
Java 17
Spring Boot
Spring Web (REST API)
Spring Security (Authentication & Authorization)
Spring Data JPA (Hibernate)
MySQL
🎨 Frontend
ReactJS 18
Vite
React Router
Axios
Zustand (State Management)
-----------------------------------------------------------------------
🏗️ Architecture
Frontend (React)
        ↓ (HTTP - Axios)
Backend (Spring Boot REST API)
        ↓
Database (MySQL)
Backend Structure
controller → service → repository → database
-----------------------------------------------------------------------
🔄 Main Features
🔐 Authentication (JWT-based)
🎵 Music streaming (play tracks)
🔍 Search functionality
📂 Playlist management
👤 User profile management
-----------------------------------------------------------------------
📂 Project Structure
```
soulsound/
│
├── backend/        # Spring Boot application
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   └── config/
│
├── frontend/       # React application
│   ├── components/
│   ├── pages/
│   ├── store/      # Zustand state
│   └── services/   # API calls
│
└── README.md
```
-----------------------------------------------------------------------
⚙️ Installation & Run
📌 Prerequisites
Java 17+
Node.js 18+
MySQL 8+

🔧 Backend Setup
cd backend
1. Cấu hình database trong application.yml hoặc application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/soulsound
spring.datasource.username=your_username
spring.datasource.password=your_password
2. Chạy ứng dụng
./mvnw spring-boot:run

Hoặc:

mvn spring-boot:run

Backend chạy tại:

http://localhost:8080
🎨 Frontend Setup
cd frontend
npm install
Chạy project
npm run dev

Frontend chạy tại:

http://localhost:5173
-----------------------------------------------------------------------
🔌 API Endpoints (Sample)
Method	Endpoint	Description
POST	/api/auth/login	Login
POST	/api/auth/register	Register
GET	/api/tracks	Get all tracks
GET	/api/search	Search music
POST	/api/playlists	Create playlist
-----------------------------------------------------------------------
🎯 Highlights
Áp dụng kiến trúc RESTful API chuẩn
Tách biệt frontend/backend (scalable & maintainable)
Sử dụng Spring Security + JWT cho authentication
Quản lý state hiệu quả với Zustand
Clean code với layered architecture
-----------------------------------------------------------------------
📸 Demo


-----------------------------------------------------------------------
📌 Future Improvements
🎧 Streaming real-time tốt hơn
❤️ Like / Favorite songs
📱 Responsive UI (mobile)
☁️ Deploy lên cloud (AWS / Docker)
-----------------------------------------------------------------------
👨‍💻 Author
Nguyễn Thành Trung
-----------------------------------------------------------------------
📄 License

This project is licensed under the MIT License.
-----------------------------------------------------------------------
⭐ For Recruiters

Đây là project cá nhân nhằm demonstrate kỹ năng:

Backend: Spring Boot, Security, REST API
Frontend: React, State Management
Fullstack integration
