package interview.guide.modules.profile.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record WeakPointEnrollItem(
    String topic,
    String questionText,
    String answerSummary,
    @Min(0) @Max(10) double score,
    String source,
    Long sessionId
) {}