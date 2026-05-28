package interview.guide.modules.llmprovider.service;

import interview.guide.modules.llmprovider.dto.ProviderDTO;
import interview.guide.modules.llmprovider.repository.LlmGlobalSettingRepository;
import interview.guide.modules.llmprovider.repository.LlmProviderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class LlmProviderConfigServiceTest {

    @Autowired
    private LlmProviderConfigService configService;

    @Autowired
    private LlmProviderRegistry registry;

    @Autowired
    private LlmProviderRepository providerRepository;

    @Autowired
    private LlmGlobalSettingRepository globalSettingRepository;

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
    void shouldGetChatClient() {
        var client = registry.getDefaultChatClient();
        assertNotNull(client);
    }

    @Test
    void shouldReloadProviders() {
        configService.reloadProviders();
        // Should not throw
    }
}