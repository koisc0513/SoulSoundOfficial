# ── Stage 1: Build ────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app

# Copy Maven wrapper + pom trước để cache dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source và build
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy JAR từ builder stage
COPY --from=builder /app/target/*.jar app.jar

# Thư mục lưu file upload (sẽ mount volume ra ngoài)
RUN mkdir -p /app/uploads

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]