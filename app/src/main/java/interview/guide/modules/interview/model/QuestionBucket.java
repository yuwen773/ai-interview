package interview.guide.modules.interview.model;

import java.util.List;

/**
 * 题目规划桶
 */
public record QuestionBucket(
    InterviewQuestionDTO.QuestionType type,
    String category,
    int count,
    int priority,
    List<String> keywords
) {
    public QuestionBucket {
        keywords = keywords == null ? List.of() : List.copyOf(keywords);
    }

    public QuestionBucket withCount(int newCount) {
        return new QuestionBucket(type, category, newCount, priority, keywords);
    }
}
