package interview.guide.modules.interview.model;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 题目生成规划
 */
public record QuestionPlan(
    List<QuestionBucket> buckets,
    List<String> focusAreas,
    String promptHint
) {
    public QuestionPlan {
        buckets = buckets == null ? List.of() : List.copyOf(buckets);
        focusAreas = focusAreas == null ? List.of() : List.copyOf(focusAreas);
        promptHint = promptHint == null ? "" : promptHint;
    }

    public QuestionPlan trimTo(int questionCount) {
        if (questionCount <= 0 || buckets.isEmpty()) {
            return new QuestionPlan(List.of(), focusAreas, promptHint);
        }

        int total = buckets.stream().mapToInt(QuestionBucket::count).sum();
        if (total <= questionCount) {
            return this;
        }

        Map<QuestionBucket, Integer> allocated = buckets.stream()
            .collect(Collectors.toMap(bucket -> bucket, bucket -> 0, (left, right) -> left, java.util.LinkedHashMap::new));

        int remaining = questionCount;
        List<QuestionBucket> sortedBuckets = buckets.stream()
            .sorted(Comparator.comparingInt(QuestionBucket::priority))
            .toList();

        for (QuestionBucket bucket : sortedBuckets) {
            if (remaining <= 0) {
                break;
            }
            int assigned = Math.min(bucket.count(), remaining);
            allocated.put(bucket, assigned);
            remaining -= assigned;
        }

        List<QuestionBucket> trimmedBuckets = buckets.stream()
            .map(bucket -> bucket.withCount(allocated.getOrDefault(bucket, 0)))
            .filter(bucket -> bucket.count() > 0)
            .toList();

        return new QuestionPlan(trimmedBuckets, focusAreas, promptHint);
    }
}
