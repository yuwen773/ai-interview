package interview.guide.modules.llmprovider.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.llmprovider.dto.*;
import interview.guide.modules.llmprovider.model.LlmGlobalSettingEntity;
import interview.guide.modules.llmprovider.model.LlmProviderEntity;
import interview.guide.modules.llmprovider.repository.LlmGlobalSettingRepository;
import interview.guide.modules.llmprovider.repository.LlmProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
@Slf4j
@RequiredArgsConstructor
public class LlmProviderConfigService {

    private final LlmProviderRepository providerRepository;
    private final LlmGlobalSettingRepository globalSettingRepository;
    private final ApiKeyEncryptionService encryptionService;
    private final LlmProviderRegistry registry;

    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

    // ===== Read operations =====

    public List<ProviderDTO> listProviders() {
        rwLock.readLock().lock();
        try {
            LlmGlobalSettingEntity setting = getGlobalSettingOrThrow();
            return providerRepository.findAll().stream()
                .map(p -> toProviderDTO(p, setting))
                .toList();
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public ProviderDTO getProvider(String id) {
        rwLock.readLock().lock();
        try {
            LlmGlobalSettingEntity setting = getGlobalSettingOrThrow();
            LlmProviderEntity provider = getProviderOrThrow(id);
            return toProviderDTO(provider, setting);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public DefaultProviderDTO getDefaultProvider() {
        rwLock.readLock().lock();
        try {
            LlmGlobalSettingEntity setting = getGlobalSettingOrThrow();
            return new DefaultProviderDTO(
                setting.getDefaultChatProviderId(),
                setting.getDefaultEmbeddingProviderId()
            );
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public ProviderTestResult testProvider(String id) {
        rwLock.readLock().lock();
        try {
            LlmProviderEntity provider = getProviderOrThrow(id);
            try {
                String apiKey = encryptionService.decrypt(provider.getApiKeyNonce(), provider.getApiKeyCiphertext());
                // Simple connectivity test via REST call
                var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
                factory.setConnectTimeout(5000);
                factory.setReadTimeout(10000);

                var restClient = org.springframework.web.client.RestClient.builder()
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .requestFactory(factory)
                    .build();

                restClient.post()
                    .uri(provider.getBaseUrl() + "/chat/completions")
                    .body(Map.of(
                        "model", provider.getModel(),
                        "messages", List.of(Map.of("role", "user", "content", "OK")),
                        "max_tokens", 1
                    ))
                    .retrieve()
                    .toEntity(String.class);

                return ProviderTestResult.builder()
                    .success(true)
                    .message("连接成功")
                    .model(provider.getModel())
                    .build();
            } catch (Exception e) {
                return ProviderTestResult.builder()
                    .success(false)
                    .message("连接失败: " + e.getMessage())
                    .model(provider.getModel())
                    .build();
            }
        } finally {
            rwLock.readLock().unlock();
        }
    }

    // ===== Write operations =====

    @Transactional
    public void createProvider(CreateProviderRequest request) {
        rwLock.writeLock().lock();
        try {
            if (providerRepository.existsById(request.id())) {
                throw new BusinessException(ErrorCode.PROVIDER_ALREADY_EXISTS,
                    "Provider '" + request.id() + "' 已存在");
            }

            ApiKeyEncryptionService.EncryptedValue encrypted = encryptionService.encrypt(request.apiKey());

            LlmProviderEntity entity = LlmProviderEntity.builder()
                .id(request.id())
                .baseUrl(request.baseUrl())
                .apiKeyNonce(encrypted.nonce())
                .apiKeyCiphertext(encrypted.ciphertext())
                .model(request.model())
                .embeddingModel(request.embeddingModel())
                .embeddingDimensions(request.embeddingDimensions())
                .supportsEmbedding(request.supportsEmbedding() != null ? request.supportsEmbedding() : false)
                .temperature(request.temperature())
                .enabled(true)
                .builtin(false)
                .build();

            providerRepository.save(entity);
            registry.reload();
            log.info("Created provider: {}", request.id());
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    @Transactional
    public void updateProvider(String id, UpdateProviderRequest request) {
        rwLock.writeLock().lock();
        try {
            LlmProviderEntity provider = getProviderOrThrow(id);

            if (request.baseUrl() != null) provider.setBaseUrl(request.baseUrl());
            if (request.model() != null) provider.setModel(request.model());
            if (request.embeddingModel() != null) provider.setEmbeddingModel(request.embeddingModel());
            if (request.embeddingDimensions() != null) provider.setEmbeddingDimensions(request.embeddingDimensions());
            if (request.supportsEmbedding() != null) provider.setSupportsEmbedding(request.supportsEmbedding());
            if (request.temperature() != null) provider.setTemperature(request.temperature());
            if (request.apiKey() != null) {
                ApiKeyEncryptionService.EncryptedValue encrypted = encryptionService.encrypt(request.apiKey());
                provider.setApiKeyNonce(encrypted.nonce());
                provider.setApiKeyCiphertext(encrypted.ciphertext());
            }

            providerRepository.save(provider);
            registry.reload();
            log.info("Updated provider: {}", id);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    @Transactional
    public void deleteProvider(String id) {
        rwLock.writeLock().lock();
        try {
            LlmGlobalSettingEntity setting = getGlobalSettingOrThrow();
            if (id.equals(setting.getDefaultChatProviderId()) || id.equals(setting.getDefaultEmbeddingProviderId())) {
                throw new BusinessException(ErrorCode.PROVIDER_DEFAULT_CANNOT_DELETE,
                    "默认 Provider '" + id + "' 不可删除");
            }

            providerRepository.deleteById(id);
            registry.reload();
            log.info("Deleted provider: {}", id);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    @Transactional
    public void updateDefaultProvider(DefaultProviderDTO request) {
        rwLock.writeLock().lock();
        try {
            if (request.defaultProvider() == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "defaultProvider 不能为空");
            }
            getProviderOrThrow(request.defaultProvider());
            LlmGlobalSettingEntity setting = getGlobalSettingOrThrow();
            setting.setDefaultChatProviderId(request.defaultProvider());
            globalSettingRepository.save(setting);
            registry.reload();
            log.info("Updated default chat provider: {}", request.defaultProvider());
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    @Transactional
    public void updateDefaultEmbeddingProvider(DefaultProviderDTO request) {
        rwLock.writeLock().lock();
        try {
            if (request.defaultEmbeddingProvider() == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "defaultEmbeddingProvider 不能为空");
            }
            LlmProviderEntity provider = getProviderOrThrow(request.defaultEmbeddingProvider());
            if (!provider.isSupportsEmbedding() || provider.getEmbeddingModel() == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Provider 不支持 Embedding，不能设为默认向量服务");
            }
            LlmGlobalSettingEntity setting = getGlobalSettingOrThrow();
            setting.setDefaultEmbeddingProviderId(request.defaultEmbeddingProvider());
            globalSettingRepository.save(setting);
            registry.reload();
            log.info("Updated default embedding provider: {}", request.defaultEmbeddingProvider());
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public void reloadProviders() {
        registry.reload();
    }

    // ===== Helpers =====

    private LlmGlobalSettingEntity getGlobalSettingOrThrow() {
        return globalSettingRepository.findById(1L)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROVIDER_CONFIG_READ_FAILED, "全局配置未初始化"));
    }

    private LlmProviderEntity getProviderOrThrow(String id) {
        return providerRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROVIDER_NOT_FOUND, "Provider 不存在: " + id));
    }

    private ProviderDTO toProviderDTO(LlmProviderEntity provider, LlmGlobalSettingEntity setting) {
        return ProviderDTO.builder()
            .id(provider.getId())
            .baseUrl(provider.getBaseUrl())
            .maskedApiKey(maskApiKey(decryptApiKey(provider)))
            .model(provider.getModel())
            .embeddingModel(provider.getEmbeddingModel())
            .embeddingDimensions(provider.getEmbeddingDimensions())
            .supportsEmbedding(provider.isSupportsEmbedding())
            .temperature(provider.getTemperature())
            .defaultChatProvider(provider.getId().equals(setting.getDefaultChatProviderId()))
            .defaultEmbeddingProvider(provider.getId().equals(setting.getDefaultEmbeddingProviderId()))
            .build();
    }

    private String decryptApiKey(LlmProviderEntity provider) {
        return encryptionService.decrypt(provider.getApiKeyNonce(), provider.getApiKeyCiphertext());
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() <= 6) return "***";
        return apiKey.substring(0, 3) + "***" + apiKey.substring(apiKey.length() - 3);
    }
}