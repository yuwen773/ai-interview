package interview.guide.modules.voiceinterview.dto;

import interview.guide.common.model.AsyncTaskStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionMetaDTO {
    private Long sessionId;
    private String roleType;
    private String status;
    private String currentPhase;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer actualDuration;
    private Long messageCount;
    private AsyncTaskStatus evaluateStatus;
    private String evaluateError;
}
