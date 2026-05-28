package interview.guide.modules.llmprovider.provider;

import org.springframework.ai.chat.model.ChatModel;

public interface LlmProvider {
    String getProviderId();
    String getName();
    ChatModel getChatModel();
}