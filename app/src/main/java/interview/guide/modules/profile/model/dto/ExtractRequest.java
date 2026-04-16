package interview.guide.modules.profile.model.dto;

/**
 * 画像提取请求
 * 指定要从哪个面试会话中提取弱项和强项
 */
public record ExtractRequest(
    Long sessionId     // 面试会话ID
) {}
