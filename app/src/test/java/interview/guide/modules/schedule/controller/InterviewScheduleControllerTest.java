package interview.guide.modules.schedule.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import interview.guide.modules.schedule.model.*;
import interview.guide.modules.schedule.service.InterviewParseService;
import interview.guide.modules.schedule.service.InterviewScheduleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("面试日程控制器测试")
class InterviewScheduleControllerTest {

    private InterviewScheduleService scheduleService;
    private InterviewParseService parseService;
    private InterviewScheduleController controller;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        scheduleService = mock(InterviewScheduleService.class);
        parseService = mock(InterviewParseService.class);
        controller = new InterviewScheduleController(scheduleService, parseService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("POST /api/interview-schedule - 创建日程成功")
    void shouldCreateSchedule() throws Exception {
        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setCompanyName("Test Company");
        request.setPosition("Java Engineer");
        request.setInterviewTime(LocalDateTime.now().plusDays(1));

        InterviewScheduleDTO dto = new InterviewScheduleDTO();
        dto.setId(1L);
        dto.setCompanyName("Test Company");
        dto.setPosition("Java Engineer");
        dto.setStatus(InterviewStatus.PENDING);

        when(scheduleService.create(any())).thenReturn(dto);

        mockMvc.perform(post("/api/interview-schedule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.companyName").value("Test Company"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/interview-schedule/{id} - 获取单个日程")
    void shouldGetById() throws Exception {
        InterviewScheduleDTO dto = new InterviewScheduleDTO();
        dto.setId(1L);
        dto.setCompanyName("Test Company");
        dto.setPosition("Java Engineer");
        dto.setStatus(InterviewStatus.PENDING);

        when(scheduleService.getById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/interview-schedule/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.companyName").value("Test Company"));
    }

    @Test
    @DisplayName("GET /api/interview-schedule - 获取所有日程")
    void shouldGetAll() throws Exception {
        InterviewScheduleDTO dto1 = new InterviewScheduleDTO();
        dto1.setId(1L);
        dto1.setCompanyName("Company A");
        dto1.setStatus(InterviewStatus.PENDING);

        InterviewScheduleDTO dto2 = new InterviewScheduleDTO();
        dto2.setId(2L);
        dto2.setCompanyName("Company B");
        dto2.setStatus(InterviewStatus.COMPLETED);

        when(scheduleService.getAll(null, null, null)).thenReturn(List.of(dto1, dto2));

        mockMvc.perform(get("/api/interview-schedule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].companyName").value("Company A"))
                .andExpect(jsonPath("$.data[1].companyName").value("Company B"));
    }

    @Test
    @DisplayName("PUT /api/interview-schedule/{id} - 更新日程")
    void shouldUpdateSchedule() throws Exception {
        CreateInterviewRequest request = new CreateInterviewRequest();
        request.setCompanyName("Updated Company");
        request.setPosition("Python Engineer");
        request.setInterviewTime(LocalDateTime.now().plusDays(2));

        InterviewScheduleDTO dto = new InterviewScheduleDTO();
        dto.setId(1L);
        dto.setCompanyName("Updated Company");
        dto.setPosition("Python Engineer");
        dto.setStatus(InterviewStatus.PENDING);

        when(scheduleService.update(eq(1L), any())).thenReturn(dto);

        mockMvc.perform(put("/api/interview-schedule/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.companyName").value("Updated Company"))
                .andExpect(jsonPath("$.data.position").value("Python Engineer"));
    }

    @Test
    @DisplayName("DELETE /api/interview-schedule/{id} - 删除日程")
    void shouldDeleteSchedule() throws Exception {
        mockMvc.perform(delete("/api/interview-schedule/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PATCH /api/interview-schedule/{id}/status - 更新状态")
    void shouldUpdateStatus() throws Exception {
        InterviewScheduleDTO dto = new InterviewScheduleDTO();
        dto.setId(1L);
        dto.setCompanyName("Test Company");
        dto.setStatus(InterviewStatus.COMPLETED);

        when(scheduleService.updateStatus(1L, InterviewStatus.COMPLETED)).thenReturn(dto);

        mockMvc.perform(patch("/api/interview-schedule/1/status")
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("POST /api/interview-schedule/parse - AI解析面试邀约")
    void shouldParseInterviewInvitation() throws Exception {
        ParseRequest request = new ParseRequest();
        request.setRawText("公司：阿里巴巴\n岗位：Java工程师\n时间：2026-05-30 14:00");
        request.setSource("feishu");

        CreateInterviewRequest parsedData = new CreateInterviewRequest();
        parsedData.setCompanyName("阿里巴巴");
        parsedData.setPosition("Java工程师");
        parsedData.setInterviewTime(LocalDateTime.of(2026, 5, 30, 14, 0));

        ParseResponse response = new ParseResponse(true, parsedData, 0.95, "rule", "规则解析成功");

        when(parseService.parse(any(), eq("feishu"))).thenReturn(response);

        mockMvc.perform(post("/api/interview-schedule/parse")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.confidence").value(0.95))
                .andExpect(jsonPath("$.data.parseMethod").value("rule"));
    }
}