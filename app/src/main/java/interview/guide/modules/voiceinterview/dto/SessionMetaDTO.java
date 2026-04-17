package interview.guide.modules.voiceinterview.dto;

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
    private String evaluateStatus;
    private String evaluateError;
}
