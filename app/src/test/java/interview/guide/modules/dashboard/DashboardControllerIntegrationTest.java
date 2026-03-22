package interview.guide.modules.dashboard;

import interview.guide.modules.dashboard.model.DashboardSummaryDTO;
import interview.guide.modules.dashboard.service.DashboardSummaryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
class DashboardControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardSummaryService dashboardSummaryService;

    @Test
    void getSummaryShouldReturnDashboardPayload() throws Exception {
        when(dashboardSummaryService.getSummary()).thenReturn(new DashboardSummaryDTO(
            2,
            3,
            1,
            new DashboardSummaryDTO.LatestResumeSummary(2L, "latest-resume.pdf", LocalDateTime.of(2026, 3, 21, 11, 0)),
            new DashboardSummaryDTO.LatestInterviewSummary(
                "session-latest",
                "IN_PROGRESS",
                LocalDateTime.of(2026, 3, 21, 12, 0),
                null,
                null
            ),
            92
        ));

        mockMvc.perform(get("/api/dashboard/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.resumeCount").value(2))
            .andExpect(jsonPath("$.data.totalInterviewCount").value(3))
            .andExpect(jsonPath("$.data.unfinishedInterviewCount").value(1))
            .andExpect(jsonPath("$.data.latestResume.id").value(2))
            .andExpect(jsonPath("$.data.latestResume.filename").value("latest-resume.pdf"))
            .andExpect(jsonPath("$.data.latestInterview.sessionId").value("session-latest"))
            .andExpect(jsonPath("$.data.latestInterview.status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$.data.latestReportScore").value(92));
    }
}
