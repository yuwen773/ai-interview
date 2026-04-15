package interview.guide.modules.profile.model.dto;

import java.util.List;

public record EnrollWeakPointsRequest(
    String userId,
    List<WeakPointEnrollItem> items
) {}
