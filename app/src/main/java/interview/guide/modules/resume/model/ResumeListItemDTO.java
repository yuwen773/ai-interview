package interview.guide.modules.resume.model;

import java.time.LocalDateTime;

/**
 * 简历列表项DTO
 */
public record ResumeListItemDTO(
    Long id,
    String filename,
    Long fileSize,
    LocalDateTime uploadedAt,
    Integer accessCount,
    Integer latestScore,
    LocalDateTime lastAnalyzedAt,
    Integer interviewCount,
    /**
     * 对象存储里的相对 key，非空即表示文件存在。
     * 前端用它控制「下载」按钮是否出现，实际下载仍走后端 /api/resumes/{id}/download。
     */
    String storageKey
) {}

