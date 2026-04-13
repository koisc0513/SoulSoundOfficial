// File: com/soulsound/service/CustomUserDetailsService.java
package com.soulsound.service;

import com.soulsound.entity.User;
import com.soulsound.entity.UserStatus;
import com.soulsound.repository.UserRepository;
import com.soulsound.security.CustomUserDetails;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy: " + email));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new DisabledException("Tài khoản đã bị khóa.");
        }

        System.out.println(">>> LOGIN: " + user.getEmail() + " | " + user.getRole());

        return new CustomUserDetails(user);
    }
}