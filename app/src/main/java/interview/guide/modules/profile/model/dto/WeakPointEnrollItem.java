package interview.guide.modules.profile.model.dto;

public record WeakPointEnrollItem(
    String topic,
    String questionText,
    String answerSummary,
    double score,
    String source,
    Long sessionId
) {}