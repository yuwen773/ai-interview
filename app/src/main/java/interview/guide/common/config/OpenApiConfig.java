package interview.guide.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI 配置
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI interviewGuideOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("AI Interview Platform API")
                .description("AI 面试平台后端接口文档")
                .version("v1")
                .contact(new Contact()
                    .name("AI Interview")
                    .url("https://localhost"))
                .license(new License()
                    .name("Internal Use")));
    }
}
