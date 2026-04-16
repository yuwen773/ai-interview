package interview.guide.modules.profile.model.dto;

import java.time.LocalDate;

/**
 * 弱项DTO
 * 包含弱项详情及其SM-2间隔重复状态
 */
public record WeakPointDto(
    Long id,                // 弱项ID
    String topic,           // 知识主题
    String questionText,    // 面试原题
    String answerSummary,   // 回答摘要
    Double score,           // 评分（0-10）
    String source,          // 来源
    Long sessionId,         // 关联面试会话ID
    LocalDate nextReview,   // 下次复习日期
    double easeFactor,      // 难度因子
    int repetitions,        // 连续成功次数
    int timesSeen,          // 被观察到的次数
    boolean isImproved      // 是否已改善
) {}