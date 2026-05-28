package interview.guide.modules.profile.model.dto;

import java.util.List;
import java.util.Map;

public record BehaviorSignalDto(
    Long id,
    String namespace,
    String signalKey,
    String polarity,
    String statement,
    List<Map<String, Object>> evidence,
    Integer timesSeen,
    String status,
    String lastSeen
) {}
