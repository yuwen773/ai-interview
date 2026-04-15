package interview.guide.modules.profile.model.dto;

import java.util.List;

public record ProfileExtractResult(
    List<WeakPointInsight> weakPoints,
    List<StrengthInsight> strengths
) {
    public record WeakPointInsight(
        String topic,
        String question,
        String answerSummary,
        double score
    ) {}

    public record StrengthInsight(
        String topic,
        String description
    ) {}
}
