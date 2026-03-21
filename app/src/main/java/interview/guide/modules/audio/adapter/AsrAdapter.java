package interview.guide.modules.audio.adapter;

import org.springframework.web.multipart.MultipartFile;

/**
 * 语音识别适配层接口。
 *
 * 业务层只依赖这个抽象，不直接感知具体的 ASR 服务实现。
 */
public interface AsrAdapter {

    String transcribe(MultipartFile file);
}
