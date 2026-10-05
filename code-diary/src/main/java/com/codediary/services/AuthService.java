package com.codediary.services;

import com.codediary.dto.AuthRequest;
import com.codediary.dto.AuthResponse;
import com.codediary.dto.UserResponse;
import com.codediary.exception.AuthException;
import com.codediary.exception.ConflictException;
import com.codediary.model.AppUser;
import com.codediary.repository.UserRepository;
import com.codediary.security.CurrentUser;
import com.codediary.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SampleDataService sampleDataService;
    private final CurrentUser currentUser;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       SampleDataService sampleDataService, CurrentUser currentUser) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.sampleDataService = sampleDataService;
        this.currentUser = currentUser;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("auth.usernameTaken", username);
        }
        AppUser user = createUser(username, request.getPassword(), false);
        return respond(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        AppUser user = userRepository.findByUsernameIgnoreCase(request.getUsername().trim())
                .filter(found -> passwordEncoder.matches(request.getPassword(), found.getPasswordHash()))
                // Kullanıcı adı mı şifre mi yanlış, ayırt edilmez
                .orElseThrow(() -> new AuthException("auth.invalidCredentials"));
        return respond(user);
    }

    /** Her ziyaretçiye örnek günlükleri hazır, kendine ait geçici bir hesap açar. */
    @Transactional
    public AuthResponse createGuest() {
        String username;
        do {
            username = "guest-" + HexFormat.of().formatHex(randomBytes(3));
        } while (userRepository.existsByUsernameIgnoreCase(username));
        AppUser guest = createUser(username, HexFormat.of().formatHex(randomBytes(16)), true);
        sampleDataService.createSampleJournals(guest);
        return respond(guest);
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return userRepository.findById(currentUser.id())
                .map(UserResponse::from)
                .orElseThrow(() -> new AuthException("auth.invalidCredentials"));
    }

    @Transactional
    public AppUser createUser(String username, String rawPassword, boolean guest) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setGuest(guest);
        return userRepository.save(user);
    }

    private AuthResponse respond(AppUser user) {
        return new AuthResponse(jwtService.issueToken(user), UserResponse.from(user));
    }

    private static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        RANDOM.nextBytes(bytes);
        return bytes;
    }
}
