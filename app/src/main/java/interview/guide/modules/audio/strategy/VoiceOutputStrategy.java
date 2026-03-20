package interview.guide.modules.audio.strategy;

import interview.guide.modules.audio.service.TtsService;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Voice output strategy - returns SSE stream with TTS audio
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VoiceOutputStrategy implements AnswerOutputStrategy {

    private final TtsService ttsService;

    @Override
    public Object process(SubmitAnswerResponse response) {
        if (response.nextQuestion() == null) {
            log.warn("No next question available for voice output");
            throw new IllegalStateException("No question available for voice output");
        }

        String questionText = response.nextQuestion().question();
        log.info("Processing voice output for question: {}",
            questionText.substring(0, Math.min(50, questionText)));
        return ttsService.streamTtsSse(questionText);
    }
}
