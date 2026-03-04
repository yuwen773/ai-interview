package interview.guide.modules.audio.model;

import lombok.Data;

@Data
public class TtsRequest {
    private String text;
    private String voice = "longhua";
    private Double speed = 1.0;
    private String format = "mp3";
}
