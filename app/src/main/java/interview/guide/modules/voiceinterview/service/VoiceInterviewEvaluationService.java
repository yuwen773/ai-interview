package interview.guide.modules.voiceinterview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.model.InterviewReportDTO;
import interview.guide.modules.interview.service.AnswerEvaluationService;
import interview.guide.modules.voiceinterview.dto.VoiceEvaluationDetailDTO;
import interview.guide.modules.voiceinterview.dto.VoiceEvaluationDetailDTO.AnswerDetail;
import interview.guide.modules.voiceinterview.model.VoiceInterviewEvaluationEntity;
import interview.guide.modules.voiceinterview.model.VoiceInterviewMessageEntity;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.guide.modules.voiceinterview.repository.VoiceInterviewEvaluationRepository;
import interview.guide.modules.voiceinterview.repository.VoiceInterviewMessageRepository;
import interview.guide.modules.voiceinterview.repository.VoiceInterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class VoiceInterviewEvaluationService {

    private final VoiceInterviewEvaluationRepository evaluationRepository;
    private final VoiceInterviewMessageRepository messageRepository;
    private final VoiceInterviewSessionRepository sessionRepository;
    private final AnswerEvaluationService answerEvaluationService;
    private final ChatClient.Builder chatClientBuilder;
    private final ObjectMapper objectMapper;

    public void generateEvaluation(Long sessionId) {
        try {
            log.info("开始生成语音面试评估: sessionId={}", sessionId);

            VoiceInterviewSessionEntity session = getSession(sessionId);
            List<VoiceInterviewMessageEntity> messages = messageRepository
                .findBySessionIdOrderBySequenceNumAsc(sessionId);

            if (messages.isEmpty()) {
                log.warn("语音面试会话无对话记录，生成空评估结果: sessionId={}", sessionId);
                saveEmptyEvaluationTransactional(sessionId, session);
                return;
            }

            List<VoiceInterviewMessageEntity> validMessages = messages.stream()
                .filter(m -> (m.getAiGeneratedText() != null && !m.getAiGeneratedText().isBlank()) ||
                             (m.getUserRecognizedText() != null && !m.getUserRecognizedText().isBlank()))
                .collect(Collectors.toList());

            if (validMessages.isEmpty()) {
                saveEmptyEvaluationTransactional(sessionId, session);
                return;
            }

            ChatClient chatClient = chatClientBuilder.build();

            InterviewReportDTO report = answerEvaluationService.evaluateInterview(
                String.valueOf(sessionId),
                null,
                buildInterviewQuestions(validMessages)
            );

            VoiceEvaluationDetailDTO evaluation = convertToDetailDTO(report, sessionId);
            saveEvaluationDTO(sessionId, session, evaluation);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("生成语音面试评估失败: sessionId={}", sessionId, e);
            throw new BusinessException(ErrorCode.VOICE_EVALUATION_FAILED,
                "生成评估失败: " + e.getMessage());
        }
    }

    public VoiceEvaluationDetailDTO getEvaluation(Long sessionId) {
        VoiceInterviewEvaluationEntity evaluation = evaluationRepository.findBySessionId(sessionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VOICE_EVALUATION_NOT_FOUND,
                "评估结果不存在: " + sessionId));

        return buildDetailDTO(evaluation);
    }

    private List<InterviewQuestionDTO> buildInterviewQuestions(
            List<VoiceInterviewMessageEntity> messages) {
        List<InterviewQuestionDTO> questions = new ArrayList<>();
        int index = 0;
        for (VoiceInterviewMessageEntity msg : messages) {
            String aiText = msg.getAiGeneratedText();
            String userText = msg.getUserRecognizedText();
            questions.add(new InterviewQuestionDTO(
                index,
                aiText != null ? aiText.trim() : "",
                null,
                inferCategory(aiText),
                userText != null ? userText.trim() : null,
                null,
                null,
                false,
                null
            ));
            index++;
        }
        return questions;
    }

    private String inferCategory(String aiText) {
        if (aiText == null) return "综合";
        if (aiText.contains("项目") || aiText.contains("实习") || aiText.contains("工作经历")) return "项目深挖";
        if (aiText.contains("自我介绍") || aiText.contains("介绍一下自己")) return "自我介绍";
        if (aiText.contains("职业规划") || aiText.contains("为什么") || aiText.contains("优缺点")) return "HR问题";
        return "技术问题";
    }

    private VoiceEvaluationDetailDTO convertToDetailDTO(InterviewReportDTO report, Long sessionId) {
        List<AnswerDetail> answers = new ArrayList<>();
        if (report.questionDetails() != null) {
            for (InterviewReportDTO.QuestionEvaluation qe : report.questionDetails()) {
                answers.add(AnswerDetail.builder()
                    .questionIndex(qe.questionIndex())
                    .question(qe.question())
                    .category(qe.category())
                    .userAnswer(qe.userAnswer())
                    .score(qe.score())
                    .feedback(qe.feedback())
                    .referenceAnswer("")
                    .keyPoints(List.of())
                    .build());
            }
        }

        return VoiceEvaluationDetailDTO.builder()
            .sessionId(sessionId)
            .totalQuestions(report.totalQuestions())
            .overallScore(report.overallScore())
            .overallFeedback(report.overallFeedback())
            .strengths(report.strengths() != null ? report.strengths() : List.of())
            .improvements(report.improvements() != null ? report.improvements() : List.of())
            .answers(answers)
            .build();
    }

    @Transactional
    public void saveEvaluationDTO(Long sessionId, VoiceInterviewSessionEntity session,
                                  VoiceEvaluationDetailDTO evaluation) {
        try {
            List<Map<String, Object>> questionItems = new ArrayList<>();
            for (AnswerDetail answer : evaluation.getAnswers()) {
                questionItems.add(Map.of(
                    "questionIndex", answer.getQuestionIndex(),
                    "question", answer.getQuestion() != null ? answer.getQuestion() : "",
                    "category", answer.getCategory() != null ? answer.getCategory() : "综合",
                    "userAnswer", answer.getUserAnswer() != null ? answer.getUserAnswer() : "",
                    "score", answer.getScore(),
                    "feedback", answer.getFeedback() != null ? answer.getFeedback() : ""
                ));
            }

            VoiceInterviewEvaluationEntity entity = VoiceInterviewEvaluationEntity.builder()
                .sessionId(sessionId)
                .overallScore(evaluation.getOverallScore())
                .overallFeedback(evaluation.getOverallFeedback())
                .questionEvaluationsJson(objectMapper.writeValueAsString(questionItems))
                .strengthsJson(objectMapper.writeValueAsString(evaluation.getStrengths()))
                .improvementsJson(objectMapper.writeValueAsString(evaluation.getImprovements()))
                .referenceAnswersJson("[]")
                .interviewerRole(session.getRoleType())
                .interviewDate(session.getStartTime())
                .build();

            evaluationRepository.save(entity);
            log.info("评估结果已保存: sessionId={}, score={}", sessionId, entity.getOverallScore());
        } catch (Exception e) {
            log.error("保存评估结果失败: sessionId={}", sessionId, e);
            throw new BusinessException(ErrorCode.VOICE_EVALUATION_FAILED,
                "保存评估失败: " + e.getMessage());
        }
    }

    @Transactional
    public void saveEmptyEvaluationTransactional(Long sessionId, VoiceInterviewSessionEntity session) {
        try {
            VoiceInterviewEvaluationEntity entity = evaluationRepository.findBySessionId(sessionId)
                .orElseGet(() -> VoiceInterviewEvaluationEntity.builder().sessionId(sessionId).build());

            entity.setOverallScore(0);
            entity.setOverallFeedback("本次语音面试未形成有效对话记录，暂无可评估内容。");
            entity.setQuestionEvaluationsJson("[]");
            entity.setStrengthsJson("[]");
            entity.setImprovementsJson("[\"请先完成至少一轮有效问答后再生成评估。\"]");
            entity.setReferenceAnswersJson("[]");
            entity.setInterviewerRole(session.getRoleType());
            entity.setInterviewDate(session.getStartTime());

            evaluationRepository.save(entity);
            log.info("空评估结果已保存: sessionId={}", sessionId);
        } catch (Exception e) {
            log.error("保存空评估结果失败: sessionId={}", sessionId, e);
            throw new BusinessException(ErrorCode.VOICE_EVALUATION_FAILED,
                "保存空评估失败: " + e.getMessage());
        }
    }

    private VoiceEvaluationDetailDTO buildDetailDTO(VoiceInterviewEvaluationEntity entity) {
        try {
            List<Map> questionItems = objectMapper.readValue(
                entity.getQuestionEvaluationsJson(),
                new TypeReference<List<Map>>() {});

            List<String> strengths = objectMapper.readValue(
                entity.getStrengthsJson(),
                new TypeReference<List<String>>() {});

            List<String> improvements = objectMapper.readValue(
                entity.getImprovementsJson(),
                new TypeReference<List<String>>() {});

            List<AnswerDetail> answers = new ArrayList<>();
            for (Map q : questionItems) {
                answers.add(AnswerDetail.builder()
                    .questionIndex(((Number) q.get("questionIndex")).intValue())
                    .question((String) q.get("question"))
                    .category((String) q.get("category"))
                    .userAnswer((String) q.get("userAnswer"))
                    .score(((Number) q.get("score")).intValue())
                    .feedback((String) q.get("feedback"))
                    .referenceAnswer("")
                    .keyPoints(List.of())
                    .build());
            }

            return VoiceEvaluationDetailDTO.builder()
                .sessionId(entity.getSessionId())
                .totalQuestions(answers.size())
                .overallScore(entity.getOverallScore())
                .overallFeedback(entity.getOverallFeedback())
                .strengths(strengths)
                .improvements(improvements)
                .answers(answers)
                .build();

        } catch (Exception e) {
            log.error("构建评估详情失败: sessionId={}", entity.getSessionId(), e);
            throw new BusinessException(ErrorCode.VOICE_EVALUATION_FAILED,
                "构建评估结果失败: " + e.getMessage());
        }
    }

    private VoiceInterviewSessionEntity getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.VOICE_SESSION_NOT_FOUND,
                "语音面试会话不存在: " + sessionId));
    }
}
