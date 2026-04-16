package interview.guide.modules.profile.model.dto;

/**
 * 强项DTO
 */
public record StrongPointDto(
    Long id,              // 强项ID
    String topic,         // 知识主题
    String description,   // 强项描述
    String source,        // 来源
    Long sessionId,       // 关联面试会话ID
    String firstSeen      // 首次发现时间
) {}
