package interview.guide.common.controller;

import interview.guide.common.result.Result;
import interview.guide.infrastructure.redis.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskStatusController {

    private final RedisService redisService;

    @GetMapping("/{taskId}")
    public Result<Map<String, String>> getTaskStatus(@PathVariable String taskId) {
        return Result.success(redisService.getTaskStatus(taskId));
    }
}
