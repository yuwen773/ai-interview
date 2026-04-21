package interview.guide.modules.audio;

import interview.guide.common.result.Result;
import interview.guide.modules.audio.service.AsrService;
import interview.guide.modules.audio.service.TtsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.util.Map;

/**
 * 音频控制器
 * 提供 ASR/TTS REST API
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AudioController {

    private final AsrService asrService;
    private final TtsService ttsService;

    /**
     * 语音转文字 (ASR)
     *
     * @param file 音频文件（支持 wav/mp3/webm/ogg/opus/m4a）
     * @return 识别出的文本
     */
    @PostMapping(value = "/api/audio/asr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<String> asr(@RequestParam("file") MultipartFile file) {
        log.info("ASR request: size={}, contentType={}", file.getSize(), file.getContentType());
        String text = asrService.transcribe(file);
        return Result.success(text);
    }

    /**
     * 文字转语音 (TTS)
     *
     * @param body 请求体 { text, voice, speed }
     * @return 音频数据 (MP3)
     */
    @PostMapping(value = "/api/audio/tts", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> tts(@RequestBody Map<String, Object> body) {
        String text = (String) body.get("text");
        String voice = body.containsKey("voice") ? (String) body.get("voice") : "longhua";
        Double speed = body.containsKey("speed") ? ((Number) body.get("speed")).doubleValue() : 1.0;

        log.info("TTS request: text length={}, voice={}, speed={}", text != null ? text.length() : 0, voice, speed);

        byte[] audioData = ttsService.synthesize(text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setContentLength(audioData.length);

        return ResponseEntity.ok().headers(headers).body(audioData);
    }

    /**
     * 流式文字转语音 (TTS Stream)
     *
     * @param body 请求体 { text, voice, speed }
     * @return 音频流 (MP3)
     */
    @PostMapping(value = "/api/audio/tts/stream", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<Flux<byte[]>> ttsStream(@RequestBody Map<String, Object> body) {
        String text = (String) body.get("text");
        String voice = body.containsKey("voice") ? (String) body.get("voice") : "longhua";
        Double speed = body.containsKey("speed") ? ((Number) body.get("speed")).doubleValue() : 1.0;

        log.info("TTS stream request: text length={}, voice={}, speed={}", text != null ? text.length() : 0, voice, speed);

        Flux<byte[]> audioStream = ttsService.synthesizeStream(text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));

        return ResponseEntity.ok().headers(headers).body(audioStream);
    }
}
