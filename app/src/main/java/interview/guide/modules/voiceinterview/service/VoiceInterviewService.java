package interview.guide.modules.voiceinterview.service;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.voiceinterview.config.VoiceInterviewProperties;
import interview.guide.modules.voiceinterview.dto.CreateSessionRequest;
import interview.guide.modules.voiceinterview.dto.SessionMetaDTO;
import interview.guide.modules.voiceinterview.dto.SessionResponseDTO;
import interview.guide.modules.voiceinterview.dto.VoiceInterviewMessageDTO;
import interview.guide.modules.voiceinterview.model.VoiceInterviewMessageEntity;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionStatus;
import interview.guide.modules.voiceinterview.repository.VoiceInterviewEvaluationRepository;
import interview.guide.modules.voiceinterview.repository.VoiceInterviewMessageRepository;
import interview.guide.modules.voiceinterview.repository.VoiceInterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class VoiceInterviewService {

    private static final String SESSION_CACHE_KEY_PREFIX = "voice:interview:session:";
    private static final int CACHE_TTL_HOURS = 1;
    private static final String DEFAULT_USER_ID = "default";
    private static final String DEFAULT_SKILL_ID = "java-backend";
    private static final String DEFAULT_DIFFICULTY = "mid";

    private final VoiceInterviewSessionRepository sessionRepository;
    private final VoiceInterviewMessageRepository messageRepository;
    private final VoiceInterviewEvaluationRepository evaluationRepository;
    private final RedissonClient redissonClient;
    private final VoiceInterviewProperties properties;

    @Transactional
    public SessionResponseDTO createSession(CreateSessionRequest request) {
        String effectiveSkillId = request.getSkillId() != null ? request.getSkillId() : DEFAULT_SKILL_ID;
        String effectiveLlmProvider = (request.getLlmProvider() != null && !request.getLlmProvider().isBlank())
            ? request.getLlmProvider()
            : properties.getLlmProvider();

        VoiceInterviewSessionEntity session = VoiceInterviewSessionEntity.builder()
                .userId(DEFAULT_USER_ID)
                .roleType(effectiveSkillId)
                .skillId(effectiveSkillId)
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : DEFAULT_DIFFICULTY)
                .customJdText(request.getCustomJdText())
                .resumeId(request.getResumeId())
                .introEnabled(request.getIntroEnabled())
                .techEnabled(request.getTechEnabled())
                .projectEnabled(request.getProjectEnabled())
                .hrEnabled(request.getHrEnabled())
                .llmProvider(effectiveLlmProvider)
                .plannedDuration(request.getPlannedDuration())
                .currentPhase(determineFirstPhase(request))
                .build();

        VoiceInterviewSessionEntity saved = sessionRepository.save(session);
        cacheSession(saved);

        log.info("Created voice interview session: {} with template: {}, phase: {}",
                saved.getId(), effectiveSkillId, saved.getCurrentPhase());

        return buildSessionResponse(saved);
    }

    @Transactional
    public void endSession(String sessionId) {
        Long sessionIdLong = parseSessionId(sessionId);
        VoiceInterviewSessionEntity session = getSession(sessionIdLong);

        if (session == null) {
            log.warn("Session not found: {}", sessionId);
            return;
        }

        session.setEndTime(LocalDateTime.now());
        session.setCurrentPhase(VoiceInterviewSessionEntity.InterviewPhase.COMPLETED);
        session.setStatus(VoiceInterviewSessionStatus.COMPLETED);
        session.setActualDuration((int) Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes());
        session.setEvaluateStatus("PENDING");

        sessionRepository.save(session);
        invalidateSessionCache(session.getId());

        log.info("Ended voice interview session: {}, duration: {} minutes",
                session.getId(), session.getActualDuration());
    }

    public VoiceInterviewSessionEntity getSession(String sessionId) {
        return getSession(parseSessionId(sessionId));
    }

    public VoiceInterviewSessionEntity getSession(Long sessionId) {
        if (sessionId == null) return null;

        String cacheKey = getSessionCacheKey(sessionId);
        RBucket<VoiceInterviewSessionEntity> bucket = redissonClient.getBucket(cacheKey);
        VoiceInterviewSessionEntity cached = bucket.get();

        if (cached != null) {
            log.debug("Session {} found in cache", sessionId);
            return cached;
        }

        return sessionRepository.findById(sessionId).orElse(null);
    }

    @Transactional
    public void startPhase(String sessionId, String phaseStr) {
        Long sessionIdLong = parseSessionId(sessionId);
        VoiceInterviewSessionEntity session = getSession(sessionIdLong);

        if (session == null) {
            log.warn("Cannot start phase - session not found: {}", sessionId);
            return;
        }

        try {
            VoiceInterviewSessionEntity.InterviewPhase newPhase =
                    VoiceInterviewSessionEntity.InterviewPhase.valueOf(phaseStr.toUpperCase());
            session.setCurrentPhase(newPhase);
            sessionRepository.save(session);
            cacheSession(session);
            log.info("Session {} transitioned to phase {}", sessionId, newPhase);
        } catch (IllegalArgumentException e) {
            log.error("Invalid phase string: {}", phaseStr, e);
        }
    }

    public VoiceInterviewSessionEntity.InterviewPhase getCurrentPhase(String sessionId) {
        VoiceInterviewSessionEntity session = getSession(sessionId);
        return session != null ? session.getCurrentPhase() : null;
    }

    @Transactional
    public void saveMessage(String sessionId, String userText, String aiText) {
        Long sessionIdLong = parseSessionId(sessionId);
        VoiceInterviewSessionEntity session = getSession(sessionIdLong);

        if (session == null) {
            log.warn("Cannot save message - session not found: {}", sessionId);
            return;
        }

        VoiceInterviewMessageEntity message = VoiceInterviewMessageEntity.builder()
                .sessionId(sessionIdLong)
                .messageType("DIALOGUE")
                .phase(session.getCurrentPhase())
                .userRecognizedText(userText)
                .aiGeneratedText(aiText)
                .sequenceNum(getNextSequenceNum(sessionIdLong))
                .build();

        messageRepository.save(message);
        log.debug("Saved message for session: {}, phase: {}", sessionId, session.getCurrentPhase());
    }

    public List<VoiceInterviewMessageEntity> getConversationHistory(String sessionId) {
        Long sessionIdLong = parseSessionId(sessionId);
        return messageRepository.findBySessionIdOrderBySequenceNumAsc(sessionIdLong);
    }

    public List<VoiceInterviewMessageDTO> getConversationHistoryDTO(String sessionId) {
        return getConversationHistory(sessionId).stream()
            .map(msg -> VoiceInterviewMessageDTO.builder()
                .id(msg.getId())
                .sessionId(msg.getSessionId())
                .messageType(msg.getMessageType())
                .phase(msg.getPhase() != null ? msg.getPhase().name() : null)
                .userRecognizedText(msg.getUserRecognizedText())
                .aiGeneratedText(msg.getAiGeneratedText())
                .timestamp(msg.getTimestamp())
                .sequenceNum(msg.getSequenceNum())
                .build())
            .collect(Collectors.toList());
    }

    @Transactional
    public void pauseSession(String sessionId) {
        Long sessionIdLong = parseSessionId(sessionId);
        VoiceInterviewSessionEntity session = sessionRepository.findById(sessionIdLong)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在: " + sessionId));

        if (session.getStatus() != VoiceInterviewSessionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                "会话状态为 " + session.getStatus() + "，无法暂停");
        }

        session.setStatus(VoiceInterviewSessionStatus.PAUSED);
        session.setPausedAt(LocalDateTime.now());
        sessionRepository.save(session);
        invalidateSessionCache(sessionIdLong);
        log.info("Session {} paused", sessionId);
    }

    @Transactional
    public SessionResponseDTO resumeSession(String sessionId) {
        Long sessionIdLong = parseSessionId(sessionId);
        VoiceInterviewSessionEntity session = sessionRepository.findById(sessionIdLong)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "会话不存在: " + sessionId));

        if (session.getStatus() != VoiceInterviewSessionStatus.PAUSED) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                "会话状态为 " + session.getStatus() + "，无法恢复");
        }

        session.setStatus(VoiceInterviewSessionStatus.IN_PROGRESS);
        session.setResumedAt(LocalDateTime.now());
        VoiceInterviewSessionEntity saved = sessionRepository.save(session);
        cacheSession(saved);
        log.info("Session {} resumed", sessionId);

        return buildSessionResponse(saved);
    }

    public List<SessionMetaDTO> getAllSessions(String userId) {
        userId = userId != null ? userId : DEFAULT_USER_ID;
        List<VoiceInterviewSessionEntity> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return sessions.stream()
            .map(session -> SessionMetaDTO.builder()
                .sessionId(session.getId())
                .roleType(session.getRoleType())
                .status(session.getStatus().name())
                .currentPhase(session.getCurrentPhase().name())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .actualDuration(session.getActualDuration())
                .messageCount((long) messageRepository.findBySessionIdOrderBySequenceNumAsc(session.getId()).size())
                .evaluateStatus(session.getEvaluateStatus())
                .evaluateError(session.getEvaluateError())
                .build())
            .collect(Collectors.toList());
    }

    public SessionResponseDTO getSessionDTO(Long sessionId) {
        VoiceInterviewSessionEntity session = getSession(sessionId);
        if (session == null) return null;
        return buildSessionResponse(session);
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new BusinessException(ErrorCode.VOICE_SESSION_NOT_FOUND, "会话不存在: " + sessionId);
        }
        evaluationRepository.findBySessionId(sessionId).ifPresent(evaluationRepository::delete);
        messageRepository.findBySessionIdOrderBySequenceNumAsc(sessionId).forEach(messageRepository::delete);
        sessionRepository.deleteById(sessionId);
        log.info("Deleted voice interview session: {}", sessionId);
    }

    private VoiceInterviewSessionEntity.InterviewPhase determineFirstPhase(CreateSessionRequest request) {
        if (request.getIntroEnabled() != null && request.getIntroEnabled()) return VoiceInterviewSessionEntity.InterviewPhase.INTRO;
        if (request.getTechEnabled() != null && request.getTechEnabled()) return VoiceInterviewSessionEntity.InterviewPhase.TECH;
        if (request.getProjectEnabled() != null && request.getProjectEnabled()) return VoiceInterviewSessionEntity.InterviewPhase.PROJECT;
        if (request.getHrEnabled() != null && request.getHrEnabled()) return VoiceInterviewSessionEntity.InterviewPhase.HR;
        return VoiceInterviewSessionEntity.InterviewPhase.COMPLETED;
    }

    private SessionResponseDTO buildSessionResponse(VoiceInterviewSessionEntity session) {
        return SessionResponseDTO.builder()
                .sessionId(session.getId())
                .roleType(session.getRoleType())
                .currentPhase(session.getCurrentPhase().name())
                .status(session.getStatus().name())
                .startTime(session.getStartTime())
                .plannedDuration(session.getPlannedDuration())
                .webSocketUrl(String.format("ws://localhost:8080/ws/voice-interview/%d", session.getId()))
                .build();
    }

    private int getNextSequenceNum(Long sessionId) {
        return messageRepository.findBySessionIdOrderBySequenceNumAsc(sessionId).size() + 1;
    }

    private void cacheSession(VoiceInterviewSessionEntity session) {
        String cacheKey = getSessionCacheKey(session.getId());
        RBucket<VoiceInterviewSessionEntity> bucket = redissonClient.getBucket(cacheKey);
        bucket.set(session, Duration.ofHours(CACHE_TTL_HOURS));
    }

    private void invalidateSessionCache(Long sessionId) {
        String cacheKey = getSessionCacheKey(sessionId);
        redissonClient.getBucket(cacheKey).delete();
    }

    private String getSessionCacheKey(Long sessionId) {
        return SESSION_CACHE_KEY_PREFIX + sessionId;
    }

    private Long parseSessionId(String sessionId) {
        if (sessionId == null) return null;
        try {
            return Long.parseLong(sessionId);
        } catch (NumberFormatException e) {
            log.error("Invalid session ID format: {}", sessionId, e);
            return null;
        }
    }
}
