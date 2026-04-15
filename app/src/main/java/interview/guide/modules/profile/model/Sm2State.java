package interview.guide.modules.profile.model;

import java.time.LocalDate;
import java.util.Map;

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

    /** Construct Sm2State from the JSONB Map stored in the entity */
    public static Sm2State fromMap(Map<String, Object> map) {
        return new Sm2State(
            toInt(map, "interval_days", 1),
            toDouble(map, "ease_factor", 2.5),
            toInt(map, "repetitions", 0),
            map.get("next_review") != null
                ? LocalDate.parse((String) map.get("next_review"))
                : LocalDate.now(),
            toDouble(map, "last_score", 0.0)
        );
    }

    private static int toInt(Map<String, Object> map, String key, int defaultValue) {
        Object v = map.get(key);
        return v instanceof Number ? ((Number) v).intValue() : defaultValue;
    }

    private static double toDouble(Map<String, Object> map, String key, double defaultValue) {
        Object v = map.get(key);
        return v instanceof Number ? ((Number) v).doubleValue() : defaultValue;
    }
}
