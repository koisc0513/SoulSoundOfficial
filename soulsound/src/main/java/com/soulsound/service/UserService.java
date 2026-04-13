package com.soulsound.service;

import com.soulsound.dto.ProfileEditDto;
import com.soulsound.dto.RegisterDto;
import com.soulsound.entity.*;
import com.soulsound.repository.*;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;

@Service
@Transactional
public class UserService {

    private final UserRepository       userRepo;
    private final TrackRepository      trackRepo;
    private final LikeRepository       likeRepo;
    private final PasswordEncoder      passwordEncoder;
    private final FileStorageService   fileStorage;

    public UserService(UserRepository userRepo,
                       TrackRepository trackRepo,
                       LikeRepository likeRepo,
                       PasswordEncoder passwordEncoder,
                       FileStorageService fileStorage) {
        this.userRepo        = userRepo;
        this.trackRepo       = trackRepo;
        this.likeRepo        = likeRepo;
        this.passwordEncoder = passwordEncoder;
        this.fileStorage     = fileStorage;
    }

    // ── Đăng ký ────────────────────────────────────────────────────

    public User register(RegisterDto dto) {
        if (!dto.isPasswordMatching()) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }
        if (userRepo.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng.");
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank()
                && userRepo.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng.");
        }

        User user = new User();
        user.setFullName(dto.getFullName());
        user.setBirthYear(dto.getBirthYear());
        user.setAddress(dto.getAddress());
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.USER);
        user.setStatus(UserStatus.ACTIVE);

        return userRepo.save(user);
    }

    // ── Tìm user ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy user #" + id));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy user: " + email));
    }

    // ── Cập nhật profile ────────────────────────────────────────────

    public User updateProfile(Long userId, ProfileEditDto dto) throws IOException {
        User user = findById(userId);

        user.setFullName(dto.getFullName());
        user.setBirthYear(dto.getBirthYear());
        user.setAddress(dto.getAddress());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setBio(dto.getBio());

        // Upload avatar mới nếu có
        if (dto.getAvatarFile() != null && !dto.getAvatarFile().isEmpty()) {
            // Xóa ảnh cũ
            if (user.getAvatarUrl() != null) {
                fileStorage.deleteFile(user.getAvatarUrl());
            }
            String avatarUrl = fileStorage.saveAvatar(dto.getAvatarFile());
            user.setAvatarUrl(avatarUrl);
        }

        // Đổi mật khẩu nếu có
        if (dto.hasPasswordChange()) {
            if (!dto.isNewPasswordMatching()) {
                throw new IllegalArgumentException("Mật khẩu mới không khớp.");
            }
            if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Mật khẩu hiện tại không đúng.");
            }
            user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        }

        return userRepo.save(user);
    }

    // ── Follow / Unfollow ───────────────────────────────────────────

    /**
     * @return true nếu sau thao tác là đang follow, false nếu đã unfollow
     */
    public boolean toggleFollow(Long followerId, Long targetId) {
        if (followerId.equals(targetId)) {
            throw new IllegalArgumentException("Không thể tự follow chính mình.");
        }
        User follower = findById(followerId);
        User target   = findById(targetId);

        if (follower.getFollowing().contains(target)) {
            follower.getFollowing().remove(target);
            userRepo.save(follower);
            return false;
        } else {
            follower.getFollowing().add(target);
            userRepo.save(follower);
            return true;
        }
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long targetId) {
        User follower = findById(followerId);
        User target   = findById(targetId);
        return follower.getFollowing().contains(target);
    }

    // ── Liked tracks ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Set<Long> getLikedTrackIds(Long userId) {
        Set<Long> ids = new HashSet<>();
        likeRepo.findByUserIdOrderByLikedAtDesc(userId)
                .forEach(like -> ids.add(like.getTrack().getId()));
        return ids;
    }

    // ── Admin: Block / Unblock ──────────────────────────────────────

    public void toggleBlockUser(Long userId) {
        User user = findById(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Không thể khóa tài khoản Admin.");
        }
        if (user.getStatus() == UserStatus.ACTIVE) {
            user.setStatus(UserStatus.BLOCKED);
        } else {
            user.setStatus(UserStatus.ACTIVE);
        }
        userRepo.save(user);
    }

    // ── Tìm kiếm ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<User> searchByName(String name, int page) {
        Pageable pageable = PageRequest.of(page, 10, Sort.by("fullName").ascending());
        return userRepo.findByFullNameContainingIgnoreCase(name, pageable);
    }

    @Transactional(readOnly = true)
    public Page<User> findAll(int page) {
        Pageable pageable = PageRequest.of(page, 20, Sort.by("createdAt").descending());
        return userRepo.findAll(pageable);
    }

    // ── Stats ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countAll()    { return userRepo.count(); }

    @Transactional(readOnly = true)
    public long countActive() { return userRepo.countActiveUsers(); }
}