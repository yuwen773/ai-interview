package interview.guide.modules.voiceinterview.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketSubtitleMessage {
    private String type;
    private String text;
    private Boolean isFinal;
}
