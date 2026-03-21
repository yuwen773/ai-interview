package interview.guide.modules.interview.model;

import java.util.List;

/**
 * 岗位信息 DTO
 */
public record JobRoleDTO(
    String code,
    String label,
    String description,
    List<String> techKeywords
) {
    public static JobRoleDTO from(JobRole jobRole) {
        return new JobRoleDTO(
            jobRole.getCode(),
            jobRole.getLabel(),
            jobRole.getDescription(),
            jobRole.getTechKeywords()
        );
    }
}
