package interview.guide.modules.profile.model;

import java.time.LocalDate;
import java.util.Map;

/**
 * SM-2间隔重复状态
 * 持久化为JSONB存储在弱项实体中，记录间隔重复算法所需的完整状态
 */
public record Sm2State(
    int intervalDays,    // 复习间隔（天）
    double easeFactor,   // 难度因子（≥1.3）
    int repetitions,     // 连续成功次数
    LocalDate nextReview,// 下次复习日期
    Double lastScore     // 上次评分
) {
    /** 创建初始SM-2状态（间隔1天，难度因子2.5） */
    public static Sm2State initial() {
        return new Sm2State(1, 2.5, 0, LocalDate.now().plusDays(1), null);
    }

    /** 从实体中存储的JSONB Map构造Sm2State */
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
