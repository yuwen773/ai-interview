package interview.guide;

import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeChatAutoConfiguration;
import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeEmbeddingAutoConfiguration;
import org.springframework.ai.model.openai.autoconfigure.OpenAiAudioSpeechAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AI Interview Platform - Main Application
 * 智能AI面试官平台 - 主启动类
 */
@SpringBootApplication(exclude = { OpenAiAudioSpeechAutoConfiguration.class, DashScopeChatAutoConfiguration.class, DashScopeEmbeddingAutoConfiguration.class})
public class App {

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
