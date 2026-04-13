// File: com/soulsound/security/CustomUserDetails.java
package com.soulsound.security;

import com.soulsound.entity.User;
import com.soulsound.entity.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // ── Trả về User entity gốc để dùng ở mọi nơi ──
    public User getUser() {
        return user;
    }

    // ── Các field hay dùng trong Thymeleaf ──
    public Long   getId()       { return user.getId(); }
    public String getFullName() { return user.getFullName(); }
    public String getAvatarUrl(){ return user.getAvatarUrl(); }
    public String getEmail()    { return user.getEmail(); }

    // ── UserDetails interface ──
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getStatus() != UserStatus.BLOCKED;
    }

    @Override public boolean isEnabled()              { return true; }
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
}