package interview.guide.modules.profile.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.profile.model.dto.*;
import interview.guide.modules.profile.service.ProfileExtractService;
import interview.guide.modules.profile.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户画像控制器
 * 提供用户画像查询和面试弱项/强项提取接口
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Validated
public class ProfileController {

    private final UserProfileService profileService;
    private final ProfileExtractService extractService;

    /**
     * 获取用户画像
     *
     * @param userId 用户ID
     * @return 用户画像信息，包含知识点掌握度、弱项统计、待复习数量
     */
    @GetMapping
    public Result<UserProfileDto> getProfile(@RequestParam String userId) {
        return Result.success(profileService.getProfile(userId));
    }

    /**
     * 获取用户强项列表
     *
     * @param userId 用户ID
     * @return 强项列表
     */
    @GetMapping("/strong-points")
    public Result<List<StrongPointDto>> getStrongPoints(
            @RequestParam(defaultValue = "current") String userId) {
        return Result.success(profileService.getStrongPoints(userId));
    }

    /**
     * 从面试会话中提取弱项和强项
     *
     * @param req 提取请求，包含面试会话ID
     * @return 提取结果，包含弱项和强项列表
     */
    @PostMapping("/extract")
    public Result<ProfileExtractResult> extract(@RequestBody ExtractRequest req) {
        return Result.success(extractService.extractFromSession(req.sessionId()));
    }
}
