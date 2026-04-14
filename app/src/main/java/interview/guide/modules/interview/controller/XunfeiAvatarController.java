package interview.guide.modules.interview.controller;

import interview.guide.modules.interview.config.XunfeiAvatarProperties;
import interview.guide.modules.interview.service.XunfeiAvatarService;
import interview.guide.modules.interview.service.XunfeiAvatarService.XunfeiStreamInfo;
import interview.guide.common.result.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 讯飞虚拟人接口
 */
@Slf4j
@RestController
@RequestMapping("/api/xunfei/avatar")
@RequiredArgsConstructor
public class XunfeiAvatarController {

    private final XunfeiAvatarService avatarService;
    private final XunfeiAvatarProperties properties;

    /**
     * 检查讯飞虚拟人是否启用
     */
    @GetMapping("/enabled")
    public Result<Boolean> isEnabled() {
        return Result.success(properties.isEnabled());
    }

    /**
     * 创建会话，获取视频流地址
     */
    @PostMapping("/session")
    public Result<XunfeiStreamInfo> createSession(@RequestBody Map<String, String> request) {
        if (!properties.isEnabled()) {
            return Result.error("讯飞虚拟人未启用");
        }

        String interviewSessionId = request.get("interviewSessionId");
        if (interviewSessionId == null || interviewSessionId.isBlank()) {
            return Result.error("interviewSessionId 不能为空");
        }

        try {
            XunfeiStreamInfo info = avatarService.createSession(interviewSessionId);
            return Result.success(info);
        } catch (Exception e) {
            log.error("Failed to create avatar session", e);
            return Result.error("创建会话失败: " + e.getMessage());
        }
    }

    /**
     * 销毁会话
     */
    @DeleteMapping("/session")
    public Result<Void> destroySession(@RequestBody Map<String, String> request) {
        String interviewSessionId = request.get("interviewSessionId");
        if (interviewSessionId == null || interviewSessionId.isBlank()) {
            return Result.error("interviewSessionId 不能为空");
        }

        try {
            avatarService.destroySession(interviewSessionId);
            return Result.success();
        } catch (Exception e) {
            log.error("Failed to destroy avatar session", e);
            return Result.error("销毁会话失败: " + e.getMessage());
        }
    }

    /**
     * 发送问题
     */
    @PostMapping("/question")
    public Result<Void> sendQuestion(@RequestBody Map<String, String> request) {
        String interviewSessionId = request.get("interviewSessionId");
        String question = request.get("question");

        if (interviewSessionId == null || interviewSessionId.isBlank()) {
            return Result.error("interviewSessionId 不能为空");
        }
        if (question == null || question.isBlank()) {
            return Result.error("问题内容不能为空");
        }

        try {
            avatarService.sendQuestion(interviewSessionId, question);
            return Result.success();
        } catch (Exception e) {
            log.error("Failed to send question", e);
            return Result.error("发送问题失败: " + e.getMessage());
        }
    }

    /**
     * 停止播报
     */
    @PostMapping("/stop")
    public Result<Void> stopSpeaking(@RequestBody Map<String, String> request) {
        String interviewSessionId = request.get("interviewSessionId");
        if (interviewSessionId == null || interviewSessionId.isBlank()) {
            return Result.error("interviewSessionId 不能为空");
        }

        try {
            avatarService.stopSpeaking(interviewSessionId);
            return Result.success();
        } catch (Exception e) {
            log.error("Failed to stop speaking", e);
            return Result.error("停止播报失败: " + e.getMessage());
        }
    }
}
