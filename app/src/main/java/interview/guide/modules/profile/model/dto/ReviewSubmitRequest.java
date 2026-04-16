package interview.guide.modules.profile.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 复习结果提交请求
 * 用户提交对某个弱项的复习评分，触发SM-2算法更新
 */
public record ReviewSubmitRequest(
    Long weakPointId,                  // 弱项ID
    @Min(0) @Max(10) double score      // 复习评分（0-10）
) {}