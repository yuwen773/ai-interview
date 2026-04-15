package interview.guide.modules.profile.model.dto;

public record TopicMasteryDto(
    String topic,
    double score,
    int sessionCount
) {}