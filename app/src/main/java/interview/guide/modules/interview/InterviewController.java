package interview.guide.modules.interview;

import interview.guide.common.annotation.RateLimit;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.common.result.Result;
import interview.guide.modules.audio.strategy.AnswerOutputStrategy;
import interview.guide.modules.audio.service.AsrService;
import interview.guide.modules.interview.model.*;
import interview.guide.modules.interview.service.InterviewHistoryService;
import interview.guide.modules.interview.service.InterviewPersistenceService;
import interview.guide.modules.interview.service.InterviewSessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 面试控制器
 * 提供模拟面试相关的API接口
 */
@Slf4j
@RestController
public class InterviewController {

    private static final long MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_AUDIO_TYPES = {
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/wave",
        "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a"
    };

    private final InterviewSessionService sessionService;
    private final InterviewHistoryService historyService;
    private final InterviewPersistenceService persistenceService;
    private final AsrService asrService;
    private final AnswerOutputStrategy voiceOutputStrategy;
    private final AnswerOutputStrategy textOutputStrategy;

    public InterviewController(
            InterviewSessionService sessionService,
            InterviewHistoryService historyService,
            InterviewPersistenceService persistenceService,
            AsrService asrService,
            @Qualifier("voiceOutputStrategy") AnswerOutputStrategy voiceOutputStrategy,
            @Qualifier("textOutputStrategy") AnswerOutputStrategy textOutputStrategy) {
        this.sessionService = sessionService;
        this.historyService = historyService;
        this.persistenceService = persistenceService;
        this.asrService = asrService;
        this.voiceOutputStrategy = voiceOutputStrategy;
        this.textOutputStrategy = textOutputStrategy;
    }
    
