package interview.guide.modules.profile.model.dto;

public record ReviewSubmitRequest(
    Long weakPointId,
    double score
) {}