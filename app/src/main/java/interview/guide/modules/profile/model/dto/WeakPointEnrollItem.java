package interview.guide.modules.profile.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 弱项登记条目
 * 用于批量登记弱项到复习计划
 */
public record WeakPointEnrollItem(
    String topic,                      // 知识主题
    String questionText,               // 面试原题
    String answerSummary,              // 回答摘要
    @Min(0) @Max(10) double score,     // 评分（0-10）
    String source,                     // 来源
    Long sessionId                     // 关联面试会话ID
) {}