package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import interview.guide.modules.profile.repository.UserWeakPointRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 知识图谱服务：基于弱项 embedding 向量余弦相似度构建知识图谱数据（节点 + 边），
 * 供前端 D3.js / force-graph 等可视化库消费。
 */
@Service
public class KnowledgeGraphService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeGraphService.class);

    private final UserWeakPointRepository weakPointRepository;
    private final EmbeddingModel embeddingModel;
    private final ProfileSemanticService semanticService;

    private static final double SIMILARITY_THRESHOLD = 0.6;

    public record GraphNode(String id, String question, double score, String topic) {}
    public record GraphLink(String source, String target, double similarity) {}
    public record GraphData(List<GraphNode> nodes, List<GraphLink> links) {}

    public KnowledgeGraphService(UserWeakPointRepository weakPointRepository,
                                 EmbeddingModel embeddingModel,
                                 ProfileSemanticService semanticService) {
        this.weakPointRepository = weakPointRepository;
        this.embeddingModel = embeddingModel;
        this.semanticService = semanticService;
    }

    /**
     * 获取指定 topic 和 userId 的知识图谱数据。
     * 节点为该用户在该 topic 下的所有弱项，边为 embedding 相似度 >= 阈值的节点对。
     * 优先从 DB 加载已存储的 embedding，缺失时才调用 API 计算。
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

        Map<Long, float[]> embeddingMap = loadOrComputeEmbeddings(points);

        List<GraphLink> links = new ArrayList<>();
        for (int i = 0; i < points.size(); i++) {
            float[] embA = embeddingMap.get(points.get(i).getId());
            if (embA == null || embA.length == 0) continue;
            for (int j = i + 1; j < points.size(); j++) {
                float[] embB = embeddingMap.get(points.get(j).getId());
                if (embB == null || embB.length == 0) continue;
                double sim = ProfileSemanticService.cosineSimilarity(embA, embB);
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

    /**
     * 优先从 DB 批量加载已存储的 embedding（零 API 调用），
     * 缺失时才调用 embeddingModel.embed() 计算。
     */
    private Map<Long, float[]> loadOrComputeEmbeddings(List<UserWeakPointEntity> points) {
        Map<Long, float[]> embeddings = new java.util.HashMap<>(semanticService.batchLoadEmbeddings(points));

        for (UserWeakPointEntity p : points) {
            if (!embeddings.containsKey(p.getId())) {
                try {
                    float[] emb = embeddingModel.embed(p.getQuestionText());
                    if (emb != null && emb.length > 0) {
                        embeddings.put(p.getId(), emb);
                    }
                } catch (Exception e) {
                    log.warn("Embedding failed for weak point {}: {}", p.getId(), e.getMessage());
                }
            }
        }
        return embeddings;
    }
}
