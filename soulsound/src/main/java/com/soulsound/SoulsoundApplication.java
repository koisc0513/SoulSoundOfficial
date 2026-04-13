package com.soulsound;

import com.soulsound.entity.*;
import com.soulsound.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class SoulsoundApplication {

	public static void main(String[] args) {
		SpringApplication.run(SoulsoundApplication.class, args);
	}

	/**
	 * Tạo Admin mặc định nếu chưa tồn tại trong DB.
	 * Chạy mỗi lần khởi động app — an toàn vì có kiểm tra existsByEmail.
	 */
	@Bean
	CommandLineRunner seedAdmin(UserRepository userRepo, PasswordEncoder encoder) {
		return args -> {
			String adminEmail = "admin@soulsound.com";
			if (!userRepo.existsByEmail(adminEmail)) {
				User admin = new User();
				admin.setFullName("SoulSound Admin");
				admin.setEmail(adminEmail);
				admin.setPassword(encoder.encode("Admin@123"));
				admin.setRole(Role.ADMIN);
				admin.setStatus(UserStatus.ACTIVE);
				admin.setBio("Quản trị viên hệ thống SoulSound.");
				userRepo.save(admin);
				System.out.println("✅ Admin account created: " + adminEmail + " / Admin@123");
			}
		};
	}
}