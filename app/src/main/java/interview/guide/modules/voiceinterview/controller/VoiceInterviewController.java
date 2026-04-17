package interview.guide.modules.voiceinterview.controller;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.common.result.Result;
import interview.guide.modules.voiceinterview.dto.*;
import interview.guide.modules.voiceinterview.listener.VoiceEvaluateStreamProducer;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.guide.modules.voiceinterview.service.VoiceInterviewEvaluationService;
import interview.guide.modules.voiceinterview.service.VoiceInterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voice-interview")
@RequiredArgsConstructor
public class VoiceInterviewController {

    private final VoiceInterviewService voiceService;
    private final VoiceInterviewEvaluationService evaluationService;
    private final VoiceEvaluateStreamProducer evaluationProducer;

    @PostMapping("/sessions")
    public Result<SessionResponseDTO> createSession(@RequestBody CreateSessionRequest request) {
        return Result.success(voiceService.createSession(request));
    }

    @GetMapping("/sessions/{id}")
    public Result<SessionResponseDTO> getSession(@PathVariable("id") Long id) {
        SessionResponseDTO session = voiceService.getSessionDTO(id);
        if (session == null) {
            throw new BusinessException(ErrorCode.VOICE_SESSION_NOT_FOUND, "会话不存在: " + id);
        }
        return Result.success(session);
    }

    @PostMapping("/sessions/{id}/end")
    public Result<Void> endSession(@PathVariable("id") Long id) {
        voiceService.endSession(id.toString());
        return Result.success(null);
    }

    @PutMapping("/sessions/{id}/pause")
    public Result<Void> pauseSession(@PathVariable("id") Long id) {
        voiceService.pauseSession(id.toString());
        return Result.success(null);
    }

    @PutMapping("/sessions/{id}/resume")
    public Result<SessionResponseDTO> resumeSession(@PathVariable("id") Long id) {
        return Result.success(voiceService.resumeSession(id.toString()));
    }

    @GetMapping("/sessions")
    public Result<List<SessionMetaDTO>> getAllSessions(
            @RequestParam(required = false, defaultValue = "default") String userId) {
        return Result.success(voiceService.getAllSessions(userId));
    }

    @DeleteMapping("/sessions/{id}")
    public Result<Void> deleteSession(@PathVariable("id") Long id) {
        voiceService.deleteSession(id);
        return Result.success(null);
    }

    @GetMapping("/sessions/{id}/messages")
    public Result<List<VoiceInterviewMessageDTO>> getMessages(@PathVariable("id") Long id) {
        return Result.success(voiceService.getConversationHistoryDTO(id.toString()));
    }

    @GetMapping("/sessions/{id}/evaluation")
    public Result<VoiceEvaluationStatusDTO> getEvaluation(@PathVariable("id") Long id) {
        VoiceInterviewSessionEntity session = voiceService.getSession(id);
        if (session == null) {
            throw new BusinessException(ErrorCode.VOICE_SESSION_NOT_FOUND, "会话不存在: " + id);
        }
        VoiceEvaluationStatusDTO status = VoiceEvaluationStatusDTO.builder()
            .evaluateStatus(session.getEvaluateStatus())
            .evaluateError(session.getEvaluateError())
            .build();
        return Result.success(status);
    }

    @PostMapping("/sessions/{id}/evaluation")
    public Result<Void> triggerEvaluation(@PathVariable("id") Long id) {
        evaluationProducer.sendEvaluateTask(id.toString());
        return Result.success(null);
    }
}