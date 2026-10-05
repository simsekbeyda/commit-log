package com.codediary.exception;

import lombok.Getter;

/**
 * Mesajı doğrudan metin yerine messages*.properties anahtarı olarak taşıyan istisna;
 * metin, isteğin diline (Accept-Language) göre GlobalExceptionHandler'da çözülür.
 */
@Getter
public abstract class LocalizedException extends RuntimeException {

    private final String messageKey;
    private final transient Object[] args;

    protected LocalizedException(String messageKey, Throwable cause, Object... args) {
        super(messageKey, cause);
        this.messageKey = messageKey;
        this.args = args;
    }
}
