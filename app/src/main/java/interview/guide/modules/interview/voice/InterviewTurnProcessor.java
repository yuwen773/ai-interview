package interview.guide.modules.interview.voice;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.SubmitAnswerRequest;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import interview.guide.modules.interview.service.InterviewSessionService;
import interview.guide.modules.interview.voice.input.CandidateInputStrategy;
import interview.guide.modules.interview.voice.model.CandidateInputMode;
import interview.guide.modules.interview.voice.model.InterviewTurnInput;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import interview.guide.modules.interview.voice.model.NormalizedAnswer;
import interview.guide.modules.interview.voice.output.InterviewerOutputStrategy;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class InterviewTurnProcessor {

    private final InterviewSessionService sessionService;
    // 启动时把策略收拢成枚举映射，运行期按 mode O(1) 查找，避免 controller 内部写分支。
    private final Map<CandidateInputMode, CandidateInputStrategy> inputStrategies;
    private final Map<InterviewerOutputMode, InterviewerOutputStrategy> outputStrategies;

    public InterviewTurnProcessor(
        InterviewSessionService sessionService,
        List<CandidateInputStrategy> inputStrategies,
        List<InterviewerOutputStrategy> outputStrategies
    ) {
        this.sessionService = sessionService;
        this.inputStrategies = toInputStrategyMap(inputStrategies);
        this.outputStrategies = toOutputStrategyMap(outputStrategies);
    }

    public InterviewTurnResponse process(InterviewTurnInput input) {
        CandidateInputStrategy inputStrategy = getInputStrategy(input.candidateInputMode());
        InterviewerOutputStrategy outputStrategy = outputStrategies.get(input.interviewerOutputMode());
        if (outputStrategy == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的输出模式: " + input.interviewerOutputMode());
        }

        // 固定一轮交互主线：输入标准化 -> 复用现有 submitAnswer -> 输出适配。
        NormalizedAnswer normalizedAnswer = inputStrategy.normalize(input);
        SubmitAnswerResponse submitAnswerResponse = sessionService.submitAnswer(
            new SubmitAnswerRequest(input.sessionId(), input.questionIndex(), normalizedAnswer.answerText())
        );
        return outputStrategy.build(submitAnswerResponse, normalizedAnswer.recognizedText());
    }

    public NormalizedAnswer recognize(InterviewTurnInput input) {
        return getInputStrategy(input.candidateInputMode()).normalize(input);
    }

    private CandidateInputStrategy getInputStrategy(CandidateInputMode inputMode) {
        CandidateInputStrategy inputStrategy = inputStrategies.get(inputMode);
        if (inputStrategy == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的回答模式: " + inputMode);
        }
        return inputStrategy;
    }

    private Map<CandidateInputMode, CandidateInputStrategy> toInputStrategyMap(List<CandidateInputStrategy> strategies) {
        Map<CandidateInputMode, CandidateInputStrategy> strategyMap = new EnumMap<>(CandidateInputMode.class);
        for (CandidateInputStrategy strategy : strategies) {
            // 后注册的同 mode 策略会覆盖前者，这里默认一个 mode 只存在一个实现。
            strategyMap.put(strategy.getMode(), strategy);
        }
        return strategyMap;
    }

    private Map<InterviewerOutputMode, InterviewerOutputStrategy> toOutputStrategyMap(List<InterviewerOutputStrategy> strategies) {
        Map<InterviewerOutputMode, InterviewerOutputStrategy> strategyMap = new EnumMap<>(InterviewerOutputMode.class);
        for (InterviewerOutputStrategy strategy : strategies) {
            strategyMap.put(strategy.getMode(), strategy);
        }
        return strategyMap;
    }
}
