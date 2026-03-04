package interview.guide.modules.audio.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AsrResponse {
    private String text;
}
