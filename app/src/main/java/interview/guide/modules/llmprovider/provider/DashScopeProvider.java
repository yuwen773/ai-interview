package interview.guide.modules.llmprovider.provider;

import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.retry.RetryUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DashScopeProvider implements LlmProvider {

    private final DashScopeApi dashScopeApi;
    private final String model;
    private final Double temperature;
    private DashScopeChatModel chatModel;

    @Autowired(required = false)
    private ObservationRegistry observationRegistry;

    public DashScopeProvider(DashScopeApi dashScopeApi, String model, Double temperature) {
        this.dashScopeApi = dashScopeApi;
        this.model = model;
        this.temperature = temperature;
    }

    @Override
    public String getProviderId() {
        return "dashscope";
    }

    @Override
    public String getName() {
        return "阿里云 DashScope";
    }

    @Override
    public synchronized ChatModel getChatModel() {
        if (chatModel == null) {
            DashScopeChatOptions options = DashScopeChatOptions.builder()
                    .model(model)
                    .temperature(temperature != null ? temperature : 0.2)
                    .build();

            chatModel = new DashScopeChatModel(
                    dashScopeApi,
                    options,
                    ToolCallingManager.builder().build(),
                    RetryUtils.DEFAULT_RETRY_TEMPLATE,
                    observationRegistry != null ? observationRegistry : ObservationRegistry.NOOP
            );
        }
        return chatModel;
    }
}