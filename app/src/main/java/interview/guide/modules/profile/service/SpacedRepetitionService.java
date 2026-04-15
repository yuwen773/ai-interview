package interview.guide.modules.profile.service;

import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.Sm2State;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
}
