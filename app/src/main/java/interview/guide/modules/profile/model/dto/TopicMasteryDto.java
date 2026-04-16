package interview.guide.modules.profile.model.dto;

/**
 * 知识点掌握度DTO
 */
public record TopicMasteryDto(
    String topic,       // 知识主题
    double score,       // 掌握度评分（0-100）
    int sessionCount    // 参与评估的会话数
) {}