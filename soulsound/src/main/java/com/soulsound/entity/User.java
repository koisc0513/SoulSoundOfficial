package com.soulsound.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Size(max = 255)
    private String address;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false, length = 150)
    private String email;                        // dùng làm username đăng nhập

    @Size(max = 20)
    @Column(name = "phone_number")
    private String phoneNumber;

    @NotBlank
    @Column(nullable = false)
    private String password;                     // đã BCrypt hash

    @Column(name = "avatar_url")
    private String avatarUrl;                    // đường dẫn local, ví dụ: /uploads/avatars/xxx.jpg

    @Column(name = "banner_url")
    private String bannerUrl;                    // ảnh banner trang profile

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────

    /** Bài hát đã upload */
    @OneToMany(mappedBy = "uploader", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Track> tracks = new ArrayList<>();

    /** Playlist đã tạo */
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Playlist> playlists = new ArrayList<>();

    /** Comment đã đăng */
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    /** Bài hát đã like */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Like> likes = new ArrayList<>();

    /** Lịch sử nghe */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ListeningHistory> listeningHistories = new ArrayList<>();

    /**
     * Follow: người dùng này đang theo dõi ai (following set)
     * JOIN TABLE: user_follows(follower_id, following_id)
     */
    @ManyToMany
    @JoinTable(
            name = "user_follows",
            joinColumns        = @JoinColumn(name = "follower_id"),
            inverseJoinColumns = @JoinColumn(name = "following_id")
    )
    private Set<User> following = new HashSet<>();

    /** Ai đang follow người dùng này (followers set) — mappedBy phía kia */
    @ManyToMany(mappedBy = "following")
    private Set<User> followers = new HashSet<>();


    // ── Constructors ───────────────────────────────────────
    public User() {}

    // ── Getters / Setters ──────────────────────────────────

    public Long getId() { return id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Integer getBirthYear() { return birthYear; }
    public void setBirthYear(Integer birthYear) { this.birthYear = birthYear; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<Track> getTracks() { return tracks; }
    public List<Playlist> getPlaylists() { return playlists; }
    public List<Comment> getComments() { return comments; }
    public List<Like> getLikes() { return likes; }
    public List<ListeningHistory> getListeningHistories() { return listeningHistories; }
    public Set<User> getFollowing() { return following; }
    public Set<User> getFollowers() { return followers; }

    // ── Helper methods ─────────────────────────────────────

    public boolean isActive() {
        return this.status == UserStatus.ACTIVE;
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }

    /** Số lượng followers */
    public int getFollowerCount() {
        return followers.size();
    }

    /** Số lượng following */
    public int getFollowingCount() {
        return following.size();
    }
}