    /**
     * 创建面试会话
     */
    @PostMapping("/api/interview/sessions")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL, RateLimit.Dimension.IP}, count = 5)
    public Result<InterviewSessionDTO> createSession(@RequestBody CreateInterviewRequest request) {
        log.info("创建面试会话，题目数量: {}", request.questionCount());
        InterviewSessionDTO session = sessionService.createSession(request);
        return Result.success(session);
    }
    
    /**
     * 获取会话信息
     */
    @GetMapping("/api/interview/sessions/{sessionId}")
    public Result<InterviewSessionDTO> getSession(@PathVariable String sessionId) {
        InterviewSessionDTO session = sessionService.getSession(sessionId);
        return Result.success(session);
    }
    
    /**
     * 获取当前问题
     */
    @GetMapping("/api/interview/sessions/{sessionId}/question")
    public Result<Map<String, Object>> getCurrentQuestion(@PathVariable String sessionId) {
        return Result.success(sessionService.getCurrentQuestionResponse(sessionId));
    }
    
    /**
     * 提交答案
     */
    @PostMapping("/api/interview/sessions/{sessionId}/answers")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL}, count = 10)
    public Result<SubmitAnswerResponse> submitAnswer(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> body) {
        Integer questionIndex = (Integer) body.get("questionIndex");
        String answer = (String) body.get("answer");
        log.info("提交答案: 会话{}, 问题{}", sessionId, questionIndex);
        SubmitAnswerRequest request = new SubmitAnswerRequest(sessionId, questionIndex, answer);
        SubmitAnswerResponse response = sessionService.submitAnswer(request);
        return Result.success(response);
    }

    /**
     * Submit answer via voice input
     * Supports both text and voice output modes
     */
    @PostMapping("/api/interview/{sessionId}/answer/voice")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL}, count = 10)
    public Object submitVoiceAnswer(
            @PathVariable String sessionId,
            @RequestParam("file") MultipartFile audioFile,
            @RequestParam(defaultValue = "voice") String outputMode) {

        log.info("Voice answer submitted: sessionId={}, outputMode={}, fileSize={}",
            sessionId, outputMode, audioFile.getSize());

        // Validate audio file
        if (audioFile.isEmpty()) {
            return Result.error(ErrorCode.BAD_REQUEST, "Audio file is empty");
        }

        // Validate file size (max 10MB)
        if (audioFile.getSize() > MAX_AUDIO_FILE_SIZE) {
            return Result.error(ErrorCode.BAD_REQUEST,
                String.format("Audio file size exceeds maximum allowed size of %d MB",
                    MAX_AUDIO_FILE_SIZE / (1024 * 1024)));
        }

        // Validate file type
        String contentType = audioFile.getContentType();
        if (contentType == null || !isAllowedAudioType(contentType)) {
            return Result.error(ErrorCode.BAD_REQUEST,
                "Unsupported audio file type. Allowed types: MP3, WAV, OGG, WebM, M4A");
        }

        // Step 1: ASR - transcribe audio to text
        String userAnswer;
        try {
            userAnswer = asrService.transcribe(audioFile);
            if (userAnswer == null || userAnswer.isBlank()) {
                return Result.error(ErrorCode.ASR_FAILED, "Speech recognition returned empty result");
            }
            log.info("ASR result: {}", userAnswer.substring(0, Math.min(100, userAnswer)));
        } catch (Exception e) {
            log.error("ASR processing failed", e);
            return Result.error(ErrorCode.ASR_FAILED, "Speech recognition failed: " + e.getMessage());
        }

        // Step 2: Get current question index from session
        // Note: This lookup is necessary because submitAnswer() requires the questionIndex parameter.
        // We use the session's current index since voice answers always advance to the next question.
        // The submitAnswer() method will validate this index internally.
        InterviewSessionDTO session;
        try {
            session = sessionService.getSession(sessionId);
        } catch (BusinessException e) {
            log.error("Session not found: {}", sessionId);
            return Result.error(e.getErrorCode(), e.getMessage());
        }

        int currentIndex = session.currentIndex();

        // Step 3: Call existing service (NO CHANGES TO BUSINESS LOGIC)
        SubmitAnswerRequest request = new SubmitAnswerRequest(sessionId, currentIndex, userAnswer);
        SubmitAnswerResponse response;
        try {
            response = sessionService.submitAnswer(request);
        } catch (BusinessException e) {
            log.error("Submit answer failed", e);
            return Result.error(e.getErrorCode(), e.getMessage());
        }

        // Step 4: Return based on output strategy
        AnswerOutputStrategy strategy = getOutputStrategy(outputMode);
        return strategy.process(response);
    }

    /**
     * Get output strategy based on mode
     */
    private AnswerOutputStrategy getOutputStrategy(String mode) {
        return "voice".equalsIgnoreCase(mode) ? voiceOutputStrategy : textOutputStrategy;
    }

    /**
     * Check if the content type is an allowed audio type
     */
    private boolean isAllowedAudioType(String contentType) {
        for (String allowedType : ALLOWED_AUDIO_TYPES) {
            if (allowedType.equalsIgnoreCase(contentType)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 生成面试报告
     */
    @GetMapping("/api/interview/sessions/{sessionId}/report")
    public Result<InterviewReportDTO> getReport(@PathVariable String sessionId) {
        log.info("生成面试报告: {}", sessionId);
        InterviewReportDTO report = sessionService.generateReport(sessionId);
        return Result.success(report);
    }
    
    /**
     * 查找未完成的面试会话
     * GET /api/interview/sessions/unfinished/{resumeId}
     */
    @GetMapping("/api/interview/sessions/unfinished/{resumeId}")
    public Result<InterviewSessionDTO> findUnfinishedSession(@PathVariable Long resumeId) {
        return Result.success(sessionService.findUnfinishedSessionOrThrow(resumeId));
    }
    
    /**
     * 暂存答案（不进入下一题）
     */
    @PutMapping("/api/interview/sessions/{sessionId}/answers")
    public Result<Void> saveAnswer(
            @PathVariable String sessionId,
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
    public Result<Void> completeInterview(@PathVariable String sessionId) {
        log.info("提前交卷: {}", sessionId);
        sessionService.completeInterview(sessionId);
        return Result.success(null);
    }
    
    /**
     * 获取面试会话详情
     * GET /api/interview/sessions/{sessionId}/details
     */
    @GetMapping("/api/interview/sessions/{sessionId}/details")
    public Result<InterviewDetailDTO> getInterviewDetail(@PathVariable String sessionId) {
        InterviewDetailDTO detail = historyService.getInterviewDetail(sessionId);
        return Result.success(detail);
    }
    
    /**
     * 导出面试报告为PDF
     */
    @GetMapping("/api/interview/sessions/{sessionId}/export")
    public ResponseEntity<byte[]> exportInterviewPdf(@PathVariable String sessionId) {
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
    public Result<Void> deleteInterview(@PathVariable String sessionId) {
        log.info("删除面试会话: {}", sessionId);
        persistenceService.deleteSessionBySessionId(sessionId);
        return Result.success(null);
    }
}
