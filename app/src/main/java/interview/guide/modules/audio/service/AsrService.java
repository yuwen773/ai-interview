package interview.guide.modules.audio.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * 语音转文字 (ASR) 服务
 *
 * 注意：由于项目使用 Spring AI OpenAI 兼容模式，不包含 TTS/ASR 支持。
 * 当前实现返回模拟数据用于前端测试。
 *
 * TODO: 需要集成 DashScope ASR API 或其他 ASR 服务
 */
@Service
public class AsrService {

    private static final Logger log = LoggerFactory.getLogger(AsrService.class);

    /**
     * 语音转文字
     * 返回模拟文本用于测试
     */
    public String transcribe(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return "";
        }

        log.info("ASR request: file size={} bytes, contentType={}", file.getSize(), file.getContentType());

        // 暂时返回模拟文本用于测试
        // 实际生产需要调用真正的 ASR API
        return "这是模拟的语音识别结果。实际需要集成 DashScope ASR 或其他 ASR 服务。";
    }
}
