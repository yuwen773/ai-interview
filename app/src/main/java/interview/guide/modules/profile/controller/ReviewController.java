package interview.guide.modules.profile.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.dto.*;
import interview.guide.modules.profile.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final UserProfileService profileService;

    @PostMapping("/enroll")
    public Result<Integer> enroll(@RequestBody List<WeakPointEnrollItem> items, @RequestParam String userId) {
        int count = profileService.enrollWeakPoints(userId, items);
        return Result.success(count);
    }

    @GetMapping("/due")
    public Result<List<WeakPointDto>> getDueReviews(@RequestParam String userId,
            @RequestParam(required = false) String topic) {
        var reviews = profileService.getDueReviewDtos(userId, topic);
        return Result.success(reviews);
    }

    @PostMapping("/submit")
    public Result<Sm2Result> submitReview(@RequestBody ReviewSubmitRequest req) {
        return Result.success(profileService.submitReviewAnswer(req.weakPointId(), req.score()));
    }
}
