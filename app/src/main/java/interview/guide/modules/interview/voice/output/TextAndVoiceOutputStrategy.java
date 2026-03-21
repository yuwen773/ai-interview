package interview.guide.modules.interview.voice.output;

import interview.guide.modules.interview.model.SubmitAnswerResponse;
import interview.guide.modules.interview.voice.model.InterviewTurnResponse;
import interview.guide.modules.interview.voice.model.InterviewerOutputMode;
import org.springframework.stereotype.Component;

@Component
public class TextAndVoiceOutputStrategy implements InterviewerOutputStrategy {

    @Override
    public InterviewerOutputMode getMode() {
        return InterviewerOutputMode.TEXT_VOICE;
    }

    @Override
    public InterviewTurnResponse build(SubmitAnswerResponse submitAnswerResponse, String recognizedText) {
        // 一期先返回“应播放语音”的模式标记，真正的 TTS 播放在后续阶段接入。
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
