package interview.guide.modules.profile.model.dto;

public record StrongPointDto(
    Long id,
    String topic,
    String description,
    String source,
    Long sessionId,
    String firstSeen
) {}
