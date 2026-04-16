package interview.guide.modules.profile.model.dto;

import java.util.List;

/**
 * 画像更新结果
 * LLM决策的画像更新操作列表，包含弱项操作、强项操作和改善标记
 */
public record ProfileUpdateResult(
    List<WeakPointOp> weakPointOps,      // 弱项操作列表
    List<StrongPointOp> strongPointOps,  // 强项操作列表
    List<ImprovementOp> improvements     // 改善标记列表
) {
    /** 弱项操作（ADD新增 / UPDATE更新） */
    public record WeakPointOp(
        String action,           // 操作类型：ADD / UPDATE
        String point,            // 弱项描述
        String topic,            // 知识主题
        String answerSummary,    // 回答摘要
        Double score,            // 评分
        Integer index,           // 匹配到的已有弱项索引（UPDATE时使用）
        String newPoint,         // 更新后的弱项描述
        String newAnswerSummary, // 更新后的回答摘要
        String reason            // 操作原因
    ) {}

    /** 强项操作（ADD新增） */
    public record StrongPointOp(
        String action,      // 操作类型：ADD
        String point,       // 强项描述
        String topic,       // 知识主题
        String reason       // 操作原因
    ) {}

    /** 改善标记（将弱项标记为已改善） */
    public record ImprovementOp(
        int weakIndex,      // 对应弱项在weakPoints列表中的索引
        String reason       // 改善原因
    ) {}
}
