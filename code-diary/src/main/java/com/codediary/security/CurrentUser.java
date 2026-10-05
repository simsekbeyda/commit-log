package com.codediary.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/** İsteği yapan kullanıcının kimliğini JWT'den okur. */
@Component
public class CurrentUser {

    public Long id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            Object id = jwt.getClaim(JwtService.USER_ID_CLAIM);
            if (id instanceof Number number) {
                return number.longValue();
            }
        }
        throw new IllegalStateException("Kimliği doğrulanmış kullanıcı bulunamadı");
    }
}
