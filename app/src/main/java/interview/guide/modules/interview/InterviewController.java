package interview.guide.modules.interview;

import interview.guide.common.annotation.RateLimit;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.common.result.Result;
import interview.guide.modules.audio.adapter.TtsAdapter;
import interview.guide.modules.audio.service.VoiceMetrics;
import interview.guide.modules.interview.model.*;
import interview.guide.modules.interview.service.InterviewHistoryService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.interview.service.InterviewSessionService;
import interview.guide.modules.interview.voice.InterviewTurnProcessor;
import interview.guide.modules.interview.voice.VoiceTurnGuard;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * 面试控制器
 * 提供模拟面试相关的API接口
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class InterviewController {
    
    private final InterviewSessionService sessionService;
    private final InterviewHistoryService historyService;
    private final InterviewPersistenceService persistenceService;
    private final InterviewTurnProcessor turnProcessor;
    private final TtsAdapter ttsAdapter;
    private final VoiceTurnGuard voiceTurnGuard;
    private final VoiceMetrics voiceMetrics;
    
    /**
     * 创建面试会话
     */
    @PostMapping("/api/interview/sessions")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL, RateLimit.Dimension.IP}, count = 5)
    public Result<InterviewSessionDTO> createSession(@Valid @RequestBody CreateInterviewRequest request) {
        log.info("创建面试会话，题目数量: {}, 岗位: {}", request.questionCount(), request.jobRole());
        InterviewSessionDTO session = sessionService.createSession(request);
        return Result.success(session);
    }

    @GetMapping("/api/interview/job-roles")
    public Result<List<JobRoleDTO>> getJobRoles() {
        return Result.success(Arrays.stream(JobRole.values()).map(JobRoleDTO::from).toList());
    }
    
    /**
     * 获取会话信息
     */
    @GetMapping("/api/interview/sessions/{sessionId}")
    public Result<InterviewSessionDTO> getSession(@PathVariable("sessionId") String sessionId) {
        InterviewSessionDTO session = sessionService.getSession(sessionId);
        return Result.success(session);
    }
    
    /**
     * 获取当前问题
     */
    @GetMapping("/api/interview/sessions/{sessionId}/question")
    public Result<Map<String, Object>> getCurrentQuestion(@PathVariable("sessionId") String sessionId) {
        return Result.success(sessionService.getCurrentQuestionResponse(sessionId));
    }
    
    /**
     * 提交答案
     */
    @PostMapping("/api/interview/sessions/{sessionId}/answers")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL}, count = 10)
    public Result<InterviewTurnResponse> submitAnswer(
            @PathVariable("sessionId") String sessionId,
            @RequestBody Map<String, Object> body) {
        Integer questionIndex = parseQuestionIndex(body.get("questionIndex"));
        String answer = (String) body.getOrDefault("answer", body.get("answerText"));
        InterviewerOutputMode interviewerOutputMode = parseInterviewerOutputMode(body.get("interviewerOutputMode"));
        // 同一题在上一次请求完成前不允许再次提交，避免前端重复点击导致题目推进两次。
        if (!voiceTurnGuard.tryAcquire("submit", sessionId, questionIndex)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "当前问题正在提交中，请勿重复操作");
        }
        log.info("提交答案: 会话{}, 问题{}", sessionId, questionIndex);
        try {
            InterviewTurnResponse response = turnProcessor.process(
                new InterviewTurnInput(
                    sessionId,
                    questionIndex,
                    answer,
                    null,
                    CandidateInputMode.TEXT,
                    interviewerOutputMode
                )
            );
            return Result.success(response);
        } finally {
            voiceTurnGuard.release("submit", sessionId, questionIndex);
        }
    }

    /**
     * 识别语音答案（仅识别，不推进会话）
     */
    @PostMapping(
        value = "/api/interview/sessions/{sessionId}/answers/voice/recognize",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL}, count = 10)
    public Result<VoiceRecognizeResponse> recognizeVoiceAnswer(
        @PathVariable("sessionId") String sessionId,
        @RequestParam Integer questionIndex,
        @RequestPart("file") MultipartFile file
    ) {
        // 识别链路与提交流程解耦后，仍需要防止同一音频被重复上传触发多次 ASR。
        if (!voiceTurnGuard.tryAcquire("recognize", sessionId, questionIndex)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "当前语音正在识别中，请勿重复上传");
        }
        log.info("识别语音答案: 会话{}, 问题{}", sessionId, questionIndex);
        try {
            NormalizedAnswer normalizedAnswer = turnProcessor.recognize(
                new InterviewTurnInput(
                    sessionId,
                    questionIndex,
                    null,
                    file,
                    CandidateInputMode.VOICE,
                    InterviewerOutputMode.TEXT
                )
            );
            return Result.success(new VoiceRecognizeResponse(normalizedAnswer.recognizedText()));
        } finally {
            voiceTurnGuard.release("recognize", sessionId, questionIndex);
        }
    }

    /**
     * 题目 TTS 流
     */
    @PostMapping(value = "/api/interview/tts/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL}, count = 20)
    public Flux<ServerSentEvent<String>> streamQuestionTts(@RequestBody TtsStreamRequest request) {
        log.info("题目 TTS 流式合成，文本长度: {}", request.text() == null ? 0 : request.text().length());
        long startTime = System.nanoTime();
        try {
            byte[] audioBytes = ttsAdapter.synthesize(request.text());
            if (audioBytes == null || audioBytes.length == 0) {
                // 题目播报属于增强能力，不应因为 TTS 失败而卡住文字面试主线。
                voiceMetrics.recordTtsFailure(durationMs(startTime), request.text() == null ? 0 : request.text().length(), "controller", "empty_audio");
                return Flux.empty();
            }
            return Flux.just(ServerSentEvent.<String>builder()
                    .event("audio")
                    .data(Base64.getEncoder().encodeToString(audioBytes))
                    .build());
        } catch (Exception exception) {
            voiceMetrics.recordTtsFailure(durationMs(startTime), request.text() == null ? 0 : request.text().length(), "controller", exception.getMessage());
            log.warn("题目 TTS 合成失败，不阻断面试流程: {}", exception.getMessage(), exception);
            return Flux.empty();
        }
    }
    
    /**
     * 生成面试报告
     */
    @GetMapping("/api/interview/sessions/{sessionId}/report")
    public Result<InterviewReportDTO> getReport(@PathVariable("sessionId") String sessionId) {
        log.info("生成面试报告: {}", sessionId);
        InterviewReportDTO report = sessionService.generateReport(sessionId);
        return Result.success(report);
    }
    
    /**
     * 查找未完成的面试会话
     * GET /api/interview/sessions/unfinished/{resumeId}
     */
    @GetMapping("/api/interview/sessions/unfinished/{resumeId}")
    public Result<InterviewSessionDTO> findUnfinishedSession(@PathVariable("resumeId") Long resumeId) {
        return Result.success(sessionService.findUnfinishedSessionOrThrow(resumeId));
    }
    
    /**
     * 暂存答案（不进入下一题）
     */
    @PutMapping("/api/interview/sessions/{sessionId}/answers")
    public Result<Void> saveAnswer(
            @PathVariable("sessionId") String sessionId,
            @RequestBody Map<String, Object> body) {
        Integer questionIndex = (Integer) body.get("questionIndex");
        String answer = (String) body.get("answer");
        log.info("暂存答案: 会话{}, 问题{}", sessionId, questionIndex);
        SubmitAnswerRequest request = new SubmitAnswerRequest(sessionId, questionIndex, answer);
        sessionService.saveAnswer(request);
        return Result.success(null);
    }
    
    /**
     * 提前交卷
     */
    @PostMapping("/api/interview/sessions/{sessionId}/complete")
    public Result<Void> completeInterview(@PathVariable("sessionId") String sessionId) {
        log.info("提前交卷: {}", sessionId);
        sessionService.completeInterview(sessionId);
        return Result.success(null);
    }
    
    /**
     * 获取面试会话详情
     * GET /api/interview/sessions/{sessionId}/details
     */
    @GetMapping("/api/interview/sessions/{sessionId}/details")
    public Result<InterviewDetailDTO> getInterviewDetail(@PathVariable("sessionId") String sessionId) {
        InterviewDetailDTO detail = historyService.getInterviewDetail(sessionId);
        return Result.success(detail);
    }
    
    /**
     * 导出面试报告为PDF
     */
    @GetMapping("/api/interview/sessions/{sessionId}/export")
    public ResponseEntity<byte[]> exportInterviewPdf(@PathVariable("sessionId") String sessionId) {
        try {
            byte[] pdfBytes = historyService.exportInterviewPdf(sessionId);
            String filename = URLEncoder.encode("模拟面试报告_" + sessionId + ".pdf", 
                StandardCharsets.UTF_8);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
        } catch (Exception e) {
            log.error("导出PDF失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 删除面试会话
     */
    @DeleteMapping("/api/interview/sessions/{sessionId}")
    public Result<Void> deleteInterview(@PathVariable("sessionId") String sessionId) {
        log.info("删除面试会话: {}", sessionId);
        persistenceService.deleteSessionBySessionId(sessionId);
        return Result.success(null);
    }

    private InterviewerOutputMode parseInterviewerOutputMode(Object rawMode) {
        if (rawMode == null) {
            return InterviewerOutputMode.TEXT;
        }
        String mode = rawMode.toString().trim();
        if (mode.isEmpty()) {
            return InterviewerOutputMode.TEXT;
        }
        return switch (mode) {
            case "text", "TEXT" -> InterviewerOutputMode.TEXT;
            case "textVoice", "TEXT_VOICE", "TEXTVOICE" -> InterviewerOutputMode.TEXT_VOICE;
            default -> throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的输出模式: " + mode);
        };
    }

    private Integer parseQuestionIndex(Object rawQuestionIndex) {
        // controller 直接接 Map 时，Jackson 可能给出 Integer/Long/String，统一在这里收口解析。
        if (rawQuestionIndex instanceof Integer questionIndex) {
            return questionIndex;
        }
        if (rawQuestionIndex instanceof Number number) {
            return number.intValue();
        }
        if (rawQuestionIndex instanceof String text && !text.isBlank()) {
            try {
                return Integer.parseInt(text.trim());
            } catch (NumberFormatException ignored) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "问题索引格式不正确");
            }
        }
        throw new BusinessException(ErrorCode.BAD_REQUEST, "问题索引不能为空");
    }

    private long durationMs(long startTime) {
        return (System.nanoTime() - startTime) / 1_000_000;
    }
}
