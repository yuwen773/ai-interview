package interview.guide.modules.audio.adapter;

import interview.guide.modules.audio.service.AsrService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@RequiredArgsConstructor
public class DefaultAsrAdapter implements AsrAdapter {

    // 通过 Adapter 隔离第三方 ASR 服务，后续替换供应商时上层无需改动。
    private final AsrService asrService;

    @Override
    public String transcribe(MultipartFile file) {
        return asrService.transcribe(file);
    }
}
