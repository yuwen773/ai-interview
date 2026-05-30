package interview.guide.modules.llmprovider.service;

import interview.guide.common.ai.LlmProviderRegistry;
import interview.guide.common.config.LlmProviderProperties;
import interview.guide.modules.llmprovider.dto.ProviderDTO;
import interview.guide.modules.llmprovider.model.LlmGlobalSettingEntity;
import interview.guide.modules.llmprovider.model.LlmProviderEntity;
import interview.guide.modules.llmprovider.repository.LlmGlobalSettingRepository;
import interview.guide.modules.llmprovider.repository.LlmProviderRepository;
import interview.guide.modules.voiceinterview.config.VoiceInterviewProperties;
import interview.guide.modules.voiceinterview.service.QwenAsrService;
import interview.guide.modules.voiceinterview.service.QwenTtsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:llm_provider_config;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;INIT=CREATE DOMAIN IF NOT EXISTS JSONB AS JSON",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "app.ai.security.api-key-encryption-key=0123456789abcdef0123456789abcdef"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnableConfigurationProperties(LlmProviderProperties.class)
@Import({
    LlmProviderConfigService.class,
    LlmProviderRegistry.class,
    ApiKeyEncryptionService.class,
    LlmProviderConfigServiceTest.TestLlmProviderConfig.class
})
class LlmProviderConfigServiceTest {

    @Autowired
    private LlmProviderConfigService configService;

    @Autowired
    private LlmProviderRegistry registry;

    @Autowired
    private LlmProviderRepository providerRepository;

    @Autowired
    private LlmGlobalSettingRepository globalSettingRepository;

    @Autowired
    private ApiKeyEncryptionService encryptionService;

    @BeforeEach
    void setUp() {
        globalSettingRepository.deleteAll();
        providerRepository.deleteAll();

        ApiKeyEncryptionService.EncryptedValue encrypted = encryptionService.encrypt("test-api-key");
        providerRepository.save(LlmProviderEntity.builder()
            .id("dashscope")
            .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
            .apiKeyNonce(encrypted.nonce())
            .apiKeyCiphertext(encrypted.ciphertext())
            .model("qwen-plus")
            .embeddingModel("text-embedding-v2")
            .embeddingDimensions(1024)
            .supportsEmbedding(true)
            .temperature(0.2)
            .enabled(true)
            .builtin(true)
            .build());
        globalSettingRepository.save(LlmGlobalSettingEntity.builder()
            .id(LlmGlobalSettingEntity.SINGLETON_ID)
            .defaultChatProviderId("dashscope")
            .defaultEmbeddingProviderId("dashscope")
            .build());
        registry.reload();
    }

    @Test
    void shouldListProviders() {
        List<ProviderDTO> providers = configService.listProviders();
        assertNotNull(providers);
        assertFalse(providers.isEmpty());
    }

    @Test
    void shouldGetDefaultProvider() {
        var defaultProvider = configService.getDefaultProvider();
        assertNotNull(defaultProvider.defaultProvider());
        assertNotNull(defaultProvider.defaultEmbeddingProvider());
    }

    @Test
    void shouldGetProviderWithEncryptedApiKey() {
        ProviderDTO provider = configService.getProvider("dashscope");
        assertNotNull(provider);
        assertEquals("dashscope", provider.id());
        assertEquals("tes***key", provider.maskedApiKey());
    }

    @Test
    void shouldReloadProviders() {
        configService.reloadProviders();
        // Should not throw
    }

    @TestConfiguration
    static class TestLlmProviderConfig {

        @Bean
        VoiceInterviewProperties voiceInterviewProperties() {
            return new VoiceInterviewProperties();
        }

        @Bean
        QwenAsrService qwenAsrService() {
            return mock(QwenAsrService.class);
        }

        @Bean
        QwenTtsService qwenTtsService() {
            return mock(QwenTtsService.class);
        }
    }
}
