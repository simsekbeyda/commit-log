package com.codediary;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Testler için kullanıcı açıp token'ı her isteğe otomatik ekleyen MockMvc üretir. */
final class TestAuth {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final AtomicInteger COUNTER = new AtomicInteger();

    private TestAuth() {
    }

    static MockMvc anonymous(WebApplicationContext context) {
        return MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    static String uniqueUsername() {
        return "user" + System.nanoTime() % 100_000_000 + "_" + COUNTER.incrementAndGet();
    }

    static String register(MockMvc anonymous, String username, String password) throws Exception {
        String body = MAPPER.writeValueAsString(java.util.Map.of("username", username, "password", password));
        String response = anonymous.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return MAPPER.readTree(response).path("token").asText();
    }

    static MockMvc withToken(WebApplicationContext context, String token) {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .defaultRequest(get("/").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .build();
    }

    /** Yeni bir kullanıcı adına istek atan MockMvc. */
    static MockMvc newUser(WebApplicationContext context) throws Exception {
        return withToken(context, register(anonymous(context), uniqueUsername(), "password123"));
    }
}
