package interview.guide.modules.voiceinterview.service;

import org.springframework.stereotype.Service;

@Service
public class VoiceInterviewPromptService {
    public String generateSystemPromptWithContext(String skillId, String resumeText) {
        return "你是一个专业的AI面试官。";
    }
}
