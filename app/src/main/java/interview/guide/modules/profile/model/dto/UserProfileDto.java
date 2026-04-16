package interview.guide.modules.profile.model.dto;

import java.util.List;

/**
 * 用户画像DTO
 * 返回用户的完整画像概览，包含知识点掌握度、弱项统计和待复习数量
 */
public record UserProfileDto(
    String userId,                   // 用户ID
    String targetRole,               // 目标岗位角色
    List<TopicMasteryDto> topicMasteries, // 各知识点掌握度
    int totalWeakPoints,             // 弱项总数
    int improvedCount,               // 已改善数量
    int dueReviewCount               // 待复习数量
) {}