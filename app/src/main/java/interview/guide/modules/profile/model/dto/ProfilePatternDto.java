package interview.guide.modules.profile.model.dto;

import java.util.List;

public record ProfilePatternDto(
    Long id,
    String patternType,
    String title,
    String summary,
    List<String> relatedTopics,
    List<Long> relatedSignalIds,
    Double confidence,
    String status,
    String lastSeen
) {}
