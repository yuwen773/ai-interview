package interview.guide.modules.llmprovider.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "app.llm")
public class LlmProviderProperties {
    private String defaultProvider = "dashscope";
    private String defaultEmbeddingProvider;
    private Integer embeddingDimensions = 1024;
    private Map<String, ProviderConfig> providers = new HashMap<>();

    @Data
    public static class ProviderConfig {
        private String baseUrl;
        private String apiKey;
        private String model;
        private String embeddingModel;
        private Integer embeddingDimensions;
        private Boolean supportsEmbedding;
        private Double temperature;
    }
}