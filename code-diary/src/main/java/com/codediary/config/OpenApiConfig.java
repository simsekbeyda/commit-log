package com.codediary.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI codeDiaryOpenApi() {
        return new OpenAPI().info(new Info()
                .title("commit.log API")
                .description("Yazılımcılar için AI destekli günlük uygulamasının REST API'si")
                .version("1.0.0"));
    }
}
