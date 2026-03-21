package interview.guide.modules.audio.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * 语音能力指标记录组件
 *
 * <p>负责记录 ASR(语音识别)和 TTS(语音合成)的成功/失败指标，用于排障和基础观测。
 *
 * <p>一期采用结构化日志 + 进程内计数器的方式记录指标。这种方式无需引入额外依赖，
 * 便于快速定位问题。后续可根据需要平滑迁移到 Micrometer 等专业监控体系。
 *
 * <p>记录的指标包括：
 * <ul>
 *   <li>ASR 成功/失败次数</li>
 *   <li>TTS 成功/失败次数</li>
 *   <li>每次调用的耗时、音频格式、文件大小等详细信息</li>
 * </ul>
 *
 * @see AsrService
 * @see TtsService
 */
@Slf4j
@Component
public class VoiceMetrics {

    /**
     * ASR 识别成功计数器
     * 使用 AtomicLong 保证线程安全
     */
    private final AtomicLong asrSuccessCount = new AtomicLong();

    /**
     * ASR 识别失败计数器
     * 使用 AtomicLong 保证线程安全
     */
    private final AtomicLong asrFailureCount = new AtomicLong();

    /**
     * TTS 合成成功计数器
     * 使用 AtomicLong 保证线程安全
     */
    private final AtomicLong ttsSuccessCount = new AtomicLong();

    /**
     * TTS 合成失败计数器
     * 使用 AtomicLong 保证线程安全
     */
    private final AtomicLong ttsFailureCount = new AtomicLong();

    /**
     * 记录 ASR 识别成功的指标
     *
     * @param durationMs 识别耗时，单位毫秒
     * @param format    音频格式（如 wav、mp3 等）
     * @param fileSize  音频文件大小，单位字节
     */
    public void recordAsrSuccess(long durationMs, String format, long fileSize) {
        long success = asrSuccessCount.incrementAndGet();
        log.info("voice_metric type=asr outcome=success durationMs={} format={} fileSize={} successCount={}",
            durationMs, format, fileSize, success);
    }

    /**
     * 记录 ASR 识别失败的指标
     *
     * @param durationMs 识别耗时（到失败为止），单位毫秒
     * @param format    音频格式（如 wav、mp3 等）
     * @param fileSize  音频文件大小，单位字节
     * @param reason    失败原因描述
     */
    public void recordAsrFailure(long durationMs, String format, long fileSize, String reason) {
        long failure = asrFailureCount.incrementAndGet();
        log.warn("voice_metric type=asr outcome=failure durationMs={} format={} fileSize={} failureCount={} reason={}",
            durationMs, format, fileSize, failure, reason);
    }

    /**
     * 记录 TTS 合成成功的指标
     *
     * @param durationMs 合成耗时，单位毫秒
     * @param textLength 待合成的文本长度
     * @param mode      合成模式（sync=同步，stream=流式，sync_fallback=同步失败回退流式）
     * @param audioSize 合成后的音频大小，单位字节（-1 表示流式模式无法统计）
     */
    public void recordTtsSuccess(long durationMs, int textLength, String mode, int audioSize) {
        long success = ttsSuccessCount.incrementAndGet();
        log.info("voice_metric type=tts outcome=success durationMs={} textLength={} mode={} audioSize={} successCount={}",
            durationMs, textLength, mode, audioSize, success);
    }

    /**
     * 记录 TTS 合成失败的指标
     *
     * @param durationMs 合成耗时（到失败为止），单位毫秒
     * @param textLength 待合成的文本长度
     * @param mode      合成模式（sync=同步，stream=流式，sync_fallback=同步失败回退流式）
     * @param reason    失败原因描述
     */
    public void recordTtsFailure(long durationMs, int textLength, String mode, String reason) {
        long failure = ttsFailureCount.incrementAndGet();
        log.warn("voice_metric type=tts outcome=failure durationMs={} textLength={} mode={} failureCount={} reason={}",
            durationMs, textLength, mode, failure, reason);
    }
}
