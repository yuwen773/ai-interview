package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.UserTopicMasteryEntity;
import interview.guide.modules.profile.model.WeakPointStatus;
import interview.guide.modules.profile.model.dto.BehaviorSignalDto;
import interview.guide.modules.profile.model.dto.ProfilePatternDto;
import interview.guide.modules.profile.model.dto.ProfileRecommendationDto;
import interview.guide.modules.profile.model.dto.WeakPointDto;
import interview.guide.modules.profile.repository.UserTopicMasteryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
public class ProfileRecommendationService {

    private final UserProfileService profileService;
    private final UserTopicMasteryRepository masteryRepository;
    private final BehaviorSignalService behaviorSignalService;
    private final ProfileConsolidationService consolidationService;

    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public List<ProfileRecommendationDto> getRecommendations(String userId) {
        CompletableFuture<List<ProfileRecommendationDto>> weakFuture = CompletableFuture.supplyAsync(() -> {
            List<ProfileRecommendationDto> cards = new ArrayList<>();
            for (WeakPointDto weakPoint : profileService.getWeakPointDtos(userId, WeakPointStatus.DUE, null)) {
                cards.add(new ProfileRecommendationDto(
                    "WEAK_POINT_REVIEW",
                    "复习弱项：" + weakPoint.topic(),
                    weakPoint.questionText(),
                    weakPoint.topic(),
                    10
                ));
            }
            return cards;
        }, executor);

        CompletableFuture<List<ProfileRecommendationDto>> signalFuture = CompletableFuture.supplyAsync(() -> {
            List<ProfileRecommendationDto> cards = new ArrayList<>();
            for (BehaviorSignalDto signal : behaviorSignalService.getSignals(userId, null, null)) {
                if (isCurrentBehaviorSignal(signal)) {
                    cards.add(new ProfileRecommendationDto(
                        "BEHAVIOR_PRACTICE",
                        "练习表现：" + signal.signalKey(),
                        signal.statement(),
                        null,
                        20
                    ));
                }
            }
            return cards;
        }, executor);

        CompletableFuture<List<ProfileRecommendationDto>> patternFuture = CompletableFuture.supplyAsync(() -> {
            List<ProfileRecommendationDto> cards = new ArrayList<>();
            for (ProfilePatternDto pattern : consolidationService.getPatterns(userId, "ACTIVE")) {
                cards.add(new ProfileRecommendationDto(
                    "PATTERN_FOCUS",
                    pattern.title(),
                    pattern.summary(),
                    firstTopic(pattern.relatedTopics()),
                    30
                ));
            }
            return cards;
        }, executor);

        CompletableFuture<List<ProfileRecommendationDto>> masteryFuture = CompletableFuture.supplyAsync(() -> {
            List<ProfileRecommendationDto> cards = new ArrayList<>();
            for (UserTopicMasteryEntity mastery : masteryRepository.findByUserId(userId)) {
                if (mastery.getScore() != null && mastery.getScore().doubleValue() < 60) {
                    cards.add(new ProfileRecommendationDto(
                        "TOPIC_PRACTICE",
                        "专项练习：" + mastery.getTopic(),
                        "当前掌握度低于 60，需要补强。",
                        mastery.getTopic(),
                        40
                    ));
                }
            }
            return cards;
        }, executor);

        CompletableFuture.allOf(weakFuture, signalFuture, patternFuture, masteryFuture).join();

        List<ProfileRecommendationDto> all = new ArrayList<>();
        all.addAll(weakFuture.join());
        all.addAll(signalFuture.join());
        all.addAll(patternFuture.join());
        all.addAll(masteryFuture.join());

        return all.stream()
            .sorted(Comparator
                .comparing(ProfileRecommendationDto::priority)
                .thenComparing(ProfileRecommendationDto::title, Comparator.nullsLast(String::compareTo)))
            .limit(8)
            .toList();
    }

    private static String firstTopic(List<String> topics) {
        return topics != null && !topics.isEmpty() ? topics.get(0) : null;
    }

    private static boolean isCurrentBehaviorSignal(BehaviorSignalDto signal) {
        return ("ACTIVE".equals(signal.status()) && "NEGATIVE".equals(signal.polarity()))
            || "IMPROVING".equals(signal.status());
    }
}
