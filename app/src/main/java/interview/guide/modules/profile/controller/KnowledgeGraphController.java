package interview.guide.modules.profile.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.profile.service.KnowledgeGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 知识图谱控制器
 * 基于用户弱项构建知识点关联图谱，用于前端力导向图可视化
 */
@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
public class KnowledgeGraphController {

    private final KnowledgeGraphService graphService;

    /**
     * 获取指定主题的知识图谱数据
     *
     * @param topic  知识主题
     * @param userId 用户ID
     * @return 图谱数据，包含节点和边
     */
    @GetMapping("/{topic}")
    public Result<KnowledgeGraphService.GraphData> getGraph(
            @PathVariable String topic,
            @RequestParam(defaultValue = "0") String userId) {
        return Result.success(graphService.getGraph(topic, userId));
    }
}
