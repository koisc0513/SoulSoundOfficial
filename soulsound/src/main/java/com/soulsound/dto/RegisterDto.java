package com.soulsound.dto;

import jakarta.validation.constraints.*;

public class RegisterDto {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2-100 ký tự")
    private String fullName;

    @NotNull(message = "Năm sinh không được để trống")
    @Min(value = 1900, message = "Năm sinh không hợp lệ")
    @Max(value = 2015, message = "Năm sinh không hợp lệ")
    private Integer birthYear;

    @Size(max = 255)
    private String address;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phoneNumber;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự")
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;

    // Getters & Setters
    public String getFullName()                    { return fullName; }
    public void   setFullName(String fullName)     { this.fullName = fullName; }
    public Integer getBirthYear()                  { return birthYear; }
    public void    setBirthYear(Integer birthYear) { this.birthYear = birthYear; }
    public String  getAddress()                    { return address; }
    public void    setAddress(String address)      { this.address = address; }
    public String  getEmail()                      { return email; }
    public void    setEmail(String email)          { this.email = email; }
    public String  getPhoneNumber()                { return phoneNumber; }
    public void    setPhoneNumber(String p)        { this.phoneNumber = p; }
    public String  getPassword()                   { return password; }
    public void    setPassword(String password)    { this.password = password; }
    public String  getConfirmPassword()            { return confirmPassword; }
    public void    setConfirmPassword(String c)    { this.confirmPassword = c; }

    public boolean isPasswordMatching() {
        return password != null && password.equals(confirmPassword);
    }
}