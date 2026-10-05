package com.codediary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {

    @NotBlank(message = "{auth.username.notBlank}")
    @Pattern(regexp = "^[A-Za-z0-9_.-]{3,30}$", message = "{auth.username.pattern}")
    private String username;

    @NotBlank(message = "{auth.password.notBlank}")
    @Size(min = 8, max = 100, message = "{auth.password.size}")
    private String password;
}
