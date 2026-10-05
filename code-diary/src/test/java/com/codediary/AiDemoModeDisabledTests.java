package com.codediary;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb-nodemo;DB_CLOSE_DELAY=-1",
        "spring.ai.openai.api-key=not-configured",
        "app.ai.demo-mode=false",
        "app.seed-demo-data=false"
})
class AiDemoModeDisabledTests {

    @Autowired
    private WebApplicationContext context;

    @Test
    void aiEndpointsReturn503WithoutApiKey() throws Exception {
        MockMvc mockMvc = TestAuth.newUser(context);
        String location = mockMvc.perform(post("/rest/api/journals").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"AI\", \"content\": \"Bu günlük AI uç noktasını test etmek için yazıldı.\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = Long.parseLong(location.replaceAll(".*\"id\":(\\d+).*", "$1"));

        mockMvc.perform(get("/api/ai/status"))
                .andExpect(jsonPath("$.mode").value("off"));
        mockMvc.perform(get("/api/ai/summary/" + id))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").exists());
    }
}
