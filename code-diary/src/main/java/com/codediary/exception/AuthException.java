package com.codediary.exception;

/** Hatalı kullanıcı adı/şifre gibi 401 durumları. */
public class AuthException extends LocalizedException {

    public AuthException(String messageKey) {
        super(messageKey, null);
    }
}
