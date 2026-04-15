package interview.guide.modules.profile.service;

import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.Sm2State;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class SpacedRepetitionServiceTest {

    private final SpacedRepetitionService service = new SpacedRepetitionService();

    @Test
    void shouldPassSimpleQuestion() {
        Sm2State state = Sm2State.initial();
        Sm2Result result = service.sm2Update(state, 7.0);

        assertEquals(1, result.intervalDays());
        assertEquals(1, result.repetitions());
        assertEquals(LocalDate.now().plusDays(1), result.nextReview());
    }

    @Test
    void shouldFailAndReset() {
        Sm2State state = new Sm2State(3, 2.5, 1, LocalDate.now(), null);
        Sm2Result result = service.sm2Update(state, 2.0);

        assertEquals(1, result.intervalDays());
        assertEquals(0, result.repetitions());
    }

    @Test
    void shouldReachImprovedAfterThreePasses() {
        Sm2State state = new Sm2State(3, 2.5, 2, LocalDate.now(), null);
        Sm2Result result = service.sm2Update(state, 8.0);

        assertEquals(3, result.repetitions());
        assertTrue(service.isImproved(result.repetitions()));
    }
}
