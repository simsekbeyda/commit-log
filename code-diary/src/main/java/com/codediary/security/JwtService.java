package com.codediary.security;

import com.codediary.model.AppUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {

    static final String USER_ID_CLAIM = "uid";

    private final JwtEncoder jwtEncoder;
    private final Duration ttl;

    public JwtService(JwtEncoder jwtEncoder, @Value("${app.jwt.ttl:7d}") Duration ttl) {
        this.jwtEncoder = jwtEncoder;
        this.ttl = ttl;
    }

    public String issueToken(AppUser user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("commit.log")
                .subject(user.getUsername())
                .claim(USER_ID_CLAIM, user.getId())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
