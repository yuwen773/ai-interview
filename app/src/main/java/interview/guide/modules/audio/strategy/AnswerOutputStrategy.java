package interview.guide.modules.audio.strategy;

import interview.guide.modules.interview.model.SubmitAnswerResponse;

/**
 * Strategy interface for different answer output formats
 */
public interface AnswerOutputStrategy {
    /**
     * Process the answer response and return in the appropriate format
     * @param response The answer response from interview service
     * @return Object (can be Result, SseEmitter, or other types)
     */
    Object process(SubmitAnswerResponse response);
}
