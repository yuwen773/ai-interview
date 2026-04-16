package interview.guide.modules.profile.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.profile.service.KnowledgeGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
public class KnowledgeGraphController {

    private final KnowledgeGraphService graphService;

    @GetMapping("/{topic}")
    public Result<KnowledgeGraphService.GraphData> getGraph(
            @PathVariable String topic,
            @RequestParam(defaultValue = "current") String userId) {
        return Result.success(graphService.getGraph(topic, userId));
    }
}
