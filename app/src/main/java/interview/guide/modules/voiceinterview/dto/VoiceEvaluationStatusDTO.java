package interview.guide.modules.voiceinterview.dto;

import interview.guide.common.model.AsyncTaskStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceEvaluationStatusDTO {
    private AsyncTaskStatus evaluateStatus;
    private String evaluateError;
    private VoiceEvaluationDetailDTO evaluation;
}
