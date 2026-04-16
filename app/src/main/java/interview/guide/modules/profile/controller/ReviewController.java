package interview.guide.modules.profile.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.dto.*;
import interview.guide.modules.profile.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 间隔复习控制器
 * 基于SM-2算法的弱项间隔复习管理，支持登记、查询待复习项、提交复习结果
 */
@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
@Validated
public class ReviewController {

    private final UserProfileService profileService;

    /**
     * 登记弱项到复习计划
     *
     * @param req 登记请求，包含用户ID和弱项列表
     * @return 成功登记的弱项数量
     */
    @PostMapping("/enroll")
    public Result<Integer> enroll(@RequestBody EnrollWeakPointsRequest req) {
        int count = profileService.enrollWeakPoints(req.userId(), req.items());
        return Result.success(count);
    }

    /**
     * 查询待复习的弱项列表
     *
     * @param userId 用户ID
     * @param topic  可选，按知识点主题过滤
     * @return 到期需要复习的弱项列表
     */
    @GetMapping("/due")
    public Result<List<WeakPointDto>> getDueReviews(@RequestParam String userId,
            @RequestParam(required = false) String topic) {
        var reviews = profileService.getDueReviewDtos(userId, topic);
        return Result.success(reviews);
    }

    /**
     * 提交复习结果，触发SM-2算法更新复习间隔
     *
     * @param req 复习提交请求，包含弱项ID和评分（0-10）
     * @return SM-2算法更新结果
     */
    @PostMapping("/submit")
    public Result<Sm2Result> submitReview(@RequestBody ReviewSubmitRequest req) {
        return Result.success(profileService.submitReviewAnswer(req.weakPointId(), req.score()));
    }
}
