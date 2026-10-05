package com.codediary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiQuestionRequest {

    @NotBlank(message = "{ai.question.notBlank}")
    @Size(max = 500, message = "{ai.question.size}")
    private String question;
}
