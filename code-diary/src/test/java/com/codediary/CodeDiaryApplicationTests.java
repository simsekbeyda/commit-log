package com.codediary;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.ai.openai.api-key=not-configured",
        "app.seed-demo-data=false"
})
class CodeDiaryApplicationTests {

    private static final String JOURNALS = "/rest/api/journals";

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void signIn() throws Exception {
        mockMvc = TestAuth.newUser(context);
    }

    private long createJournal(String title, String content) throws Exception {
        String body = """
                {"title": "%s", "content": "%s"}
                """.formatted(title, content);
        String location = mockMvc.perform(post(JOURNALS).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value(title))
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(location.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }

    @Test
    void createAndFetchJournal() throws Exception {
        long id = createJournal("Test günlüğü", "Bu içerik yirmi karakterden kesinlikle daha uzundur.");

        mockMvc.perform(get(JOURNALS + "/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void longContentIsAccepted() throws Exception {
        createJournal("Uzun içerik", "a".repeat(2000));
    }

    @Test
    void invalidRequestReturnsFieldErrors() throws Exception {
        mockMvc.perform(post(JOURNALS).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"\", \"content\": \"kısa\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists())
                .andExpect(jsonPath("$.errors.content").exists());
    }

    @Test
    void missingJournalReturns404() throws Exception {
        mockMvc.perform(get(JOURNALS + "/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void errorMessagesFollowAcceptLanguage() throws Exception {
        mockMvc.perform(get(JOURNALS + "/424242").header("Accept-Language", "tr-TR"))
                .andExpect(jsonPath("$.message").value("Günlük bulunamadı: 424242"));
        mockMvc.perform(get(JOURNALS + "/424242").header("Accept-Language", "en"))
                .andExpect(jsonPath("$.message").value("Journal not found: 424242"));
        mockMvc.perform(post(JOURNALS).contentType(MediaType.APPLICATION_JSON)
                        .header("Accept-Language", "en")
                        .content("{\"title\": \"\", \"content\": \"short content but long enough\"}"))
                .andExpect(jsonPath("$.errors.title").value("Title cannot be empty"));
    }

    @Test
    void deletedJournalIsHidden() throws Exception {
        long id = createJournal("Silinecek", "Bu günlük birazdan silinecek, içerik yeterince uzun.");

        mockMvc.perform(delete(JOURNALS + "/" + id)).andExpect(status().isNoContent());
        mockMvc.perform(get(JOURNALS + "/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void searchFiltersByTitleAndContent() throws Exception {
        createJournal("Kubernetes notları", "Pod, deployment ve service kavramlarını çalıştım bugün.");

        mockMvc.perform(get(JOURNALS).param("q", "kubernetes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", hasItem("Kubernetes notları")));
    }

    @Test
    void aiEndpointsUseDemoModeWithoutApiKey() throws Exception {
        long id = createJournal("AI testi",
                "Bugün Spring ve React ile çalıştım. Bir hata yüzünden takıldım ama sonunda çözdüm ve öğrendim.");

        mockMvc.perform(get("/api/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configured").value(false))
                .andExpect(jsonPath("$.mode").value("demo"));
        mockMvc.perform(get("/api/ai/summary/" + id).header("Accept-Language", "tr"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Spring ve React")));
        mockMvc.perform(get("/api/ai/sentiment/" + id))
                .andExpect(status().isOk())
                .andExpect(content().string("positive"));
        mockMvc.perform(get("/api/ai/keywords/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem("spring")))
                .andExpect(jsonPath("$", hasItem("react")));
        mockMvc.perform(get("/api/ai/suggestion/" + id))
                .andExpect(status().isOk())
                .andExpect(content().string(startsWith("1. ")));
        mockMvc.perform(post("/api/ai/ask/" + id).contentType(MediaType.APPLICATION_JSON)
                        .header("Accept-Language", "tr")
                        .content("{\"question\": \"Hangi hata vardı?\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("takıldım")));
    }
}
