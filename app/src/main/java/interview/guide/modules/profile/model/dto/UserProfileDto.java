package interview.guide.modules.profile.model.dto;

import java.util.List;

public record UserProfileDto(
    String userId,
    String targetRole,
    List<TopicMasteryDto> topicMasteries,
    int totalWeakPoints,
    int improvedCount,
    int dueReviewCount
) {}