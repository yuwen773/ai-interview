package interview.guide.modules.profile.model.dto;

/**
 * 评估匹配记录（用于自动 SR 更新反馈循环）。
 */
public record EvaluationMatch(
    String question,
    String topic,
    double score
) {}
