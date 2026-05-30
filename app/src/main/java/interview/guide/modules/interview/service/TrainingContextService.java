package interview.guide.modules.interview.service;

import interview.guide.modules.interview.model.JobRole;
import interview.guide.modules.interview.model.TrainingContext;
import interview.guide.modules.profile.entity.UserStrongPointEntity;
import interview.guide.modules.profile.model.WeakPointStatus;
import interview.guide.modules.profile.model.dto.BehaviorSignalDto;
import interview.guide.modules.profile.model.dto.ProfilePatternDto;
import interview.guide.modules.profile.model.dto.TopicMasteryDto;
import interview.guide.modules.profile.model.dto.WeakPointDto;
import interview.guide.modules.profile.repository.UserStrongPointRepository;
import interview.guide.modules.profile.service.BehaviorSignalService;
import interview.guide.modules.profile.service.ProfileConsolidationService;
import interview.guide.modules.profile.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingContextService {

    private final UserProfileService profileService;
    private final BehaviorSignalService behaviorSignalService;
    private final ProfileConsolidationService consolidationService;
    private final UserStrongPointRepository strongPointRepository;

    public TrainingContext buildForInterview(String userId, JobRole jobRole, Long resumeId) {
        try {
            List<String> weakLines = profileService.getWeakPointDtos(userId, WeakPointStatus.ACTIVE, null).stream()
                .limit(5)
                .map(this::weakPointLine)
                .toList();
            List<String> lowMasteryLines = profileService.getProfile(userId).topicMasteries().stream()
                .filter(item -> item.score() < 60)
                .sorted(Comparator.comparingDouble(TopicMasteryDto::score))
                .limit(3)
                .map(item -> "- [掌握度] " + sanitizeForPrompt(item.topic()) + ": " + item.score() + "/100")
                .toList();
            List<String> signalLines = behaviorSignalService.getSignals(userId, null, null).stream()
                .filter(this::isCurrentBehaviorSignal)
                .limit(3)
                .map(this::behaviorSignalLine)
                .toList();
            List<String> patternLines = consolidationService.getPatterns(userId, "ACTIVE").stream()
                .limit(2)
                .map(this::patternLine)
                .toList();
            List<String> strongLines = strongPointRepository.findByUserId(userId).stream()
                .limit(2)
                .map(this::strongPointLine)
                .toList();
            return new TrainingContext(weakLines, lowMasteryLines, signalLines, patternLines, strongLines);
        } catch (Exception e) {
            log.warn("Build training context failed: {}", e.getMessage());
            return TrainingContext.empty();
        }
    }

    private String weakPointLine(WeakPointDto weakPoint) {
        return "- [弱项] " + sanitizeForPrompt(weakPoint.topic()) + ": " + sanitizeForPrompt(weakPoint.questionText());
    }

    private String behaviorSignalLine(BehaviorSignalDto signal) {
        return "- [表现] " + sanitizeForPrompt(signal.signalKey()) + ": " + sanitizeForPrompt(signal.statement());
    }

    private String patternLine(ProfilePatternDto pattern) {
        return "- [长期模式] " + sanitizeForPrompt(pattern.title()) + ": " + sanitizeForPrompt(pattern.summary());
    }

    private String strongPointLine(UserStrongPointEntity strongPoint) {
        return "- [强项] " + sanitizeForPrompt(strongPoint.getTopic()) + ": " + sanitizeForPrompt(strongPoint.getDescription());
    }

    private boolean isCurrentBehaviorSignal(BehaviorSignalDto signal) {
        return ("ACTIVE".equals(signal.status()) && "NEGATIVE".equals(signal.polarity()))
            || "IMPROVING".equals(signal.status());
    }

    private String sanitizeForPrompt(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = value.replaceAll("[\\r\\n]+", " ").trim();
        if (sanitized.length() > 500) {
            return sanitized.substring(0, 500) + "...";
        }
        return sanitized;
    }
}
