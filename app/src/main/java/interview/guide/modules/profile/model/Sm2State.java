package interview.guide.modules.profile.model;

import java.time.LocalDate;

public record Sm2State(
    int intervalDays,
    double easeFactor,
    int repetitions,
    LocalDate nextReview,
    Double lastScore
) {
    public static Sm2State initial() {
        return new Sm2State(1, 2.5, 0, LocalDate.now().plusDays(1), null);
    }
}
