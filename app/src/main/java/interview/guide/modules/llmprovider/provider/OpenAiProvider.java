package interview.guide.modules.llmprovider.provider;

import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.retry.RetryUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OpenAiProvider implements LlmProvider {

    private final OpenAiApi openAiApi;
    private final String model;
    private final Double temperature;
    private OpenAiChatModel chatModel;

    @Autowired(required = false)
    private ObservationRegistry observationRegistry;

    public OpenAiProvider(OpenAiApi openAiApi, String model, Double temperature) {
        this.openAiApi = openAiApi;
        this.model = model;
        this.temperature = temperature;
    }

    @Override
    public String getProviderId() {
        return "openai";
    }

    @Override
    public String getName() {
        return "OpenAI";
    }

    @Override
    public synchronized ChatModel getChatModel() {
        if (chatModel == null) {
            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .model(model)
                    .temperature(temperature != null ? temperature : 0.2)
                    .build();

            chatModel = new OpenAiChatModel(
                    openAiApi,
                    options,
                    ToolCallingManager.builder().build(),
                    RetryUtils.DEFAULT_RETRY_TEMPLATE,
                    observationRegistry != null ? observationRegistry : ObservationRegistry.NOOP
            );
        }
        return chatModel;
    }
}