package interview.guide;

import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeChatAutoConfiguration;
import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeEmbeddingAutoConfiguration;
import org.springframework.ai.model.openai.autoconfigure.OpenAiAudioSpeechAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * AI Interview Platform - Main Application
 * 智能AI面试官平台 - 主启动类
 */
@SpringBootApplication(exclude = { OpenAiAudioSpeechAutoConfiguration.class, DashScopeChatAutoConfiguration.class, DashScopeEmbeddingAutoConfiguration.class})
@EnableJpaRepositories(basePackages = "interview.guide.modules.voiceinterview.repository")
@EntityScan(basePackages = "interview.guide.modules.voiceinterview.model")
public class App {

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
