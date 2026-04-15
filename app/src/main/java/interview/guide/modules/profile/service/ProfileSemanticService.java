package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 语义去重服务：基于 Embedding 向量余弦相似度判断弱项是否语义重复。
 * 使用 Spring AI EmbeddingModel（DashScope text-embedding-v3, 1024维）计算文本向量，
 * 将 embedding 存储在 user_weak_points.embedding (bytea) 列中，查询时在内存中计算余弦相似度。
 */
@Service
public class ProfileSemanticService {

    private static final Logger log = LoggerFactory.getLogger(ProfileSemanticService.class);

    static final double DEDUP_THRESHOLD = 0.80;
    static final double MATCH_THRESHOLD = 0.60;

    private final EmbeddingModel embeddingModel;
    private final UserWeakPointRepository weakPointRepo;
    private final JdbcTemplate jdbcTemplate;

    public ProfileSemanticService(EmbeddingModel embeddingModel,
                                  UserWeakPointRepository weakPointRepo,
                                  JdbcTemplate jdbcTemplate) {
        this.embeddingModel = embeddingModel;
        this.weakPointRepo = weakPointRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 查找与给定文本语义相似的已有弱项（用于去重）。
     */
    public Optional<UserWeakPointEntity> findSimilarWeakPoint(String userId, String text) {
        List<UserWeakPointEntity> candidates = weakPointRepo.findByUserIdAndIsImprovedFalse(userId);
        return findBestMatch(candidates, text, DEDUP_THRESHOLD);
    }

    /**
     * 在预取的弱项列表中查找语义相似的（避免重复查询 DB）。
     */
    public Optional<UserWeakPointEntity> findSimilarWeakPoint(List<UserWeakPointEntity> candidates, String text) {
        return findBestMatch(candidates, text, DEDUP_THRESHOLD);
    }

    /**
     * 查找与给定问题匹配的弱项（用于面试评估自动更新 SR）。
     * 阈值更宽松，且优先匹配 topic 相同的弱项。
     *
     * @param allActive 用户全部未改进弱项（由调用方预取传入，避免重复查询）
     */
    public Optional<UserWeakPointEntity> findMatchingWeakPoint(List<UserWeakPointEntity> allActive,
                                                                String text, String topic) {
        if (topic != null && !topic.isBlank()) {
            List<UserWeakPointEntity> topicFiltered = allActive.stream()
                .filter(wp -> topic.equalsIgnoreCase(wp.getTopic()))
                .toList();
            Optional<UserWeakPointEntity> match = findBestMatch(topicFiltered, text, MATCH_THRESHOLD);
            if (match.isPresent()) return match;
        }
        return findBestMatch(allActive, text, MATCH_THRESHOLD);
    }

    /**
     * 为弱项计算并存储 embedding 向量。
     */
    public void storeEmbedding(Long weakPointId, String text) {
        try {
            float[] embedding = computeEmbedding(text);
            if (embedding == null) return;
            byte[] bytes = serializeFloats(embedding);
            jdbcTemplate.update(
                "UPDATE user_weak_points SET embedding = ? WHERE id = ?",
                bytes, weakPointId);
        } catch (Exception e) {
            log.warn("Failed to store embedding for weak point {}: {}", weakPointId, e.getMessage());
        }
    }

    /**
     * 批量加载弱项的 embedding 到内存 Map。
     */
    public Map<Long, float[]> batchLoadEmbeddings(List<UserWeakPointEntity> weakPoints) {
        if (weakPoints.isEmpty()) return Map.of();

        List<Long> ids = weakPoints.stream().map(UserWeakPointEntity::getId).toList();
        String placeholders = ids.stream().map(id -> "?").collect(java.util.stream.Collectors.joining(","));

        Map<Long, float[]> result = new HashMap<>();
        try {
            jdbcTemplate.query(
                "SELECT id, embedding FROM user_weak_points WHERE id IN (" + placeholders + ")",
                rs -> {
                    Long id = rs.getLong("id");
                    byte[] bytes = rs.getBytes("embedding");
                    if (bytes != null && bytes.length > 0) {
                        result.put(id, deserializeFloats(bytes));
                    }
                },
                ids.toArray());
        } catch (Exception e) {
            log.warn("Batch embedding load failed: {}", e.getMessage());
        }
        return result;
    }

    // ========== Internal ==========

    private Optional<UserWeakPointEntity> findBestMatch(List<UserWeakPointEntity> candidates,
                                                         String queryText, double threshold) {
        if (candidates.isEmpty()) return Optional.empty();

        float[] queryEmbedding = computeEmbedding(queryText);
        if (queryEmbedding == null) return Optional.empty();

        // Batch-load all embeddings for candidates
        Map<Long, float[]> embeddingMap = batchLoadEmbeddings(candidates);

        // For any missing embeddings, compute lazily
        for (UserWeakPointEntity candidate : candidates) {
            if (!embeddingMap.containsKey(candidate.getId())) {
                float[] emb = computeEmbedding(candidate.getQuestionText());
                if (emb != null) {
                    storeEmbedding(candidate.getId(), candidate.getQuestionText());
                    embeddingMap.put(candidate.getId(), emb);
                }
            }
        }

        UserWeakPointEntity bestMatch = null;
        double bestScore = threshold;

        for (UserWeakPointEntity candidate : candidates) {
            float[] candidateEmb = embeddingMap.get(candidate.getId());
            if (candidateEmb != null) {
                double similarity = cosineSimilarity(queryEmbedding, candidateEmb);
                if (similarity > bestScore) {
                    bestScore = similarity;
                    bestMatch = candidate;
                }
            }
        }

        if (bestMatch != null) {
            log.debug("Semantic match: '{}' <-> '{}' ({})",
                queryText, bestMatch.getQuestionText(), String.format("%.4f", bestScore));
        }
        return Optional.ofNullable(bestMatch);
    }

    private float[] computeEmbedding(String text) {
        try {
            return embeddingModel.embed(text);
        } catch (Exception e) {
            log.warn("Embedding computation failed: {}", e.getMessage());
            return null;
        }
    }

    // ========== Vector Utilities ==========

    static double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) return 0.0;
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    static byte[] serializeFloats(float[] floats) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(floats.length * 4);
        DataOutputStream dos = new DataOutputStream(baos);
        try {
            for (float f : floats) {
                dos.writeFloat(f);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to serialize floats", e);
        }
        return baos.toByteArray();
    }

    static float[] deserializeFloats(byte[] bytes) {
        ByteBuffer buffer = ByteBuffer.wrap(bytes);
        float[] floats = new float[bytes.length / 4];
        for (int i = 0; i < floats.length; i++) {
            floats[i] = buffer.getFloat();
        }
        return floats;
    }
}
