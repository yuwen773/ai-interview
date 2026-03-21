package interview.guide.modules.interview.voice.output;

import interview.guide.modules.interview.model.SubmitAnswerResponse;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import org.springframework.stereotype.Component;

@Component
public class TextOnlyOutputStrategy implements InterviewerOutputStrategy {

    @Override
    public InterviewerOutputMode getMode() {
        return InterviewerOutputMode.TEXT;
    }

    @Override
    public InterviewTurnResponse build(SubmitAnswerResponse submitAnswerResponse, String recognizedText) {
        // 输出策略当前只负责补齐输出模式和识别文本，不改变原有业务响应语义。
        return new InterviewTurnResponse(
            recognizedText,
            submitAnswerResponse.hasNextQuestion(),
            submitAnswerResponse.nextQuestion(),
            submitAnswerResponse.currentIndex(),
            submitAnswerResponse.totalQuestions(),
            getMode()
        );
    }
}
