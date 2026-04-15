package interview.guide.modules.profile.model.dto;

import java.time.LocalDate;

public record WeakPointDto(
    Long id,
    String topic,
    String questionText,
    String answerSummary,
    Double score,
    String source,
    Long sessionId,
    LocalDate nextReview,
    double easeFactor,
    int repetitions,
    int timesSeen,
    boolean isImproved
) {}