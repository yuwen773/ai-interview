package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 知识图谱服务：基于弱项 embedding 向量余弦相似度构建知识图谱数据（节点 + 边），
 * 供前端 D3.js / force-graph 等可视化库消费。
 */
@Service
public class KnowledgeGraphService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeGraphService.class);

    private final UserWeakPointRepository weakPointRepository;
    private final EmbeddingModel embeddingModel;

    private static final double SIMILARITY_THRESHOLD = 0.6;

    public record GraphNode(String id, String question, double score, String topic) {}
    public record GraphLink(String source, String target, double similarity) {}
    public record GraphData(List<GraphNode> nodes, List<GraphLink> links) {}

    public KnowledgeGraphService(UserWeakPointRepository weakPointRepository,
                                 EmbeddingModel embeddingModel) {
        this.weakPointRepository = weakPointRepository;
        this.embeddingModel = embeddingModel;
    }

    /**
     * 获取指定 topic 和 userId 的知识图谱数据。
     * 节点为该用户在该 topic 下的所有弱项，边为 embedding 相似度 >= 阈值的节点对。
     */
    public GraphData getGraph(String topic, String userId) {
        List<UserWeakPointEntity> points = weakPointRepository
            .findByTopicAndUserIdOrderByScoreAsc(topic, userId);

        List<GraphNode> nodes = points.stream()
            .map(p -> new GraphNode(
                String.valueOf(p.getId()),
                p.getQuestionText(),
                p.getScore() != null ? p.getScore().doubleValue() : 0,
                p.getTopic()))
            .toList();

        List<float[]> embeddings = points.stream()
            .map(p -> {
                try {
                    return embeddingModel.embed(p.getQuestionText());
                } catch (Exception e) {
                    log.warn("Embedding failed for weak point {}: {}", p.getId(), e.getMessage());
                    return new float[0];
                }
            })
            .toList();

        List<GraphLink> links = new ArrayList<>();
        for (int i = 0; i < embeddings.size(); i++) {
            for (int j = i + 1; j < embeddings.size(); j++) {
                if (embeddings.get(i).length == 0 || embeddings.get(j).length == 0) continue;
                double sim = cosineSimilarity(embeddings.get(i), embeddings.get(j));
                if (sim >= SIMILARITY_THRESHOLD) {
                    links.add(new GraphLink(
                        String.valueOf(points.get(i).getId()),
                        String.valueOf(points.get(j).getId()),
                        Math.round(sim * 100.0) / 100.0));
                }
            }
        }

        return new GraphData(nodes, links);
    }

    private double cosineSimilarity(float[] a, float[] b) {
        double dot = 0, normA = 0, normB = 0;
        int len = Math.min(a.length, b.length);
        for (int i = 0; i < len; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return (normA == 0 || normB == 0) ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
