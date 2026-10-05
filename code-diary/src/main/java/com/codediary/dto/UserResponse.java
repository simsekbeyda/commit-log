package com.codediary.dto;

import com.codediary.model.AppUser;

public record UserResponse(Long id, String username, boolean guest) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getUsername(), user.isGuest());
    }
}
