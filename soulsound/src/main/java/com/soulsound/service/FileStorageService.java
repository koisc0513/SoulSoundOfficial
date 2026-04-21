package com.soulsound.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final String TRACK_DIR     = "tracks";
    private static final String AVATAR_DIR    = "avatars";
    private static final String THUMBNAIL_DIR = "thumbnails";
    private static final String BANNER_DIR    = "banners";

    private static final long MAX_AUDIO_SIZE = 50 * 1024 * 1024L;
    private static final long MAX_IMAGE_SIZE =  5 * 1024 * 1024L;

    // Root path tuyệt đối — resolve 1 lần duy nhất khi khởi động
    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation.resolve(TRACK_DIR));
            Files.createDirectories(rootLocation.resolve(AVATAR_DIR));
            Files.createDirectories(rootLocation.resolve(THUMBNAIL_DIR));
            Files.createDirectories(rootLocation.resolve(BANNER_DIR));
            System.out.println(">>> Upload root: " + rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục upload: " + uploadDir, e);
        }
    }

    // ── Public API ──────────────────────────────────────────────────

    public String saveTrack(MultipartFile file) throws IOException {
        validateAudio(file);
        return saveFile(file, TRACK_DIR);
    }

    public String saveAvatar(MultipartFile file) throws IOException {
        validateImage(file);
        return saveFile(file, AVATAR_DIR);
    }

    public String saveBanner(MultipartFile file) throws IOException {
        validateImage(file);
        return saveFile(file, BANNER_DIR);
    }

    public String saveThumbnail(MultipartFile file) throws IOException {
        validateImage(file);
        return saveFile(file, THUMBNAIL_DIR);
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        try {
            // "/uploads/tracks/abc.mp3" → bỏ "/uploads/" → "tracks/abc.mp3"
            String relative = fileUrl.replaceFirst("^/uploads/", "");
            Path target = rootLocation.resolve(relative).normalize();
            Files.deleteIfExists(target);
        } catch (IOException e) {
            System.err.println("[FileStorage] Không xóa được: " + fileUrl + " — " + e.getMessage());
        }
    }

    // ── Private helpers ─────────────────────────────────────────────

    private String saveFile(MultipartFile file, String subDir) throws IOException {
        String original   = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension  = getExtension(StringUtils.cleanPath(original));
        String uniqueName = UUID.randomUUID().toString().replace("-", "") + extension;

        Path targetFile = rootLocation.resolve(subDir).resolve(uniqueName);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, targetFile, StandardCopyOption.REPLACE_EXISTING);
        }

        System.out.println(">>> Saved: " + targetFile);

        // Luôn trả về /uploads/subDir/filename — cố định, không phụ thuộc uploadDir
        return "/uploads/" + subDir + "/" + uniqueName;
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
    }

    private void validateAudio(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Vui lòng chọn file nhạc.");
        if (file.getSize() > MAX_AUDIO_SIZE)
            throw new IllegalArgumentException("File nhạc không được vượt quá 50MB.");

        String name        = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String contentType = file.getContentType() != null ? file.getContentType() : "";

        // Chấp nhận cả audio/* lẫn application/octet-stream (Windows hay gửi vậy)
        boolean validExt  = name.toLowerCase().endsWith(".mp3");
        boolean validType = contentType.startsWith("audio") || contentType.equals("application/octet-stream");

        if (!validExt && !validType)
            throw new IllegalArgumentException("Chỉ chấp nhận file .mp3.");
    }

    private void validateImage(MultipartFile file) {
        // Thumbnail KHÔNG bắt buộc — bỏ qua nếu không có
        if (file == null || file.isEmpty()) return;

        if (file.getSize() > MAX_IMAGE_SIZE)
            throw new IllegalArgumentException("Ảnh không được vượt quá 5MB.");

        String contentType = file.getContentType() != null ? file.getContentType() : "";
        if (!contentType.startsWith("image/"))
            throw new IllegalArgumentException("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP).");
    }
}