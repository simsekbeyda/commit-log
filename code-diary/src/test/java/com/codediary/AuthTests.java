package com.codediary;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.util.Map;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth-test;DB_CLOSE_DELAY=-1",
        "spring.ai.openai.api-key=not-configured",
        "app.seed-demo-data=false"
})
class AuthTests {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Autowired
    private WebApplicationContext context;

    private MockMvc anonymous;

    @BeforeEach
    void setUp() {
        anonymous = TestAuth.anonymous(context);
    }

    private String credentials(String username, String password) throws Exception {
        return MAPPER.writeValueAsString(Map.of("username", username, "password", password));
    }

    @Test
    void journalsRequireAuthentication() throws Exception {
        anonymous.perform(get("/rest/api/journals")).andExpect(status().isUnauthorized());
        anonymous.perform(get("/rest/api/journals").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
        anonymous.perform(get("/api/ai/status")).andExpect(status().isOk());
    }

    @Test
    void registerThenLogin() throws Exception {
        String username = TestAuth.uniqueUsername();
        TestAuth.register(anonymous, username, "password123");

        String token = MAPPER.readTree(anonymous.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON).content(credentials(username, "password123")))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.user.username").value(username))
                        .andReturn().getResponse().getContentAsString())
                .path("token").asText();

        TestAuth.withToken(context, token).perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.guest").value(false));
    }

    @Test
    void wrongPasswordAndDuplicateUsernameAreRejected() throws Exception {
        String username = TestAuth.uniqueUsername();
        TestAuth.register(anonymous, username, "password123");

        anonymous.perform(post("/api/auth/login").header("Accept-Language", "tr")
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(username, "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Kullanıcı adı veya şifre hatalı"));
        anonymous.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(username.toUpperCase(), "password123")))
                .andExpect(status().isConflict());
        anonymous.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(credentials("a b", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.username").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void usersCannotSeeEachOthersJournals() throws Exception {
        MockMvc alice = TestAuth.newUser(context);
        MockMvc bob = TestAuth.newUser(context);

        String created = alice.perform(post("/rest/api/journals").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"Gizli\", \"content\": \"Bu günlük sadece Alice'e ait olmalı.\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = MAPPER.readTree(created).path("id").asLong();

        bob.perform(get("/rest/api/journals/" + id)).andExpect(status().isNotFound());
        bob.perform(get("/api/ai/summary/" + id)).andExpect(status().isNotFound());
        bob.perform(get("/rest/api/journals/stats")).andExpect(jsonPath("$.total").value(0));
        alice.perform(get("/rest/api/journals/stats")).andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void demoCreatesGuestWithSampleJournals() throws Exception {
        String response = anonymous.perform(post("/api/auth/demo"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.guest").value(true))
                .andExpect(jsonPath("$.user.username", startsWith("guest-")))
                .andReturn().getResponse().getContentAsString();

        TestAuth.withToken(context, MAPPER.readTree(response).path("token").asText())
                .perform(get("/rest/api/journals/stats"))
                .andExpect(jsonPath("$.total").value(10));
    }
}
