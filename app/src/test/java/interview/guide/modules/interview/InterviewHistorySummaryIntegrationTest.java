package interview.guide.modules.interview;

import interview.guide.modules.audio.adapter.TtsAdapter;
import interview.guide.modules.audio.service.VoiceMetrics;
import interview.guide.modules.interview.model.InterviewHistorySummaryDTO;
import interview.guide.modules.interview.service.GrowthCurveService;
import interview.guide.modules.interview.service.InterviewHistoryService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.interview.service.InterviewSessionService;
import interview.guide.modules.interview.voice.InterviewTurnProcessor;
import interview.guide.modules.interview.voice.VoiceTurnGuard;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InterviewController.class)
class InterviewHistorySummaryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InterviewSessionService sessionService;

    @MockitoBean
    private InterviewHistoryService historyService;

    @MockitoBean
    private InterviewPersistenceService persistenceService;

    @MockitoBean
    private GrowthCurveService growthCurveService;

    @MockitoBean
    private InterviewTurnProcessor turnProcessor;

    @MockitoBean
    private TtsAdapter ttsAdapter;

    @MockitoBean
    private VoiceTurnGuard voiceTurnGuard;

    @MockitoBean
    private VoiceMetrics voiceMetrics;

    @Test
    void getHistorySummaryShouldReturnStatsAndItems() throws Exception {
        when(historyService.getHistorySummary()).thenReturn(new InterviewHistorySummaryDTO(
            new InterviewHistorySummaryDTO.Stats(3, 2, 82),
            List.of()
        ));

        mockMvc.perform(get("/api/interview/history/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.stats.totalCount").exists())
            .andExpect(jsonPath("$.data.items").isArray());
    }
}
