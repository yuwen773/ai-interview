package interview.guide.modules.profile.model.dto;

import java.util.List;

public record ProfileUpdateResult(
    List<WeakPointOp> weakPointOps,
    List<StrongPointOp> strongPointOps,
    List<ImprovementOp> improvements
) {
    public record WeakPointOp(
        String action,
        String point,
        String topic,
        String answerSummary,
        Double score,
        Integer index,
        String newPoint,
        String newAnswerSummary,
        String reason
    ) {}

    public record StrongPointOp(
        String action,
        String point,
        String topic,
        String reason
    ) {}

    public record ImprovementOp(
        int weakIndex,
        String reason
    ) {}
}
