package interview.guide.modules.llmprovider.service;

import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import interview.guide.modules.llmprovider.config.LlmProviderProperties;
import interview.guide.modules.llmprovider.model.LlmProviderEntity;
import interview.guide.modules.llmprovider.provider.LlmProvider;
import interview.guide.modules.llmprovider.repository.LlmGlobalSettingRepository;
import interview.guide.modules.llmprovider.repository.LlmProviderRepository;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.retry.RetryUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class LlmProviderRegistry {

    private final Map<String, ChatClient> clientCache = new ConcurrentHashMap<>();
    private final LlmProviderProperties properties;
    private final LlmProviderRepository providerRepository;
    private final LlmGlobalSettingRepository globalSettingRepository;
    private final ApiKeyEncryptionService encryptionService;
    private final DashScopeApi dashScopeApi;

    private volatile String defaultChatProviderId = "dashscope";
    private volatile String defaultEmbeddingProviderId = "dashscope";

    @Autowired(required = false)
    private ObservationRegistry observationRegistry;

    public LlmProviderRegistry(
            LlmProviderProperties properties,
            LlmProviderRepository providerRepository,
            LlmGlobalSettingRepository globalSettingRepository,
            ApiKeyEncryptionService encryptionService,
            DashScopeApi dashScopeApi) {
        this.properties = properties;
        this.providerRepository = providerRepository;
        this.globalSettingRepository = globalSettingRepository;
        this.encryptionService = encryptionService;
        this.dashScopeApi = dashScopeApi;
    }

    public ChatClient getChatClient(String providerId) {
        String id = resolveProviderId(providerId);
        return clientCache.computeIfAbsent(id, key -> createChatClient(key));
    }

    public ChatClient getDefaultChatClient() {
        return getChatClient(defaultChatProviderId);
    }

    public ChatClient getChatClientOrDefault(String providerId) {
        if (providerId != null && !providerId.isBlank()) {
            return getChatClient(providerId);
        }
        return getDefaultChatClient();
    }

    public void reload() {
        clientCache.clear();
        loadDefaultsFromDatabase();
        log.info("LlmProviderRegistry reloaded");
    }

    public String getDefaultChatProviderId() {
        return defaultChatProviderId;
    }

    public String getDefaultEmbeddingProviderId() {
        return defaultEmbeddingProviderId;
    }

    private String resolveProviderId(String providerId) {
        return (providerId != null && !providerId.isBlank()) ? providerId : defaultChatProviderId;
    }

    private void loadDefaultsFromDatabase() {
        if (globalSettingRepository != null) {
            globalSettingRepository.findById(1L).ifPresent(setting -> {
                defaultChatProviderId = setting.getDefaultChatProviderId();
                defaultEmbeddingProviderId = setting.getDefaultEmbeddingProviderId();
            });
        }
    }

    private ChatClient createChatClient(String providerId) {
        if ("dashscope".equals(providerId)) {
            return createDashScopeClient();
        }
        // Database-backed provider
        return createClientFromDatabase(providerId);
    }

    private ChatClient createDashScopeClient() {
        LlmProviderProperties.ProviderConfig config = properties.getProviders().get("dashscope");
        String model = config != null && config.getModel() != null ? config.getModel() : "qwen-plus";
        Double temperature = config != null ? config.getTemperature() : 0.2;

        DashScopeChatOptions options = DashScopeChatOptions.builder()
                .model(model)
                .temperature(temperature)
                .build();

        DashScopeChatModel chatModel = new DashScopeChatModel(
                dashScopeApi,
                options,
                ToolCallingManager.builder().build(),
                RetryUtils.DEFAULT_RETRY_TEMPLATE,
                observationRegistry != null ? observationRegistry : ObservationRegistry.NOOP
        );

        return ChatClient.builder(chatModel).build();
    }

    private ChatClient createClientFromDatabase(String providerId) {
        LlmProviderEntity entity = providerRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));

        String apiKey = encryptionService.decrypt(entity.getApiKeyNonce(), entity.getApiKeyCiphertext());

        org.springframework.ai.openai.api.OpenAiApi openAiApi =
                org.springframework.ai.openai.api.OpenAiApi.builder()
                        .baseUrl(entity.getBaseUrl())
                        .apiKey(apiKey)
                        .build();

        org.springframework.ai.openai.OpenAiChatOptions options = org.springframework.ai.openai.OpenAiChatOptions.builder()
                .model(entity.getModel())
                .temperature(entity.getTemperature() != null ? entity.getTemperature() : 0.2)
                .build();

        org.springframework.ai.openai.OpenAiChatModel chatModel = new org.springframework.ai.openai.OpenAiChatModel(
                openAiApi,
                options,
                ToolCallingManager.builder().build(),
                RetryUtils.DEFAULT_RETRY_TEMPLATE,
                observationRegistry != null ? observationRegistry : ObservationRegistry.NOOP
        );

        return ChatClient.builder(chatModel).build();
    }
}