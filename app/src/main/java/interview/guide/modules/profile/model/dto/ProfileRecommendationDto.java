package interview.guide.modules.profile.model.dto;

public record ProfileRecommendationDto(
    String type,
    String title,
    String reason,
    String topic,
    Integer priority
) {}
