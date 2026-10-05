package com.codediary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class JournalCreateRequest {

    @NotBlank(message = "{journal.title.notBlank}")
    @Size(max = 100, message = "{journal.title.size}")
    private String title;

    @NotBlank(message = "{journal.content.notBlank}")
    @Size(min = 20, max = 10000, message = "{journal.content.size}")
    private String content;

    /** İsteğe bağlı; servis katmanında normalize edilir (küçük harf, baştaki # atılır, boşluk → -). */
    @Size(max = 10, message = "{journal.tags.size}")
    private List<String> tags = new ArrayList<>();
}
