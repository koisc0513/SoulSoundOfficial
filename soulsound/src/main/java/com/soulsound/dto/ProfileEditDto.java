package com.soulsound.dto;

import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;

public class ProfileEditDto {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100)
    private String fullName;

    @Min(1900) @Max(2015)
    private Integer birthYear;

    @Size(max = 255)
    private String address;

    @Size(max = 20)
    private String phoneNumber;

    private String bio;

    private MultipartFile avatarFile;

    // Đổi mật khẩu (optional)
    private String currentPassword;
    private String newPassword;
    private String confirmNewPassword;

    // Getters & Setters
    public String getFullName()                      { return fullName; }
    public void   setFullName(String v)              { this.fullName = v; }
    public Integer getBirthYear()                    { return birthYear; }
    public void    setBirthYear(Integer v)           { this.birthYear = v; }
    public String  getAddress()                      { return address; }
    public void    setAddress(String v)              { this.address = v; }
    public String  getPhoneNumber()                  { return phoneNumber; }
    public void    setPhoneNumber(String v)          { this.phoneNumber = v; }
    public String  getBio()                          { return bio; }
    public void    setBio(String v)                  { this.bio = v; }
    public MultipartFile getAvatarFile()             { return avatarFile; }
    public void          setAvatarFile(MultipartFile f) { this.avatarFile = f; }
    public String  getCurrentPassword()              { return currentPassword; }
    public void    setCurrentPassword(String v)      { this.currentPassword = v; }
    public String  getNewPassword()                  { return newPassword; }
    public void    setNewPassword(String v)          { this.newPassword = v; }
    public String  getConfirmNewPassword()           { return confirmNewPassword; }
    public void    setConfirmNewPassword(String v)   { this.confirmNewPassword = v; }

    public boolean hasPasswordChange() {
        return newPassword != null && !newPassword.isBlank();
    }

    public boolean isNewPasswordMatching() {
        return newPassword != null && newPassword.equals(confirmNewPassword);
    }
}