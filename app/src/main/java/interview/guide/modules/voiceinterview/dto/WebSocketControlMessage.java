package interview.guide.modules.voiceinterview.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketControlMessage {
    private String type;
    private String action;
    private String phase;
    private Map<String, Object> data;
}
