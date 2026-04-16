package interview.guide.modules.profile.model;

import java.time.LocalDate;

/**
 * SM-2算法计算结果
 * 包含更新后的复习间隔、难度因子、重复次数和下次复习日期
 */
public record Sm2Result(
    int intervalDays,    // 复习间隔（天）
    double easeFactor,   // 难度因子（≥1.3）
    int repetitions,     // 连续成功次数
    LocalDate nextReview // 下次复习日期
) {}
