package interview.guide.modules.audio.strategy;

import interview.guide.common.result.Result;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import org.springframework.stereotype.Component;

/**
 * Text output strategy - returns standard JSON response
 */
@Component
public class TextOutputStrategy implements AnswerOutputStrategy {

    @Override
    public Object process(SubmitAnswerResponse response) {
        return Result.success(response);
    }
}
