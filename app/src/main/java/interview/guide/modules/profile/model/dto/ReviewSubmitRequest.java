package interview.guide.modules.profile.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReviewSubmitRequest(
    Long weakPointId,
    @Min(0) @Max(10) double score
) {}