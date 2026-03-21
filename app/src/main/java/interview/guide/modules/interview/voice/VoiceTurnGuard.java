package interview.guide.modules.interview.voice;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 语音轮次防重复提交守卫
 *
 * <p>用于防止同一面试题目的重复识别或重复提交，确保面试流程的正确性。
 *
 * <p>在语音面试场景中，用户可能因网络延迟、重复点击等原因触发多次相同的请求。
 * 该守卫通过幂等键（action + sessionId + questionIndex）来识别并拦截重复操作。
 *
 * <p>典型使用场景：
 * <ul>
 *   <li>防止同一题目的语音识别被重复调用</li>
 *   <li>防止同一题目的答案被重复提交</li>
 *   <li>确保同一时刻只有一个语音请求在处理中</li>
 * </ul>
 *
 * <p>使用方式：
 * <pre>{@code
 * if (voiceTurnGuard.tryAcquire("asr", sessionId, questionIndex)) {
 *     try {
 *         // 执行语音识别逻辑
 *     } finally {
 *         voiceTurnGuard.release("asr", sessionId, questionIndex);
 *     }
 * } else {
 *     throw new BusinessException("请勿重复操作");
 * }
 * }</pre>
 *
 * @see VoiceCandidateInputStrategy
 */
@Component
public class VoiceTurnGuard {

    /**
     * 正在处理中的请求键集合
     *
     * <p>使用 ConcurrentHashMap.newKeySet() 创建的并发 Set，保证线程安全。
     * 键格式为 "{action}:{sessionId}:{questionIndex}"。
     */
    private final Set<String> inFlightKeys = ConcurrentHashMap.newKeySet();

    /**
     * 尝试获取操作许可
     *
     * <p>如果指定的操作未被占用，则标记为占用状态并返回 true；
     * 如果已被占用，则返回 false，表示不应继续执行操作。
     *
     * @param action        操作类型（如 "asr" 识别、"submit" 提交）
     * @param sessionId     面试会话 ID
     * @param questionIndex 题目索引
     * @return true 如果成功获取许可，false 如果操作已在进行中
     */
    public boolean tryAcquire(String action, String sessionId, Integer questionIndex) {
        return inFlightKeys.add(buildKey(action, sessionId, questionIndex));
    }

    /**
     * 释放操作许可
     *
     * <p>操作完成后调用此方法释放许可，允许后续的相同操作继续进行。
     * 建议在 finally 块中调用以确保许可被正确释放。
     *
     * @param action        操作类型（如 "asr" 识别、"submit" 提交）
     * @param sessionId     面试会话 ID
     * @param questionIndex 题目索引
     */
    public void release(String action, String sessionId, Integer questionIndex) {
        inFlightKeys.remove(buildKey(action, sessionId, questionIndex));
    }

    /**
     * 构建幂等键
     *
     * <p>将操作类型、会话 ID 和题目索引组合成唯一的键字符串。
     *
     * @param action        操作类型
     * @param sessionId     会话 ID
     * @param questionIndex 题目索引
     * @return 格式为 "{action}:{sessionId}:{questionIndex}" 的键字符串
     */
    private String buildKey(String action, String sessionId, Integer questionIndex) {
        return action + ":" + sessionId + ":" + questionIndex;
    }
}
