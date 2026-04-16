package interview.guide.modules.profile.model.dto;

import java.util.List;

/**
 * 画像提取结果
 * LLM从面试会话中提取的弱项和强项洞察
 */
public record ProfileExtractResult(
    List<WeakPointInsight> weakPoints,   // 提取的弱项列表
    List<StrengthInsight> strengths      // 提取的强项列表
) {
    /** 弱项洞察 */
    public record WeakPointInsight(
        String topic,          // 知识主题
        String question,       // 面试题目
        String answerSummary,  // 回答摘要
        double score           // 评分
    ) {}

    /** 强项洞察 */
    public record StrengthInsight(
        String topic,         // 知识主题
        String description    // 强项描述
    ) {}
}
