package interview.guide.modules.schedule.repository;

import interview.guide.modules.schedule.model.InterviewScheduleEntity;
import interview.guide.modules.schedule.model.InterviewStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewScheduleRepositoryTest {

    @Mock
    private InterviewScheduleRepository repository;

    private InterviewScheduleEntity createEntity(String companyName, String position, InterviewStatus status, LocalDateTime interviewTime) {
        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        entity.setId(1L);
        entity.setCompanyName(companyName);
        entity.setPosition(position);
        entity.setStatus(status);
        entity.setInterviewTime(interviewTime);
        return entity;
    }

    @Test
    void shouldSaveAndFindById() {
        InterviewScheduleEntity entity = createEntity("Test Company", "Java Engineer", InterviewStatus.PENDING, LocalDateTime.now().plusDays(1));
        when(repository.save(entity)).thenReturn(entity);
        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        InterviewScheduleEntity saved = repository.save(entity);
        assertNotNull(saved.getId());

        Optional<InterviewScheduleEntity> found = repository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Test Company", found.get().getCompanyName());
    }

    @Test
    void shouldFindByStatus() {
        InterviewScheduleEntity pending = createEntity("Company A", "Java Engineer", InterviewStatus.PENDING, LocalDateTime.now().plusDays(1));
        InterviewScheduleEntity completed = createEntity("Company B", "Python Engineer", InterviewStatus.COMPLETED, LocalDateTime.now().plusDays(2));

        when(repository.findByStatus(InterviewStatus.PENDING)).thenReturn(Collections.singletonList(pending));
        when(repository.findByStatus(InterviewStatus.COMPLETED)).thenReturn(Collections.singletonList(completed));

        List<InterviewScheduleEntity> pendingResults = repository.findByStatus(InterviewStatus.PENDING);
        assertEquals(1, pendingResults.size());
        assertEquals(InterviewStatus.PENDING, pendingResults.get(0).getStatus());

        List<InterviewScheduleEntity> completedResults = repository.findByStatus(InterviewStatus.COMPLETED);
        assertEquals(1, completedResults.size());
        assertEquals(InterviewStatus.COMPLETED, completedResults.get(0).getStatus());
    }

    @Test
    void shouldFindByInterviewTimeBetween() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.plusDays(1);
        LocalDateTime end = now.plusDays(7);

        InterviewScheduleEntity entity1 = createEntity("Company A", "Java Engineer", InterviewStatus.PENDING, now.plusDays(2));
        InterviewScheduleEntity entity2 = createEntity("Company B", "Python Engineer", InterviewStatus.PENDING, now.plusDays(5));
        InterviewScheduleEntity entity3 = createEntity("Company C", "Go Engineer", InterviewStatus.PENDING, now.plusDays(10));

        when(repository.findByInterviewTimeBetween(start, end)).thenReturn(Arrays.asList(entity1, entity2));

        List<InterviewScheduleEntity> results = repository.findByInterviewTimeBetween(start, end);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(e -> e.getInterviewTime().isAfter(start) && e.getInterviewTime().isBefore(end)));
    }

    @Test
    void shouldFindByStatusAndInterviewTimeBefore() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.plusDays(3);

        InterviewScheduleEntity entity1 = createEntity("Company A", "Java Engineer", InterviewStatus.PENDING, now.plusDays(1));
        InterviewScheduleEntity entity2 = createEntity("Company B", "Python Engineer", InterviewStatus.PENDING, now.plusDays(2));
        InterviewScheduleEntity entity3 = createEntity("Company C", "Go Engineer", InterviewStatus.PENDING, now.plusDays(5));

        when(repository.findByStatusAndInterviewTimeBefore(InterviewStatus.PENDING, cutoff)).thenReturn(Arrays.asList(entity1, entity2));

        List<InterviewScheduleEntity> results = repository.findByStatusAndInterviewTimeBefore(InterviewStatus.PENDING, cutoff);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(e -> e.getStatus() == InterviewStatus.PENDING && e.getInterviewTime().isBefore(cutoff)));
    }

    @Test
    void shouldReturnEmptyListWhenNoResults() {
        when(repository.findByStatus(InterviewStatus.CANCELLED)).thenReturn(Collections.emptyList());
        when(repository.findByInterviewTimeBetween(any(), any())).thenReturn(Collections.emptyList());
        when(repository.findByStatusAndInterviewTimeBefore(any(), any())).thenReturn(Collections.emptyList());

        assertTrue(repository.findByStatus(InterviewStatus.CANCELLED).isEmpty());
        assertTrue(repository.findByInterviewTimeBetween(LocalDateTime.now(), LocalDateTime.now().plusDays(1)).isEmpty());
        assertTrue(repository.findByStatusAndInterviewTimeBefore(InterviewStatus.PENDING, LocalDateTime.now()).isEmpty());
    }
}