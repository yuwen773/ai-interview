package interview.guide.modules.voiceinterview.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {
    private String roleType;
    private String skillId;
    private String difficulty;
    private String customJdText;
    private Long resumeId;

    @Builder.Default
    private Boolean introEnabled = false;
    @Builder.Default
    private Boolean techEnabled = true;
    @Builder.Default
    private Boolean projectEnabled = true;
    @Builder.Default
    private Boolean hrEnabled = true;
    @Builder.Default
    private Integer plannedDuration = 30;

    @Builder.Default
    private String llmProvider = "dashscope";
}
