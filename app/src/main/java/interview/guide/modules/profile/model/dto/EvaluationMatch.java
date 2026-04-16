package interview.guide.modules.profile.model.dto;

/**
 * 评估匹配记录
 * 用于面试评估后自动更新弱项SR状态的反馈循环
 */
public record EvaluationMatch(
    String question,   // 面试题目
    String topic,      // 知识主题
    double score       // 评估评分
) {}
