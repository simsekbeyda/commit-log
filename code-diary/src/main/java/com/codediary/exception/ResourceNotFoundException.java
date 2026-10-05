package com.codediary.exception;

public class ResourceNotFoundException extends LocalizedException {

    public ResourceNotFoundException(String messageKey, Object... args) {
        super(messageKey, null, args);
    }
}
