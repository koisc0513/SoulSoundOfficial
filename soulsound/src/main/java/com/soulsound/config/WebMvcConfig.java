package com.soulsound.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Map URL /uploads/**  →  thư mục vật lý {uploadDir}/
     *
     * Ví dụ:
     *   Browser request: GET /uploads/tracks/abc123.mp3
     *   →  Spring serve file từ: {project-root}/uploads/tracks/abc123.mp3
     *
     * Dùng trong Thymeleaf:
     *   <audio src="/uploads/tracks/abc123.mp3" controls></audio>
     *   <img   src="/uploads/avatars/xyz.jpg"   alt="avatar">
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath    = Paths.get(uploadDir).toAbsolutePath();
        String resourceLoc = "file:" + uploadPath + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLoc);
    }
}