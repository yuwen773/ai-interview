package interview.guide.common.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * SSE 隐藏评估标签工具
 * <p>
 * 在 LLM 流式回复中嵌入结构化评估数据（HTML 注释格式），前端自动解析并剥离，用户不可见。
 * 标签格式: {@code <!--EVAL:{"score":8,"shouldAdvance":true,"brief":"回答很好"}-->}
 */
public final class EvalTagHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String EVAL_OPEN = "<!--EVAL:";
    private static final String EVAL_CLOSE = "-->";

    private EvalTagHelper() {}

    /**
     * 构建评估标签
     *
     * @param score          回答评分 (0-10)
     * @param shouldAdvance  是否应推进到下一阶段
     * @param brief          简短评语
     * @return 完整的评估标签字符串
     */
    public static String buildTag(int score, boolean shouldAdvance, String brief) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("score", score);
        data.put("shouldAdvance", shouldAdvance);
        data.put("brief", brief);
        return EVAL_OPEN + toJson(data) + EVAL_CLOSE;
    }

    /**
     * 构建评估标签（带阶段信息）
     */
    public static String buildTag(int score, boolean shouldAdvance, String brief, String phase) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("score", score);
        data.put("shouldAdvance", shouldAdvance);
        data.put("brief", brief);
        data.put("phase", phase);
        return EVAL_OPEN + toJson(data) + EVAL_CLOSE;
    }

    /**
     * 构建评估标签（完整参数）
     */
    public static String buildTag(int score, boolean shouldAdvance, String brief, String phase, double confidence) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("score", score);
        data.put("shouldAdvance", shouldAdvance);
        data.put("brief", brief);
        data.put("phase", phase);
        data.put("confidence", confidence);
        return EVAL_OPEN + toJson(data) + EVAL_CLOSE;
    }

    /**
     * 将评估标签追加到文本末尾（用于流式回复的最后一个 chunk）
     */
    public static String appendTag(String text, int score, boolean shouldAdvance, String brief) {
        return text + buildTag(score, shouldAdvance, brief);
    }

    private static String toJson(Map<String, Object> data) {
        try {
            return MAPPER.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize eval tag data", e);
        }
    }
}
