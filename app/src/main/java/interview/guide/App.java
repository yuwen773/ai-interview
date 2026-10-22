package interview.guide;

import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeChatAutoConfiguration;
import com.alibaba.cloud.ai.autoconfigure.dashscope.DashScopeEmbeddingAutoConfiguration;
import org.springframework.ai.model.openai.autoconfigure.OpenAiAudioSpeechAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AI Interview Platform - Main Application
 * 智能AI面试官平台 - 主启动类
 *
 * 注意：不要在这里收窄 @EntityScan / @EnableJpaRepositories。一旦显式指定
 * basePackages，Spring 就不再走默认的「主类所在包及以下」扫描，resume /
 * knowledgebase / profile / interview 各模块的 Repository 会集体消失。
 */
@SpringBootApplication(exclude = { OpenAiAudioSpeechAutoConfiguration.class, DashScopeChatAutoConfiguration.class, DashScopeEmbeddingAutoConfiguration.class})
public class App {

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
