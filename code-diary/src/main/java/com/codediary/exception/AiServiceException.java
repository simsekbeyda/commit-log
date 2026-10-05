package com.codediary.exception;

public class AiServiceException extends LocalizedException {

    public AiServiceException(String messageKey) {
        super(messageKey, null);
    }

    public AiServiceException(String messageKey, Throwable cause) {
        super(messageKey, cause);
    }
}
