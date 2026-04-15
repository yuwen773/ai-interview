package interview.guide.modules.profile.controller;

import interview.guide.common.result.Result;
import interview.guide.modules.profile.model.dto.*;
import interview.guide.modules.profile.service.ProfileExtractService;
import interview.guide.modules.profile.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Validated
public class ProfileController {

    private final UserProfileService profileService;
    private final ProfileExtractService extractService;

    @GetMapping
    public Result<UserProfileDto> getProfile(@RequestParam String userId) {
        return Result.success(profileService.getProfile(userId));
    }

    @GetMapping("/strong-points")
    public Result<List<StrongPointDto>> getStrongPoints(
            @RequestParam(defaultValue = "current") String userId) {
        return Result.success(profileService.getStrongPoints(userId));
    }

    @PostMapping("/extract")
    public Result<ProfileExtractResult> extract(@RequestBody ExtractRequest req) {
        return Result.success(extractService.extractFromSession(req.sessionId()));
    }
}
