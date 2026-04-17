package interview.guide.modules.voiceinterview.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponseDTO {
    private Long sessionId;
    private String roleType;
    private String currentPhase;
    private String status;
    private LocalDateTime startTime;
    private Integer plannedDuration;
    private String webSocketUrl;
}
