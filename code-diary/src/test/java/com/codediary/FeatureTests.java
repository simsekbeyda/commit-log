package com.codediary;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Etiketler, aktivite ısı haritası ve haftalık rapor (demo modunda). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:feature-test;DB_CLOSE_DELAY=-1",
        "spring.ai.openai.api-key=not-configured",
        "app.seed-demo-data=false"
})
class FeatureTests {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void signIn() throws Exception {
        mockMvc = TestAuth.newUser(context);
    }

    private long create(String title, String content, List<String> tags) throws Exception {
        String body = MAPPER.writeValueAsString(Map.of("title", title, "content", content, "tags", tags));
        String response = mockMvc.perform(post("/rest/api/journals").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return MAPPER.readTree(response).path("id").asLong();
    }

    @Test
    void tagsAreNormalizedAndFilterable() throws Exception {
        long id = create("Spring notları", "Spring Boot ile bugün çok şey öğrendim, harika bir gündü.",
                List.of("#Spring", " Spring Boot ", "spring", "", "JPA"));
        create("React notları", "React ile bugün bileşen yazdım, hook kavramını çalıştım.", List.of("react"));

        mockMvc.perform(get("/rest/api/journals/" + id))
                .andExpect(jsonPath("$.tags", contains("jpa", "spring", "spring-boot")));
        mockMvc.perform(get("/rest/api/journals").param("tag", "#SPRING"))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Spring notları"));
        mockMvc.perform(get("/rest/api/journals").param("tag", "react").param("q", "spring"))
                .andExpect(jsonPath("$.content", hasSize(0)));
        mockMvc.perform(get("/rest/api/journals/tags"))
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].count").value(1));
    }

    @Test
    void updatingReplacesTags() throws Exception {
        long id = create("Etiket", "Etiketleri güncellemeyi test eden bir günlük içeriği.", List.of("a", "b"));
        String body = MAPPER.writeValueAsString(Map.of("title", "Etiket", "content",
                "Etiketleri güncellemeyi test eden bir günlük içeriği.", "tags", List.of("c")));

        mockMvc.perform(put("/rest/api/journals/" + id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags", contains("c")));
    }

    @Test
    void tooManyTagsAreRejected() throws Exception {
        String body = MAPPER.writeValueAsString(Map.of("title", "Çok etiket", "content",
                "Bu günlükte izin verilenden fazla etiket var.", "tags",
                List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11")));
        mockMvc.perform(post("/rest/api/journals").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.tags").exists());
    }

    @Test
    void activityCountsTodaysEntries() throws Exception {
        create("Bir", "Bugünün ilk günlüğü, aktivite testi için yazıldı.", List.of());
        create("İki", "Bugünün ikinci günlüğü, aktivite testi için yazıldı.", List.of());

        mockMvc.perform(get("/rest/api/journals/activity").param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.to").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.days", hasSize(1)))
                .andExpect(jsonPath("$.days[0].count").value(2))
                .andExpect(jsonPath("$.currentStreak").value(1))
                .andExpect(jsonPath("$.longestStreak").value(1));
    }

    @Test
    void weeklyReportInDemoMode() throws Exception {
        mockMvc.perform(get("/api/ai/weekly"))
                .andExpect(jsonPath("$.entryCount").value(0))
                .andExpect(jsonPath("$.report").doesNotExist());

        create("Spring", "Spring Boot ile bugün REST API yazdım ve sonunda çözdüm, öğrendim.", List.of());
        mockMvc.perform(get("/api/ai/weekly").header("Accept-Language", "tr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entryCount").value(1))
                .andExpect(jsonPath("$.report", containsString("### Haftanın özeti")))
                .andExpect(jsonPath("$.report", containsString("Pozitif: 1")));
    }

    @Test
    void guestAccountHasStreakAndTags() throws Exception {
        String response = TestAuth.anonymous(context).perform(post("/api/auth/demo"))
                .andReturn().getResponse().getContentAsString();
        MockMvc guest = TestAuth.withToken(context, MAPPER.readTree(response).path("token").asText());

        guest.perform(get("/rest/api/journals/activity"))
                .andExpect(jsonPath("$.currentStreak").value(5))
                .andExpect(jsonPath("$.activeDays").value(10));
        guest.perform(get("/rest/api/journals/tags"))
                .andExpect(jsonPath("$[0].tag").value("spring"))
                .andExpect(jsonPath("$[0].count", greaterThanOrEqualTo(4)));
    }
}
