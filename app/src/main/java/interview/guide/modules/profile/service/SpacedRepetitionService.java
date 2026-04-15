package interview.guide.modules.profile.service;

import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.Sm2State;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
public class SpacedRepetitionService {

    public Sm2Result sm2Update(Sm2State state, double score0to10) {
        int quality = mapScoreToQuality(score0to10);
        double ef = state.easeFactor();
        int reps = state.repetitions();
        int interval = state.intervalDays();

        if (quality >= 3) {
            if (reps == 0) interval = 1;
            else if (reps == 1) interval = 3;
            else interval = (int) Math.round(interval * ef);
            reps++;
        } else {
            interval = 1;
            reps = 0;
        }

        ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

        return new Sm2Result(interval, ef, reps, LocalDate.now().plusDays(interval));
    }

    private int mapScoreToQuality(double score) {
        if (score <= 2) return 0;
        if (score <= 4) return 2;
        if (score <= 5) return 3;
        if (score <= 7) return 4;
        return 5;
    }

    public boolean isImproved(int repetitions) {
        return repetitions >= 3;
    }

    public static Map<String, Object> buildInitialSrState(double lastScore) {
        Map<String, Object> state = new HashMap<>();
        state.put("interval_days", 1);
        state.put("ease_factor", 2.5);
        state.put("repetitions", 0);
        state.put("next_review", LocalDate.now().plusDays(1).toString());
        state.put("last_score", lastScore);
        return state;
    }

    // ========== Time Decay ==========

    /** 时间衰减半衰期（天） */
    private static final double TIME_DECAY_HALF_LIFE = 14.0;
    /** 最大衰减权重（最多衰减 30%） */
    private static final double TIME_DECAY_WEIGHT = 0.3;

    /**
     * 计算时间衰减乘数。基于指数衰减模型，14天半衰期，最大衰减30%。
     * <p>
     * 返回范围 [0.7, 1.0]：
     * - Day 0: 1.0（无衰减）
     * - Day 14: 0.85
     * - Day 28: 0.775
     * - 渐近下限: 0.7（最大衰减30%）
     *
     * @param lastAssessed 最后评估时间
     * @return 衰减乘数 [0.7, 1.0]
     */
    public static double timeDecayMultiplier(LocalDateTime lastAssessed) {
        if (lastAssessed == null) return 1.0 - TIME_DECAY_WEIGHT; // 从未评估 = 最大衰减
        long ageInDays = ChronoUnit.DAYS.between(lastAssessed, LocalDateTime.now());
        double decay = Math.pow(0.5, Math.max(0, ageInDays) / TIME_DECAY_HALF_LIFE);
        return (1.0 - TIME_DECAY_WEIGHT) + TIME_DECAY_WEIGHT * decay;
    }

    /**
     * 将掌握度分数向中位数 50 回归（时间衰减）。
     */
    public static double applyDecay(double rawScore, LocalDateTime lastAssessed) {
        double multiplier = timeDecayMultiplier(lastAssessed);
        return 50.0 + (rawScore - 50.0) * multiplier;
    }

    /**
     * 判断弱项是否因长期未见而应归档。
     *
     * @param lastSeen 最后观察时间
     * @param timesSeen 观察次数
     * @return 是否应归档
     */
    public static boolean shouldArchive(LocalDateTime lastSeen, int timesSeen) {
        if (lastSeen == null) return false;
        long daysSinceLastSeen = ChronoUnit.DAYS.between(lastSeen, LocalDateTime.now());
        // 超过60天未见 → 归档
        if (daysSinceLastSeen > 60) return true;
        // 超过30天未见且仅观察1-2次 → 归档（噪声数据）
        return daysSinceLastSeen > 30 && timesSeen <= 2;
    }
}
