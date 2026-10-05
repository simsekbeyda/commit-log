package com.codediary.controller;

import com.codediary.dto.AuthRequest;
import com.codediary.dto.AuthResponse;
import com.codediary.dto.UserResponse;
import com.codediary.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "Kayıt, giriş ve demo hesabı")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Yeni hesap oluştur ve token al")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Giriş yap ve token al")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Örnek günlüklerle dolu geçici bir misafir hesabı aç")
    @PostMapping("/demo")
    public ResponseEntity<AuthResponse> demo() {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createGuest());
    }

    @Operation(summary = "Oturumdaki kullanıcı")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(authService.me());
    }
}
