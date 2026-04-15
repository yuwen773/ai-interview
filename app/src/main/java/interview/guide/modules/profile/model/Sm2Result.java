package interview.guide.modules.profile.model;

import java.time.LocalDate;

public record Sm2Result(
    int intervalDays,
    double easeFactor,
    int repetitions,
    LocalDate nextReview
) {}
