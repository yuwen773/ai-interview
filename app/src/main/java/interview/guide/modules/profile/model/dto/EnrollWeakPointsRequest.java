package interview.guide.modules.profile.model.dto;

import java.util.List;

/**
 * 批量登记弱项请求
 */
public record EnrollWeakPointsRequest(
    String userId,                     // 用户ID
    List<WeakPointEnrollItem> items    // 弱项列表
) {}
