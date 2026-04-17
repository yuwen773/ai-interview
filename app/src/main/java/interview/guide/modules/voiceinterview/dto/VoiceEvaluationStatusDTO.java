package interview.guide.modules.voiceinterview.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceEvaluationStatusDTO {
    private String evaluateStatus;
    private String evaluateError;
    private VoiceEvaluationDetailDTO evaluation;
}
