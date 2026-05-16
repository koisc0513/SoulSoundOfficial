# 🎧 SoulSound — Music Streaming Web App

SoulSound là ứng dụng web nghe nhạc trực tuyến được xây dựng theo kiến trúc **Client-Server (RESTful API)**, tách biệt hoàn toàn giữa Frontend và Backend. Người dùng có thể đăng ký tài khoản, upload/phát nhạc, tương tác xã hội (like, comment, follow), quản lý playlist cá nhân và xem lịch sử nghe nhạc.

---

## 📌 Mục lục

- [Tech Stack](#-tech-stack)
- [Tính năng](#-tính-năng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Project Structure](#-project-structure)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
  - [Cách 1: Chạy với Docker (Khuyến nghị)](#cách-1-chạy-với-docker-khuyến-nghị)
  - [Cách 2: Chạy thủ công (Local Dev)](#cách-2-chạy-thủ-công-local-dev)
- [API Endpoints](#-api-endpoints)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)
- [Biến môi trường](#-biến-môi-trường)
- [Tác giả](#-tác-giả)

---

## 🛠 Tech Stack

### Backend
| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Java 17 |
| Framework | Spring Boot 3.5 |
| REST API | Spring Web (MVC) |
| Bảo mật | Spring Security + JWT (jjwt 0.12.3) |
| ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Build tool | Maven (Maven Wrapper) |
| Code generation | Lombok |
| Runtime container | Docker (eclipse-temurin:17-jre-jammy) |

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | JavaScript (JSX) |
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| State Management | Zustand + React Context |
| Icons | Bootstrap Icons |
| Web server (prod) | Nginx (Alpine) |

---

## ✨ Tính năng

### Người dùng thông thường
- **Xác thực:** Đăng ký, đăng nhập, JWT-based authentication
- **Phát nhạc:** Trình phát nhạc toàn trang (PlayerBar), phát từ feed hoặc playlist
- **Upload nhạc:** Tải lên file audio + thumbnail, chọn quyền riêng tư (public/private)
- **Tìm kiếm:** Tìm bài hát theo tên/tag/thể loại
- **Tương tác xã hội:** Like bài hát, comment, reply comment, follow/unfollow user
- **Playlist:** Tạo/sửa/xóa playlist, thêm-xóa bài hát, reorder, thay ảnh bìa
- **Profile:** Xem/chỉnh sửa thông tin cá nhân, avatar, banner
- **Lịch sử nghe:** Tự động lưu bài hát đã phát
- **Thông báo:** Nhận thông báo khi có người like/comment/follow
- **Overview:** Thống kê cá nhân (tổng lượt nghe, likes, followers...)

### Quản trị viên (Admin)
- **Dashboard:** Tổng quan số liệu hệ thống
- **Quản lý user:** Xem danh sách, khoá/mở khoá tài khoản
- **Quản lý track:** Xem danh sách, ẩn/hiện bài hát vi phạm

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                   Client Browser                    │
│              React 18 + Vite + Zustand              │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / Axios
                     │ (dev: proxy qua Vite :5173)
                     │ (prod: proxy qua Nginx :3000)
┌────────────────────▼────────────────────────────────┐
│              Spring Boot REST API                   │
│                  :8081                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │Controller│→ │ Service  │→ │    Repository     │ │
│  └──────────┘  └──────────┘  └────────┬──────────┘ │
│                                        │            │
│  Spring Security (JWT Filter)          │            │
└────────────────────────────────────────┼────────────┘
                                         │ JPA/Hibernate
┌────────────────────────────────────────▼────────────┐
│                   MySQL 8                           │
│              (Docker: port 3307)                    │
└─────────────────────────────────────────────────────┘
```

Luồng request điển hình:
```
Browser → Nginx (3000) → [/api/*] proxy → Spring Boot (8081) → MySQL
                       → [/uploads/*] proxy → Spring Boot (8081) → File System
                       → [/*] serve React SPA (index.html)
```

---

## 📂 Project Structure

```
soulsound.zip
├── docker-compose.yml              # Orchestration: mysql + backend + frontend
├── README.md
│
├── soulsound/                      # ── BACKEND (Spring Boot) ──────────────────
│   ├── Dockerfile                  # Multi-stage build: JDK build → JRE runtime
│   ├── pom.xml                     # Maven dependencies
│   ├── mvnw / mvnw.cmd             # Maven wrapper
│   ├── .mvn/wrapper/
│   │   └── maven-wrapper.properties
│   └── src/
│       ├── main/
│       │   ├── java/com/soulsound/
│       │   │   ├── SoulsoundApplication.java       # Entry point
│       │   │   │
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java         # JWT filter chain, CORS, role rules
│       │   │   │   └── WebMvcConfig.java            # Static resource serving (/uploads)
│       │   │   │
│       │   │   ├── controller/api/
│       │   │   │   ├── AuthApiController.java       # POST /login, /register; GET /me
│       │   │   │   ├── TrackApiController.java      # CRUD track, play, like, comment
│       │   │   │   ├── UserApiController.java       # Profile, follow, liked, history, overview
│       │   │   │   ├── PlaylistApiController.java   # CRUD playlist, track order, cover
│       │   │   │   ├── SearchApiController.java     # GET /api/search?q=
│       │   │   │   ├── NotificationApiController.java # Thông báo, đánh dấu đã đọc
│       │   │   │   └── AdminApiController.java      # Dashboard, quản lý user/track
│       │   │   │
│       │   │   ├── dto/
│       │   │   │   ├── RegisterDto.java
│       │   │   │   ├── ProfileEditDto.java
│       │   │   │   ├── TrackUploadDto.java
│       │   │   │   └── TrackEditDto.java
│       │   │   │
│       │   │   ├── entity/
│       │   │   │   ├── User.java                   # user, roles, followers
│       │   │   │   ├── Track.java                  # bài hát, privacy, play count
│       │   │   │   ├── Playlist.java               # playlist + track list
│       │   │   │   ├── Like.java
│       │   │   │   ├── Comment.java                # comment + reply (self-ref)
│       │   │   │   ├── Notification.java
│       │   │   │   ├── ListeningHistory.java
│       │   │   │   ├── Role.java                   # Enum: USER, ADMIN
│       │   │   │   ├── UserStatus.java             # Enum: ACTIVE, BLOCKED
│       │   │   │   ├── TrackPrivacy.java            # Enum: PUBLIC, PRIVATE
│       │   │   │   └── NotificationType.java        # Enum: LIKE, COMMENT, FOLLOW
│       │   │   │
│       │   │   ├── repository/
│       │   │   │   ├── UserRepository.java
│       │   │   │   ├── TrackRepository.java
│       │   │   │   ├── PlaylistRepository.java
│       │   │   │   ├── LikeRepository.java
│       │   │   │   ├── CommentRepository.java
│       │   │   │   ├── NotificationRepository.java
│       │   │   │   └── ListeningHistoryRepository.java
│       │   │   │
│       │   │   ├── security/
│       │   │   │   ├── JwtUtil.java                # Tạo & verify JWT token
│       │   │   │   ├── JwtAuthFilter.java          # OncePerRequestFilter
│       │   │   │   └── CustomUserDetails.java
│       │   │   │
│       │   │   └── service/
│       │   │       ├── UserService.java
│       │   │       ├── TrackService.java
│       │   │       ├── PlaylistService.java
│       │   │       ├── NotificationService.java
│       │   │       ├── FileStorageService.java     # Lưu file upload vào disk
│       │   │       └── CustomUserDetailsService.java
│       │   │
│       │   └── resources/
│       │       ├── application.properties          # Cấu hình DB, JWT, server port, upload
│       │       └── static/images/
│       │           ├── default-avatar.png
│       │           └── default-thumb.png
│       └── test/
│
└── soulsound-frontend/             # ── FRONTEND (React + Vite) ─────────────────
    ├── Dockerfile                  # Multi-stage build: Node build → Nginx serve
    ├── nginx.conf                  # SPA fallback + API proxy + static cache
    ├── vite.config.js              # Dev proxy /api → :8081
    ├── index.html
    ├── package.json                # react, react-router-dom, axios, zustand
    └── src/
        ├── main.jsx                # Entry point, BrowserRouter
        ├── App.jsx                 # Route definitions, PrivateRoute, AdminRoute
        │
        ├── api/
        │   └── index.js            # Axios instance, interceptors (attach JWT)
        │
        ├── context/
        │   ├── AuthContext.jsx     # User auth state (login/logout/register)
        │   └── PlayerContext.jsx   # Global music player state (queue, play/pause)
        │
        ├── components/
        │   ├── Layout/
        │   │   ├── Layout.jsx      # Wrapper: Header + PlayerBar + <Outlet>
        │   │   ├── Header.jsx      # Nav, search bar, user menu
        │   │   └── NotificationBell.jsx
        │   ├── Player/
        │   │   └── PlayerBar.jsx   # Thanh phát nhạc cố định phía dưới
        │   ├── Track/
        │   │   └── TrackCard.jsx   # Card bài hát (thumbnail, like, play)
        │   └── common/
        │       └── PlaylistModal.jsx
        │
        ├── pages/
        │   ├── Home.jsx            # Feed bài hát công khai
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Search.jsx
        │   ├── TrackDetail.jsx     # Chi tiết bài hát + comments
        │   ├── TrackUpload.jsx
        │   ├── TrackEdit.jsx
        │   ├── Profile.jsx         # Trang cá nhân người dùng
        │   ├── ProfileEdit.jsx
        │   ├── Liked.jsx           # Danh sách bài hát đã thích
        │   ├── History.jsx         # Lịch sử nghe
        │   ├── Playlists.jsx       # Danh sách playlist
        │   ├── PlaylistDetail.jsx
        │   ├── Overview.jsx        # Thống kê cá nhân
        │   └── admin/
        │       ├── Dashboard.jsx
        │       ├── Users.jsx
        │       └── Tracks.jsx
        │
        └── styles/
            └── index.css           # Global CSS (dark theme, custom UI)
```

---

## ⚙️ Cài đặt & Chạy

### Yêu cầu hệ thống

**Chạy với Docker:**
- Docker Desktop (v24+) hoặc Docker Engine + Docker Compose v2

**Chạy thủ công:**
- Java 17+
- Maven 3.8+ (hoặc dùng `mvnw` đi kèm)
- Node.js 18+
- MySQL 8+

---

### Cách 1: Chạy với Docker (Khuyến nghị)

Cách này khởi động toàn bộ hệ thống (MySQL + Backend + Frontend) chỉ với **một lệnh duy nhất**, không cần cài Java hay Node.js.

**Bước 1:** Clone / giải nén project

```bash
unzip soulsound.zip
cd soulsound
```

**Bước 2:** Build và khởi động tất cả services

```bash
docker compose up --build
```

> Lần đầu chạy sẽ mất vài phút để Docker pull images và build. Các lần sau sẽ nhanh hơn nhờ layer cache.

**Bước 3:** Kiểm tra các services đã chạy

```
✅ soulsound-mysql     → MySQL 8 tại port 3307
✅ soulsound-backend   → Spring Boot API tại http://localhost:8081
✅ soulsound-frontend  → React App tại http://localhost:3000
```

**Truy cập ứng dụng:** [http://localhost:3000](http://localhost:3000)

**Dừng ứng dụng:**

```bash
docker compose down
```

**Dừng và xóa toàn bộ dữ liệu (database, uploads):**

```bash
docker compose down -v
```

---

### Cách 2: Chạy thủ công (Local Dev)

#### Bước 1: Tạo database MySQL

Đăng nhập MySQL và tạo database:

```sql
CREATE DATABASE soulsound CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Bước 2: Cấu hình Backend

Mở file `soulsound/src/main/resources/application.properties` và chỉnh sửa phần kết nối database:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/soulsound?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

Các cấu hình khác có thể để mặc định hoặc override qua biến môi trường.

#### Bước 3: Chạy Backend

```bash
cd soulsound

# Dùng Maven wrapper (không cần cài Maven)
./mvnw spring-boot:run

# Hoặc nếu đã cài Maven
mvn spring-boot:run
```

Backend khởi động tại: `http://localhost:8081`

Hibernate sẽ tự động tạo/cập nhật bảng trong database nhờ cấu hình `spring.jpa.hibernate.ddl-auto=update`.

#### Bước 4: Chạy Frontend

Mở terminal mới:

```bash
cd soulsound-frontend

# Cài dependencies
npm install

# Chạy development server
npm run dev
```

Frontend khởi động tại: `http://localhost:5173`

> **Lưu ý:** Vite đã được cấu hình proxy `/api` và `/uploads` sang `http://localhost:8081`, nên không cần lo về CORS khi dev.

#### Bước 5 (tuỳ chọn): Build Frontend cho Production

```bash
cd soulsound-frontend
npm run build
# Output: soulsound-frontend/dist/
```

---

## 🔌 API Endpoints

Tất cả API có prefix `/api`. JWT token gửi qua header `Authorization: Bearer <token>`.

### Authentication — `/api/auth`
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | ❌ |
| POST | `/api/auth/login` | Đăng nhập, trả về JWT | ❌ |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại | ✅ |

### Tracks — `/api/tracks`
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/tracks?page=0` | Lấy feed bài hát công khai | ❌ |
| GET | `/api/tracks/{id}` | Chi tiết bài hát | ❌ |
| POST | `/api/tracks/upload` | Upload bài hát mới (multipart) | ✅ |
| PUT | `/api/tracks/{id}` | Sửa thông tin bài hát | ✅ |
| DELETE | `/api/tracks/{id}` | Xóa bài hát | ✅ |
| POST | `/api/tracks/{id}/play` | Ghi nhận lượt phát | ✅ |
| POST | `/api/tracks/{id}/like` | Toggle like/unlike | ✅ |
| POST | `/api/tracks/{id}/comments` | Thêm bình luận | ✅ |
| POST | `/api/tracks/{id}/comments/{commentId}/reply` | Reply bình luận | ✅ |
| DELETE | `/api/tracks/comments/{commentId}` | Xóa bình luận | ✅ |

### Users — `/api/users`
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/users/profile/{email}` | Xem profile người dùng | ❌ |
| PUT | `/api/users/profile` | Cập nhật profile | ✅ |
| POST | `/api/users/banner` | Upload ảnh banner | ✅ |
| POST | `/api/users/{id}/follow` | Toggle follow/unfollow | ✅ |
| GET | `/api/users/{id}/followers` | Danh sách followers | ❌ |
| GET | `/api/users/{id}/following` | Danh sách đang follow | ❌ |
| GET | `/api/users/liked` | Bài hát đã liked | ✅ |
| GET | `/api/users/history` | Lịch sử nghe nhạc | ✅ |
| GET | `/api/users/suggested` | Gợi ý người dùng nên follow | ✅ |
| GET | `/api/users/overview` | Thống kê cá nhân | ✅ |

### Playlists — `/api/playlists`
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/playlists` | Danh sách playlist của tôi | ✅ |
| GET | `/api/playlists/{id}` | Chi tiết playlist | ✅ |
| POST | `/api/playlists` | Tạo playlist mới | ✅ |
| PUT | `/api/playlists/{id}` | Sửa tên/mô tả playlist | ✅ |
| DELETE | `/api/playlists/{id}` | Xóa playlist | ✅ |
| POST | `/api/playlists/{id}/tracks/{trackId}` | Thêm track vào playlist | ✅ |
| DELETE | `/api/playlists/{id}/tracks/{trackId}` | Xóa track khỏi playlist | ✅ |
| PUT | `/api/playlists/{id}/cover` | Đổi ảnh bìa playlist | ✅ |
| DELETE | `/api/playlists/{id}/cover` | Xóa ảnh bìa playlist | ✅ |
| PUT | `/api/playlists/{id}/reorder` | Sắp xếp lại thứ tự track | ✅ |

### Search — `/api/search`
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/search?q=keyword` | Tìm kiếm bài hát | ❌ |

### Notifications — `/api/notifications`
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/notifications` | Danh sách thông báo | ✅ |
| GET | `/api/notifications/unread-count` | Số thông báo chưa đọc | ✅ |
| POST | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc | ✅ |
| POST | `/api/notifications/{id}/read` | Đánh dấu 1 thông báo đã đọc | ✅ |

### Admin — `/api/admin` *(Yêu cầu role ADMIN)*
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/dashboard` | Thống kê tổng quan hệ thống |
| GET | `/api/admin/users` | Danh sách tất cả users |
| POST | `/api/admin/users/{id}/toggle-block` | Khoá/mở khoá user |
| GET | `/api/admin/tracks` | Danh sách tất cả tracks |
| POST | `/api/admin/tracks/{id}/toggle-hidden` | Ẩn/hiện bài hát |

---

## 🔐 Tài khoản mặc định

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@soulsound.com` | `Admin@123` |

> **Lưu ý bảo mật:** Đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên trong môi trường production.

---

## 🌐 Biến môi trường

| Biến | Mô tả | Giá trị mặc định |
|------|-------|-----------------|
| `SPRING_DATASOURCE_URL` | JDBC URL kết nối MySQL | `jdbc:mysql://mysql:3306/soulsound...` |
| `SPRING_DATASOURCE_USERNAME` | Username MySQL | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Password MySQL | `root` |
| `APP_UPLOAD_DIR` | Thư mục lưu file upload | `uploads` |
| `JWT_SECRET` | Secret key để ký JWT (≥256 bits) | `soulsound-super-secret-key-...` |
| `APP_CORS_ORIGINS` | Origin được phép CORS | `http://localhost:3000` |
| `server.port` | Port backend | `8081` |
| `jwt.expiration` | Thời hạn JWT (ms) | `86400000` (24h) |

Trong môi trường Docker, các biến này được khai báo trong `docker-compose.yml`. Khi chạy local, có thể ghi đè trong `application.properties` hoặc truyền qua `-Dtên.biến=giá_trị`.

## Danh mục hình ảnh demo

<div align="center">

### 🎵 Home Page

<img width="1920" height="1080" alt="Home Page" src="https://github.com/user-attachments/assets/7de46f7e-26d5-4b28-9c70-cf1e2c2ae977" />

</div>

---

<div align="center">

### 👤 Profile Page

<img width="1920" height="1080" alt="Profile Page" src="https://github.com/user-attachments/assets/6c3cf025-8e96-4f98-a796-23a6ba9b4aa2" />

</div>

---

<div align="center">

### 📊 User Overview Dashboard

<img width="1920" height="1080" alt="User Overview" src="https://github.com/user-attachments/assets/56d4d895-e8de-42c8-8ce4-2e0ffc2d055a" />

</div>

---

<div align="center">

### 🎼 Playlist Management

<img width="1920" height="1080" alt="Playlist Page" src="https://github.com/user-attachments/assets/0d7e2e56-b1dc-47d2-aae9-05599db21a7c" />

</div>

---

<div align="center">

### 🎧 Track Detail Page

<img width="1920" height="1080" alt="Track Detail" src="https://github.com/user-attachments/assets/77982903-2ed8-405e-89aa-61fe2f951969" />

</div>

---

<div align="center">

### ⚙️ Admin Dashboard

<img width="1920" height="1080" alt="Admin Dashboard" src="https://github.com/user-attachments/assets/25961797-2f6d-44c8-98a6-61c674cc7cfa" />

</div>

---

<div align="center">

### 📈 Admin Overview Analytics

<img width="1920" height="1080" alt="Admin Overview" src="https://github.com/user-attachments/assets/11f2ac3e-9d9c-444d-91db-3994a7e1867e" />

</div>

---

<div align="center">

### 👥 Admin User Management

<img width="1920" height="1080" alt="Admin User" src="https://github.com/user-attachments/assets/949009dd-3a14-4e5f-bb04-106fa1860f34" />

</div>

---

<div align="center">

### 🎶 Admin Track Management

<img width="1920" height="1080" alt="Admin Track" src="https://github.com/user-attachments/assets/42abaa0a-91ea-4f30-8758-9fb8ba721f6b" />

</div>
---

## 👨‍💻 Tác giả

**Nguyễn Thành Trung**

📄 License: MIT
