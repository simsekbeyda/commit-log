package com.codediary.exception;

/** Kullanıcı adı zaten alınmış gibi 409 durumları. */
public class ConflictException extends LocalizedException {

    public ConflictException(String messageKey, Object... args) {
        super(messageKey, null, args);
    }
}
