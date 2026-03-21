package interview.guide.modules.audio;

import interview.guide.modules.audio.model.AsrResponse;
import interview.guide.modules.audio.model.TtsRequest;
import interview.guide.modules.audio.service.AsrService;
import interview.guide.modules.audio.service.TtsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private static final Logger log = LoggerFactory.getLogger(AudioController.class);

    @Autowired
    private AsrService asrService;

    @Autowired
    private TtsService ttsService;

    @PostMapping("/asr")
    public ResponseEntity<AsrResponse> speechToText(@RequestParam("file") MultipartFile file) {
        try {
            String text = asrService.transcribe(file);
            return ResponseEntity.ok(new AsrResponse(text));
        } catch (Exception e) {
            log.error("ASR error", e);
            return ResponseEntity.internalServerError()
                .body(new AsrResponse(""));
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Audio controller works!";
    }

    @PostMapping("/tts")
    public ResponseEntity<?> textToSpeech(@RequestBody TtsRequest request) {
        try {
            log.info("TTS request: text={}", request.getText());
            byte[] audio = ttsService.synthesize(request.getText());
            log.info("TTS response: size={}", audio.length);

            if (audio.length == 0) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body("No audio generated");
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header("Content-Disposition", "attachment; filename=speech.mp3")
                .body(audio);
        } catch (Exception e) {
            log.error("TTS error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
        }
    }

    @PostMapping(value = "/tts/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamTextToSpeech(@RequestBody TtsRequest request) {
        // 将字节流转换为 Base64 字符串流
        return ttsService.synthesizeStream(
            request.getText()
        ).map(bytes -> {
            // 将每个音频块编码为 Base64
            return java.util.Base64.getEncoder().encodeToString(bytes);
        });
    }
}
