package interview.guide.modules.schedule.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.schedule.model.CreateInterviewRequest;
import interview.guide.modules.schedule.model.InterviewScheduleDTO;
import interview.guide.modules.schedule.model.InterviewScheduleEntity;
import interview.guide.modules.schedule.model.InterviewStatus;
import interview.guide.modules.schedule.repository.InterviewScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class InterviewScheduleServiceTest {

    @Mock
    private InterviewScheduleRepository repository;

    private InterviewScheduleService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new InterviewScheduleService(repository);
    }

    @Test
    void shouldCreateScheduleWithPendingStatus() {
        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setCompanyName("ByteDance");
        request.setPosition("Java Backend");
        request.setInterviewTime(LocalDateTime.now().plusDays(1));

        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        entity.setId(1L);
        entity.setCompanyName("ByteDance");
        entity.setPosition("Java Backend");
        entity.setInterviewTime(request.getInterviewTime());
        entity.setStatus(InterviewStatus.PENDING);

        when(repository.save(any(InterviewScheduleEntity.class))).thenReturn(entity);

        InterviewScheduleDTO result = service.create(request);

        assertEquals(InterviewStatus.PENDING, result.getStatus());
        assertEquals("ByteDance", result.getCompanyName());
        verify(repository, times(1)).save(any(InterviewScheduleEntity.class));
    }

    @Test
    void shouldUpdateSchedulePreserveStatus() {
        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setCompanyName("Alibaba");
        request.setPosition("Senior Java");
        request.setInterviewTime(LocalDateTime.now().plusDays(2));
        request.setInterviewType("VIDEO");

        InterviewScheduleEntity existingEntity = new InterviewScheduleEntity();
        existingEntity.setId(1L);
        existingEntity.setCompanyName("ByteDance");
        existingEntity.setPosition("Java Backend");
        existingEntity.setInterviewTime(LocalDateTime.now().plusDays(1));
        existingEntity.setStatus(InterviewStatus.PENDING);

        InterviewScheduleEntity updatedEntity = new InterviewScheduleEntity();
        updatedEntity.setId(1L);
        updatedEntity.setCompanyName("Alibaba");
        updatedEntity.setPosition("Senior Java");
        updatedEntity.setInterviewTime(request.getInterviewTime());
        updatedEntity.setInterviewType("VIDEO");
        updatedEntity.setStatus(InterviewStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(existingEntity));
        when(repository.save(any(InterviewScheduleEntity.class))).thenReturn(updatedEntity);

        InterviewScheduleDTO result = service.update(1L, request);

        assertEquals("Alibaba", result.getCompanyName());
        assertEquals(InterviewStatus.PENDING, result.getStatus());
        verify(repository).findById(1L);
        verify(repository).save(any(InterviewScheduleEntity.class));
    }

    @Test
    void shouldDeleteSchedule() {
        doNothing().when(repository).deleteById(1L);

        service.delete(1L);

        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void shouldUpdateStatus() {
        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        entity.setId(1L);
        entity.setCompanyName("Tencent");
        entity.setPosition("Go Developer");
        entity.setInterviewTime(LocalDateTime.now().plusDays(1));
        entity.setStatus(InterviewStatus.PENDING);

        InterviewScheduleEntity updatedEntity = new InterviewScheduleEntity();
        updatedEntity.setId(1L);
        updatedEntity.setCompanyName("Tencent");
        updatedEntity.setPosition("Go Developer");
        updatedEntity.setInterviewTime(entity.getInterviewTime());
        updatedEntity.setStatus(InterviewStatus.COMPLETED);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any(InterviewScheduleEntity.class))).thenReturn(updatedEntity);

        InterviewScheduleDTO result = service.updateStatus(1L, InterviewStatus.COMPLETED);

        assertEquals(InterviewStatus.COMPLETED, result.getStatus());
        verify(repository).save(any(InterviewScheduleEntity.class));
    }

    @Test
    void shouldGetByIdWhenExists() {
        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        entity.setId(1L);
        entity.setCompanyName("Meituan");
        entity.setPosition("Python Engineer");
        entity.setInterviewTime(LocalDateTime.now().plusDays(1));
        entity.setStatus(InterviewStatus.PENDING);

        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        InterviewScheduleDTO result = service.getById(1L);

        assertEquals(1L, result.getId());
        assertEquals("Meituan", result.getCompanyName());
        verify(repository).findById(1L);
    }

    @Test
    void shouldThrowExceptionWhenGetByIdNotExists() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () -> service.getById(999L));

        assertEquals(ErrorCode.NOT_FOUND.getCode(), exception.getCode());
        assertTrue(exception.getMessage().contains("面试日程不存在"));
        verify(repository).findById(999L);
    }

    @Test
    void shouldGetAllWithoutFilter() {
        InterviewScheduleEntity entity1 = new InterviewScheduleEntity();
        entity1.setId(1L);
        entity1.setCompanyName("Company A");
        entity1.setPosition("Engineer");
        entity1.setInterviewTime(LocalDateTime.now());
        entity1.setStatus(InterviewStatus.PENDING);

        InterviewScheduleEntity entity2 = new InterviewScheduleEntity();
        entity2.setId(2L);
        entity2.setCompanyName("Company B");
        entity2.setPosition("Designer");
        entity2.setInterviewTime(LocalDateTime.now().plusDays(1));
        entity2.setStatus(InterviewStatus.COMPLETED);

        when(repository.findAll()).thenReturn(Arrays.asList(entity1, entity2));

        List<InterviewScheduleDTO> results = service.getAll(null, null, null);

        assertEquals(2, results.size());
        verify(repository).findAll();
    }

    @Test
    void shouldGetAllFilteredByStatus() {
        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        entity.setId(1L);
        entity.setCompanyName("Pinduoduo");
        entity.setPosition("Algorithm Engineer");
        entity.setInterviewTime(LocalDateTime.now());
        entity.setStatus(InterviewStatus.PENDING);

        when(repository.findByStatus(InterviewStatus.PENDING)).thenReturn(Collections.singletonList(entity));

        List<InterviewScheduleDTO> results = service.getAll("PENDING", null, null);

        assertEquals(1, results.size());
        assertEquals(InterviewStatus.PENDING, results.get(0).getStatus());
        verify(repository).findByStatus(InterviewStatus.PENDING);
    }

    @Test
    void shouldGetAllFilteredByTimeRange() {
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().plusDays(7);

        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        entity.setId(1L);
        entity.setCompanyName("Xiaomi");
        entity.setPosition("Frontend");
        entity.setInterviewTime(LocalDateTime.now().plusDays(3));
        entity.setStatus(InterviewStatus.PENDING);

        when(repository.findByInterviewTimeBetween(start, end)).thenReturn(Collections.singletonList(entity));

        List<InterviewScheduleDTO> results = service.getAll(null, start, end);

        assertEquals(1, results.size());
        assertEquals("Xiaomi", results.get(0).getCompanyName());
        verify(repository).findByInterviewTimeBetween(start, end);
    }
}