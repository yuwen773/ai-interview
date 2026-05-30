package interview.guide;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * AI Interview Platform - Main Application
 * 智能AI面试官平台 - 主启动类
 */
@SpringBootApplication
@EnableJpaRepositories(basePackages = {
    "interview.guide.modules.voiceinterview.repository",
    "interview.guide.modules.llmprovider.repository",
    "interview.guide.modules.resume.repository",
    "interview.guide.modules.interview.repository",
    "interview.guide.modules.knowledgebase.repository",
    "interview.guide.modules.profile.repository",
    "interview.guide.modules.schedule.repository"
})
public class App {

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}