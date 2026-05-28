# 用户画像完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成用户画像核心闭环：统一默认用户、修复弱项状态展示、新增表现画像和长期模式，并让普通面试使用裁剪后的画像上下文。

**Architecture:** 先稳定现有知识画像链路，再在 `profile` 模块内新增行为信号、长期模式和推荐聚合服务。普通面试通过 `TrainingContextService` 获取已裁剪上下文，`InterviewSessionService` 不直接拼画像 prompt。

**Tech Stack:** Java 21, Spring Boot, Spring Data JPA, PostgreSQL JSONB, Flyway-style SQL migrations, React + Vite + TypeScript.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-05-28-profile-completion-design.md`
- Current plan source: `docs/guide/techspar-profile-integration-plan.md`

## File Structure

### Backend migrations

- Create `app/src/main/resources/db/migration/V2026-05-28c__complete_user_profile.sql`
  - Create `user_behavior_signals`.
  - Create `user_profile_patterns`.
  - Add `user_profiles.last_consolidated_at`.
  - Migrate `user_id = '0'` profile data to `default`.
  - Delete conflicting `0` rows by specified business keys.

### Backend profile domain

- Create `app/src/main/java/interview/guide/modules/profile/entity/UserBehaviorSignalEntity.java`
- Create `app/src/main/java/interview/guide/modules/profile/entity/UserProfilePatternEntity.java`
- Create `app/src/main/java/interview/guide/modules/profile/repository/UserBehaviorSignalRepository.java`
- Create `app/src/main/java/interview/guide/modules/profile/repository/UserProfilePatternRepository.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/dto/BehaviorSignalDto.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/dto/ProfilePatternDto.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/dto/ProfileRecommendationDto.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/WeakPointStatus.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/BehaviorSignalStatus.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/BehaviorSignalNamespace.java`
- Create `app/src/main/java/interview/guide/modules/profile/model/BehaviorSignalPolarity.java`
- Create `app/src/main/java/interview/guide/modules/profile/service/BehaviorSignalService.java`
- Create `app/src/main/java/interview/guide/modules/profile/service/ProfileConsolidationService.java`
- Create `app/src/main/java/interview/guide/modules/profile/service/ProfileRecommendationService.java`
- Modify `app/src/main/java/interview/guide/modules/profile/model/dto/ProfileExtractResult.java`
- Modify `app/src/main/java/interview/guide/modules/profile/model/dto/ProfileUpdateResult.java`
- Modify `app/src/main/java/interview/guide/modules/profile/service/ProfileExtractService.java`
- Modify `app/src/main/java/interview/guide/modules/profile/service/ProfileUpdateService.java`
- Modify `app/src/main/java/interview/guide/modules/profile/service/ProfileMemoryService.java`
- Modify `app/src/main/java/interview/guide/modules/profile/service/UserProfileService.java`
- Modify `app/src/main/java/interview/guide/modules/profile/repository/UserWeakPointRepository.java`
- Modify `app/src/main/java/interview/guide/modules/profile/controller/ProfileController.java`
- Modify `app/src/main/java/interview/guide/modules/profile/controller/ReviewController.java`
- Modify `app/src/main/java/interview/guide/modules/profile/controller/KnowledgeGraphController.java`
- Modify prompts:
  - `app/src/main/resources/prompts/profile-extract-system.st`
  - `app/src/main/resources/prompts/profile-update-system.st`

### Backend training context

- Create `app/src/main/java/interview/guide/modules/interview/model/TrainingContext.java`
- Create `app/src/main/java/interview/guide/modules/interview/service/TrainingContextService.java`
- Modify `app/src/main/java/interview/guide/modules/interview/service/InterviewQuestionService.java`
- Modify `app/src/main/java/interview/guide/modules/interview/service/InterviewSessionService.java`

### Backend tests

- Create `app/src/test/java/interview/guide/modules/profile/service/BehaviorSignalServiceTest.java`
- Create `app/src/test/java/interview/guide/modules/profile/service/ProfileConsolidationServiceTest.java`
- Create `app/src/test/java/interview/guide/modules/profile/service/ProfileRecommendationServiceTest.java`
- Create `app/src/test/java/interview/guide/modules/profile/service/UserProfileServiceWeakPointStatusTest.java`
- Create `app/src/test/java/interview/guide/modules/interview/service/TrainingContextServiceTest.java`
- Modify `app/src/test/java/interview/guide/modules/interview/service/InterviewSessionServiceTest.java`

### Frontend

- Modify `frontend/src/api/profile.ts`
- Modify `frontend/src/pages/ProfilePage.tsx`

## Implementation Tasks

### Task 1: Add database migration and profile entities

**Files:**
- Create: `app/src/main/resources/db/migration/V2026-05-28c__complete_user_profile.sql`
- Create: `app/src/main/java/interview/guide/modules/profile/entity/UserBehaviorSignalEntity.java`
- Create: `app/src/main/java/interview/guide/modules/profile/entity/UserProfilePatternEntity.java`
- Create: `app/src/main/java/interview/guide/modules/profile/repository/UserBehaviorSignalRepository.java`
- Create: `app/src/main/java/interview/guide/modules/profile/repository/UserProfilePatternRepository.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/entity/UserProfileEntity.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/repository/UserProfileRepository.java`

- [x] **Step 1: Write repository/entity tests that compile-fail first**

Create a focused repository test if an existing JPA test pattern is available; otherwise write service tests in later tasks and use this step to compile-check new entity mappings.

Run:

```bash
mvn -pl app -DskipTests compile
```

Expected: FAIL because new entity/repository files do not exist yet.

- [x] **Step 2: Add migration SQL**

Create `V2026-05-28c__complete_user_profile.sql`:

```sql
CREATE TABLE IF NOT EXISTS user_behavior_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    namespace VARCHAR(32) NOT NULL,
    signal_key VARCHAR(128) NOT NULL,
    polarity VARCHAR(16) NOT NULL,
    statement TEXT NOT NULL,
    evidence_json JSONB DEFAULT '[]',
    source_type VARCHAR(32),
    source_session_id BIGINT,
    times_seen INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    improved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_behavior_signal UNIQUE (user_id, namespace, signal_key)
);

CREATE TABLE IF NOT EXISTS user_profile_patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    pattern_type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    summary TEXT NOT NULL,
    related_topics JSONB DEFAULT '[]',
    related_signal_ids JSONB DEFAULT '[]',
    evidence_json JSONB DEFAULT '[]',
    confidence NUMERIC(4, 3),
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS last_consolidated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_behavior_signal_user_status
    ON user_behavior_signals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_behavior_signal_user_namespace
    ON user_behavior_signals (user_id, namespace);
CREATE INDEX IF NOT EXISTS idx_profile_patterns_user_status
    ON user_profile_patterns (user_id, status);
```

Add user ID migration in the same file. Use explicit delete-before-update conflict handling:

```sql
DELETE FROM user_profiles p0
USING user_profiles pd
WHERE p0.user_id = '0'
  AND pd.user_id = 'default';

UPDATE user_profiles SET user_id = 'default' WHERE user_id = '0';

DELETE FROM user_topic_mastery m0
USING user_topic_mastery md
WHERE m0.user_id = '0'
  AND md.user_id = 'default'
  AND m0.topic = md.topic;

UPDATE user_topic_mastery SET user_id = 'default' WHERE user_id = '0';

DELETE FROM user_weak_points w0
USING user_weak_points wd
WHERE w0.user_id = '0'
  AND wd.user_id = 'default'
  AND w0.question_text = wd.question_text;

UPDATE user_weak_points SET user_id = 'default' WHERE user_id = '0';

DELETE FROM user_strong_points s0
USING user_strong_points sd
WHERE s0.user_id = '0'
  AND sd.user_id = 'default'
  AND s0.topic = sd.topic
  AND s0.description = sd.description;

UPDATE user_strong_points SET user_id = 'default' WHERE user_id = '0';
```

- [x] **Step 3: Add entities**

Follow the style of `UserWeakPointEntity`: explicit `@Column(name = "...")`, JSONB via `@Type(JsonType.class)`.

Important fields for `UserBehaviorSignalEntity`:

```java
@Type(JsonType.class)
@Column(name = "evidence_json", columnDefinition = "jsonb")
private List<Map<String, Object>> evidenceJson = new ArrayList<>();
```

Important fields for `UserProfilePatternEntity`:

```java
@Type(JsonType.class)
@Column(name = "related_topics", columnDefinition = "jsonb")
private List<String> relatedTopics = new ArrayList<>();

@Type(JsonType.class)
@Column(name = "related_signal_ids", columnDefinition = "jsonb")
private List<Long> relatedSignalIds = new ArrayList<>();
```

Add `lastConsolidatedAt` to `UserProfileEntity`.

- [x] **Step 4: Add repositories**

Repository methods needed:

```java
List<UserBehaviorSignalEntity> findByUserId(String userId);
List<UserBehaviorSignalEntity> findByUserIdAndStatus(String userId, String status);
List<UserBehaviorSignalEntity> findByUserIdAndNamespaceAndStatus(String userId, String namespace, String status);
Optional<UserBehaviorSignalEntity> findByUserIdAndNamespaceAndSignalKey(String userId, String namespace, String signalKey);
long countByUserIdAndStatus(String userId, String status);
```

For patterns:

```java
List<UserProfilePatternEntity> findByUserIdAndStatusOrderByLastSeenDesc(String userId, String status);
long countByUserIdAndStatus(String userId, String status);
```

- [x] **Step 5: Compile**

Run:

```bash
mvn -pl app -DskipTests compile
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add app/src/main/resources/db/migration/V2026-05-28c__complete_user_profile.sql \
  app/src/main/java/interview/guide/modules/profile/entity/UserBehaviorSignalEntity.java \
  app/src/main/java/interview/guide/modules/profile/entity/UserProfilePatternEntity.java \
  app/src/main/java/interview/guide/modules/profile/repository/UserBehaviorSignalRepository.java \
  app/src/main/java/interview/guide/modules/profile/repository/UserProfilePatternRepository.java \
  app/src/main/java/interview/guide/modules/profile/entity/UserProfileEntity.java \
  app/src/main/java/interview/guide/modules/profile/repository/UserProfileRepository.java
git commit -m "feat(profile): 添加表现画像数据模型"
```

### Task 2: Fix default user ID and weak point status API

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/model/WeakPointStatus.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/repository/UserWeakPointRepository.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/service/UserProfileService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/controller/ProfileController.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/controller/ReviewController.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/controller/KnowledgeGraphController.java`
- Test: `app/src/test/java/interview/guide/modules/profile/service/UserProfileServiceWeakPointStatusTest.java`

- [x] **Step 1: Write failing tests for weak point status selection**

Create `UserProfileServiceWeakPointStatusTest` with Mockito repository mocks. Test:

```java
@Test
void shouldQueryImprovedWeakPoints() {
    UserWeakPointRepository weakRepo = mock(UserWeakPointRepository.class);
    UserProfileService service = new UserProfileService(...);

    when(weakRepo.findByUserIdAndIsImprovedTrue("default")).thenReturn(List.of(improvedEntity()));

    List<WeakPointDto> result = service.getWeakPointDtos("default", WeakPointStatus.IMPROVED, null);

    assertEquals(1, result.size());
    assertTrue(result.get(0).isImproved());
}
```

If constructor injection is not available, first refactor `UserProfileService` to constructor injection in the implementation step, then finish the test.

- [x] **Step 2: Run failing profile tests**

Run:

```bash
mvn -pl app -Dtest=UserProfileServiceWeakPointStatusTest test
```

Expected: FAIL because `WeakPointStatus` and `getWeakPointDtos` do not exist.

- [x] **Step 3: Add status enum**

Create:

```java
public enum WeakPointStatus {
    ACTIVE,
    IMPROVED,
    DUE
}
```

- [x] **Step 4: Add repository methods**

Add:

```java
List<UserWeakPointEntity> findByUserIdAndIsImprovedTrue(String userId);
List<UserWeakPointEntity> findByUserIdAndTopicAndIsImprovedFalse(String userId, String topic);
List<UserWeakPointEntity> findByUserIdAndTopicAndIsImprovedTrue(String userId, String topic);
```

Add native due query with optional topic:

```java
@Query(value = """
    SELECT * FROM user_weak_points
    WHERE user_id = :userId
      AND is_improved = false
      AND (:topic IS NULL OR topic = :topic)
      AND sr_state->>'next_review' IS NOT NULL
      AND (sr_state->>'next_review')::date <= :date
    ORDER BY (sr_state->>'ease_factor')::decimal ASC
    """, nativeQuery = true)
List<UserWeakPointEntity> findDueReviewsOptionalTopic(
    @Param("userId") String userId,
    @Param("topic") String topic,
    @Param("date") LocalDate date
);
```

- [x] **Step 5: Implement service method**

Add to `UserProfileService`:

```java
public List<WeakPointDto> getWeakPointDtos(String userId, WeakPointStatus status, String topic) {
    WeakPointStatus resolved = status != null ? status : WeakPointStatus.ACTIVE;
    List<UserWeakPointEntity> entities = switch (resolved) {
        case ACTIVE -> topic == null || topic.isBlank()
            ? weakPointRepo.findByUserIdAndIsImprovedFalse(userId)
            : weakPointRepo.findByUserIdAndTopicAndIsImprovedFalse(userId, topic);
        case IMPROVED -> topic == null || topic.isBlank()
            ? weakPointRepo.findByUserIdAndIsImprovedTrue(userId)
            : weakPointRepo.findByUserIdAndTopicAndIsImprovedTrue(userId, topic);
        case DUE -> weakPointRepo.findDueReviewsOptionalTopic(userId, blankToNull(topic), LocalDate.now());
    };
    return entities.stream().map(this::toDto).toList();
}
```

- [x] **Step 6: Add API endpoint and default user**

Modify defaults from `"0"` to `"default"` in:

- `ProfileController`
- `ReviewController`
- `KnowledgeGraphController`

Add to `ProfileController`:

```java
@GetMapping("/weak-points")
public Result<List<WeakPointDto>> getWeakPoints(
        @RequestParam(defaultValue = "default") String userId,
        @RequestParam(defaultValue = "ACTIVE") WeakPointStatus status,
        @RequestParam(required = false) String topic) {
    return Result.success(profileService.getWeakPointDtos(userId, status, topic));
}
```

- [x] **Step 7: Run tests**

Run:

```bash
mvn -pl app -Dtest=UserProfileServiceWeakPointStatusTest,SpacedRepetitionServiceTest test
```

Expected: PASS.

- [x] **Step 8: Commit**

```bash
git add app/src/main/java/interview/guide/modules/profile app/src/test/java/interview/guide/modules/profile/service/UserProfileServiceWeakPointStatusTest.java
git commit -m "fix(profile): 统一默认用户并支持弱项状态查询"
```

### Task 3: Implement behavior signal service and DTOs

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/model/BehaviorSignalStatus.java`
- Create: `app/src/main/java/interview/guide/modules/profile/model/BehaviorSignalNamespace.java`
- Create: `app/src/main/java/interview/guide/modules/profile/model/BehaviorSignalPolarity.java`
- Create: `app/src/main/java/interview/guide/modules/profile/model/dto/BehaviorSignalDto.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/model/dto/ProfileExtractResult.java`
- Create: `app/src/main/java/interview/guide/modules/profile/service/BehaviorSignalService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/controller/ProfileController.java`
- Test: `app/src/test/java/interview/guide/modules/profile/service/BehaviorSignalServiceTest.java`

- [ ] **Step 1: Write failing behavior signal tests**

Test canonicalization:

```java
@Test
void shouldCanonicalizeSignalKey() {
    assertEquals("communication_missing_example",
        BehaviorSignalService.canonicalizeSignalKey("Communication Missing Example!"));
}
```

Test merge:

```java
@Test
void shouldMergeExistingSignalAndKeepLatestFiveEvidenceItems() {
    // existing timesSeen=1 with one evidence
    // apply insight with six evidence entries
    // expect timesSeen=2 and evidenceJson size=5
}
```

Test low confidence and empty evidence:

```java
@Test
void shouldDropLowConfidenceOrEmptyEvidenceSignal() {
    ProfileExtractResult.BehaviorSignalInsight lowConfidence = insight("communication", "communication_missing_example", 0.49, evidence("Redis", "缺少例子"));
    ProfileExtractResult.BehaviorSignalInsight noEvidence = insight("reasoning", "reasoning_boundary_case_gap", 0.9);

    int updated = service.applyInsights("default", List.of(lowConfidence, noEvidence), 1L);

    assertEquals(0, updated);
    verify(repository, never()).save(any());
}
```

Test improvement:

```java
@Test
void shouldMarkNegativeSignalImprovingWhenPositiveEvidenceAppears() {
    // existing NEGATIVE ACTIVE
    // insight same key POSITIVE
    // expect status IMPROVING and improvedAt not null
}
```

- [ ] **Step 2: Run failing tests**

```bash
mvn -pl app -Dtest=BehaviorSignalServiceTest test
```

Expected: FAIL because service and DTOs do not exist.

- [ ] **Step 3: Add enums and DTO**

Enums are simple Java enums:

```java
public enum BehaviorSignalStatus { ACTIVE, IMPROVING, IMPROVED, ARCHIVED }
public enum BehaviorSignalPolarity { POSITIVE, NEGATIVE, NEUTRAL }
public enum BehaviorSignalNamespace { communication, reasoning, narrative, metacognition }
```

DTO:

```java
public record BehaviorSignalDto(
    Long id,
    String namespace,
    String signalKey,
    String polarity,
    String statement,
    List<Map<String, Object>> evidence,
    Integer timesSeen,
    String status,
    String lastSeen
) {}
```

- [ ] **Step 4: Extend ProfileExtractResult**

Add:

```java
List<BehaviorSignalInsight> behaviorSignals

public record BehaviorSignalInsight(
    String namespace,
    String signalKey,
    String polarity,
    String statement,
    List<BehaviorSignalEvidence> evidence,
    double confidence
) {}

public record BehaviorSignalEvidence(
    String topic,
    Long sessionId,
    String summary
) {}
```

Guard nulls in callers with `List.of()` before iterating.

- [ ] **Step 5: Implement BehaviorSignalService**

Key public methods:

```java
public List<BehaviorSignalDto> getSignals(String userId, String namespace, String status)
public int applyInsights(String userId, List<BehaviorSignalInsight> insights, Long sessionId)
public static String canonicalizeSignalKey(String raw)
```

Canonicalization:

```java
String normalized = raw == null ? "" : raw.toLowerCase(Locale.ROOT)
    .replaceAll("[^a-z0-9]+", "_")
    .replaceAll("_+", "_")
    .replaceAll("^_|_$", "");
return normalized.length() > 128 ? normalized.substring(0, 128) : normalized;
```

Evidence map:

```java
Map<String, Object> item = new LinkedHashMap<>();
item.put("topic", evidence.topic());
item.put("sessionId", evidence.sessionId() != null ? evidence.sessionId() : sessionId);
item.put("summary", evidence.summary());
item.put("seenAt", LocalDateTime.now().toString());
```

Drop evidence entries with blank `topic` or blank `summary`.

Use `confidence >= 0.60` as the first-version write threshold. If an insight has confidence below `0.60`, skip it. After cleaning evidence entries, if no valid evidence remains, skip it. Skipped insights must not create new rows and must not increment `timesSeen`.

- [ ] **Step 6: Add behavior signals API**

Add to `ProfileController`:

```java
@GetMapping("/behavior-signals")
public Result<List<BehaviorSignalDto>> getBehaviorSignals(
        @RequestParam(defaultValue = "default") String userId,
        @RequestParam(required = false) String namespace,
        @RequestParam(required = false) String status) {
    return Result.success(behaviorSignalService.getSignals(userId, namespace, status));
}
```

- [ ] **Step 7: Run tests**

```bash
mvn -pl app -Dtest=BehaviorSignalServiceTest test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/src/main/java/interview/guide/modules/profile app/src/test/java/interview/guide/modules/profile/service/BehaviorSignalServiceTest.java
git commit -m "feat(profile): 添加表现画像信号服务"
```

### Task 4: Extend profile extraction and update pipeline

**Files:**
- Modify: `app/src/main/java/interview/guide/modules/profile/service/ProfileExtractService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/service/ProfileUpdateService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/service/ProfileMemoryService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/model/dto/ProfileUpdateResult.java`
- Modify: `app/src/main/resources/prompts/profile-extract-system.st`
- Modify: `app/src/main/resources/prompts/profile-extract-user.st`
- Modify: `app/src/main/resources/prompts/profile-update-system.st`
- Test: extend `app/src/test/java/interview/guide/modules/profile/service/BehaviorSignalServiceTest.java` or create `ProfileMemoryServiceTest.java`

- [ ] **Step 1: Write failing pipeline test**

Test that behavior signal failure does not stop weak/strong update:

```java
@Test
void shouldContinueWhenBehaviorSignalApplyFails() {
    ProfileExtractResult extraction = new ProfileExtractResult(
        List.of(weakInsight()),
        List.of(strengthInsight()),
        List.of(signalInsight())
    );
    when(extractService.extractFromSession(1L, "default")).thenReturn(extraction);
    doThrow(new RuntimeException("signal failed")).when(behaviorSignalService)
        .applyInsights(eq("default"), any(), eq(1L));

    service.extractAndUpdate("session-id", "default");

    verify(updateService).applyOperations(eq("default"), any(), eq(1L));
}
```

Add an explicit behavior-only extraction test:

```java
@Test
void shouldApplyBehaviorSignalsWhenWeakAndStrongInsightsAreEmpty() {
    ProfileExtractResult extraction = new ProfileExtractResult(
        List.of(),
        List.of(),
        List.of(signalInsight())
    );
    when(extractService.extractFromSession(1L, "default")).thenReturn(extraction);

    service.extractAndUpdate("session-id", "default");

    verify(behaviorSignalService).applyInsights(eq("default"), eq(extraction.behaviorSignals()), eq(1L));
}
```

- [ ] **Step 2: Run failing test**

```bash
mvn -pl app -Dtest=ProfileMemoryServiceTest test
```

Expected: FAIL until dependencies and constructor are updated.

- [ ] **Step 3: Update prompts**

In `profile-extract-system.st`, require JSON to include `behaviorSignals` and fixed key family:

```text
behaviorSignals must use one of these signalKey values when possible:
communication_missing_example, communication_unclear_structure,
communication_concise_summary, reasoning_boundary_case_gap,
reasoning_complexity_unclear, reasoning_stepwise_analysis,
narrative_missing_tradeoff, narrative_result_oriented,
metacognition_uncertain_but_calibrated,
metacognition_overconfident_without_evidence.
Each evidence item must include topic and summary.
```

- [ ] **Step 4: Update pipeline**

Inject `BehaviorSignalService` into `ProfileMemoryService`.

Update the existing “no insights extracted” guard so behavior-only extractions continue:

```java
boolean noWeak = extraction.weakPoints() == null || extraction.weakPoints().isEmpty();
boolean noStrong = extraction.strengths() == null || extraction.strengths().isEmpty();
boolean noSignals = extraction.behaviorSignals() == null || extraction.behaviorSignals().isEmpty();
if (noWeak && noStrong && noSignals) {
    log.info("No insights extracted, skipping update");
    return;
}
```

After Stage 2 weak/strong update:

```java
try {
    int signalCount = behaviorSignalService.applyInsights(
        userId,
        extraction.behaviorSignals() != null ? extraction.behaviorSignals() : List.of(),
        numericSessionId
    );
    log.info("Behavior signal update complete: {} signals", signalCount);
} catch (Exception e) {
    log.warn("Behavior signal update failed, weak/strong profile already applied: {}", e.getMessage(), e);
}
```

- [ ] **Step 5: Keep ProfileUpdateResult focused**

Do not force behavior signal operations into `ProfileUpdateResult` in first implementation unless needed. The spec allows deterministic fallback; keep behavior signal merge deterministic in `BehaviorSignalService` to reduce LLM dependency.

- [ ] **Step 6: Run tests**

```bash
mvn -pl app -Dtest=ProfileMemoryServiceTest,BehaviorSignalServiceTest test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/main/java/interview/guide/modules/profile app/src/main/resources/prompts/profile-*.st app/src/test/java/interview/guide/modules/profile/service
git commit -m "feat(profile): 扩展画像更新写入表现信号"
```

### Task 5: Add profile consolidation and pattern APIs

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/model/dto/ProfilePatternDto.java`
- Create: `app/src/main/java/interview/guide/modules/profile/service/ProfileConsolidationService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/service/ProfileMemoryService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/controller/ProfileController.java`
- Test: `app/src/test/java/interview/guide/modules/profile/service/ProfileConsolidationServiceTest.java`

- [ ] **Step 1: Write failing consolidation tests**

Tests:

```java
@Test
void shouldTriggerWhenActiveSignalsReachFive() {}

@Test
void shouldTriggerWhenActiveWeakPointsReachTen() {}

@Test
void shouldTriggerWhenLastConsolidatedAtIsOlderThanTwentyFourHours() {}

@Test
void shouldNotTriggerWhenNoConditionMatches() {}

@Test
void shouldCreateBehaviorRiskPatternForSameSignalAcrossTwoTopics() {}

@Test
void shouldCreateKnowledgeGapPatternForSameWeakPointKeyAcrossTwoTopics() {}

@Test
void shouldSkipEvidenceWithoutTopic() {}

@Test
void shouldUpdateLastConsolidatedAtAfterSuccessfulRun() {}
```

Expected pattern title can be simple:

```java
assertEquals("沟通表达模式：communication_missing_example", pattern.getTitle());
```

- [ ] **Step 2: Run failing tests**

```bash
mvn -pl app -Dtest=ProfileConsolidationServiceTest test
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement ProfilePatternDto**

```java
public record ProfilePatternDto(
    Long id,
    String patternType,
    String title,
    String summary,
    List<String> relatedTopics,
    List<Long> relatedSignalIds,
    Double confidence,
    String status,
    String lastSeen
) {}
```

- [ ] **Step 4: Implement consolidation service**

Public methods:

```java
public boolean shouldConsolidate(String userId)
public int consolidateIfNeeded(String userId)
public List<ProfilePatternDto> getPatterns(String userId, String status)
```

`shouldConsolidate` must return true when any condition is met:

```java
boolean staleByTime = profile.getLastConsolidatedAt() == null
    || profile.getLastConsolidatedAt().isBefore(LocalDateTime.now().minusHours(24));
boolean enoughSignals = behaviorSignalRepository.countByUserIdAndStatus(userId, "ACTIVE") >= 5;
boolean enoughWeakPoints = weakPointRepository.findByUserIdAndIsImprovedFalse(userId).size() >= 10;
boolean crossTopicPattern = hasCrossTopicBehaviorPattern(userId) || hasCrossTopicWeakPointPattern(userId);
return staleByTime || enoughSignals || enoughWeakPoints || crossTopicPattern;
```

If `user_profiles` row does not exist, create or save one before updating `lastConsolidatedAt`.

Behavior signal mode:

```java
Map<String, Set<String>> topicsBySignal = activeSignals.stream()
    .collect(groupingBy(
        s -> s.getNamespace() + ":" + s.getSignalKey(),
        flatMapping(s -> evidenceTopics(s).stream(), toSet())
    ));
```

Skip empty topics. Create/update a `BEHAVIOR_RISK` pattern when topic count >= 2.

Weak point mode: normalize `questionText` with a static helper:

```java
static String normalizeWeakPointKey(String text) {
    if (text == null) return "";
    String value = text.toLowerCase(Locale.ROOT)
        .replaceAll("\\p{Punct}|\\s+", "");
    return value.length() > 80 ? value.substring(0, 80) : value;
}
```

Then group active weak points by normalized key:

```java
Map<String, List<UserWeakPointEntity>> byKey = activeWeakPoints.stream()
    .filter(wp -> wp.getTopic() != null && !wp.getTopic().isBlank())
    .collect(Collectors.groupingBy(wp -> normalizeWeakPointKey(wp.getQuestionText())));
```

For each group:

- Ignore blank normalized keys.
- Build distinct `relatedTopics` from the group.
- If `relatedTopics.size() < 2`, skip.
- Create or update a `KNOWLEDGE_GAP` pattern.
- Use title format: `知识缺口：<normalizedKey>`.
- Use summary format: `该问题在多个主题中重复出现，需要专项复习。`
- Use `related_topics` from the distinct topics.
- Use `evidence_json` entries containing `topic`, `questionText`, `weakPointId`, and `lastSeen`.
- Set confidence to `0.75` for first version.

Use a deterministic upsert rule for first version: find an existing active pattern for the same `user_id`, `pattern_type = 'KNOWLEDGE_GAP'`, and `title`; update it if found, otherwise insert.

- [ ] **Step 5: Call consolidation from ProfileMemoryService**

After behavior signal update:

```java
try {
    int patterns = consolidationService.consolidateIfNeeded(userId);
    log.info("Profile consolidation complete: {} patterns", patterns);
} catch (Exception e) {
    log.warn("Profile consolidation failed: {}", e.getMessage(), e);
}
```

Inside `consolidateIfNeeded`, update `user_profiles.last_consolidated_at` after the consolidation attempt completes successfully, even if zero new patterns were created. Do not update it when consolidation throws.

- [ ] **Step 6: Add API**

Add:

```java
@GetMapping("/patterns")
public Result<List<ProfilePatternDto>> getPatterns(
        @RequestParam(defaultValue = "default") String userId,
        @RequestParam(defaultValue = "ACTIVE") String status) {
    return Result.success(consolidationService.getPatterns(userId, status));
}
```

- [ ] **Step 7: Run tests**

```bash
mvn -pl app -Dtest=ProfileConsolidationServiceTest,ProfileMemoryServiceTest test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/src/main/java/interview/guide/modules/profile app/src/test/java/interview/guide/modules/profile/service/ProfileConsolidationServiceTest.java
git commit -m "feat(profile): 添加画像长期模式沉淀"
```

### Task 6: Add recommendations and training context

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/model/dto/ProfileRecommendationDto.java`
- Create: `app/src/main/java/interview/guide/modules/profile/service/ProfileRecommendationService.java`
- Create: `app/src/main/java/interview/guide/modules/interview/model/TrainingContext.java`
- Create: `app/src/main/java/interview/guide/modules/interview/service/TrainingContextService.java`
- Modify: `app/src/main/java/interview/guide/modules/profile/controller/ProfileController.java`
- Modify: `app/src/main/java/interview/guide/modules/interview/service/InterviewQuestionService.java`
- Modify: `app/src/main/java/interview/guide/modules/interview/service/InterviewSessionService.java`
- Test: `app/src/test/java/interview/guide/modules/profile/service/ProfileRecommendationServiceTest.java`
- Test: `app/src/test/java/interview/guide/modules/interview/service/TrainingContextServiceTest.java`
- Modify test: `app/src/test/java/interview/guide/modules/interview/service/InterviewSessionServiceTest.java`

- [ ] **Step 1: Write failing recommendation tests**

Test that due weak points rank ahead of general low-score topics:

```java
@Test
void shouldRecommendDueWeakPointFirst() {
    List<ProfileRecommendationDto> result = service.getRecommendations("default");
    assertEquals("WEAK_POINT_REVIEW", result.get(0).type());
}
```

- [ ] **Step 2: Write failing training context tests**

Test limits:

```java
@Test
void shouldLimitContextItems() {
    TrainingContext context = service.buildForInterview("default", JobRole.JAVA_BACKEND, 1L);
    assertTrue(context.toPromptText().lines().filter(l -> l.startsWith("- [弱项]")).count() <= 5);
}
```

Test failure downgrade:

```java
@Test
void shouldReturnEmptyContextWhenProfileQueryFails() {
    when(profileService.getWeakPointDtos(any(), any(), any())).thenThrow(new RuntimeException("db"));
    TrainingContext context = service.buildForInterview("default", JobRole.JAVA_BACKEND, 1L);
    assertTrue(context.isEmpty());
}
```

- [ ] **Step 3: Run failing tests**

```bash
mvn -pl app -Dtest=ProfileRecommendationServiceTest,TrainingContextServiceTest test
```

Expected: FAIL because services do not exist.

- [ ] **Step 4: Implement recommendation DTO/service**

DTO:

```java
public record ProfileRecommendationDto(
    String type,
    String title,
    String reason,
    String topic,
    Integer priority
) {}
```

Service is lightweight aggregation only:

- `WEAK_POINT_REVIEW` from DUE weak points.
- `TOPIC_PRACTICE` from topic mastery score below 60.
- `BEHAVIOR_PRACTICE` from negative or improving signals.
- `PATTERN_FOCUS` from active patterns.

Sorting rule:

- `WEAK_POINT_REVIEW`: priority 10
- `BEHAVIOR_PRACTICE`: priority 20
- `PATTERN_FOCUS`: priority 30
- `TOPIC_PRACTICE`: priority 40

Return cards sorted by `priority` ascending, then title ascending. Limit the first version to 8 cards.

- [ ] **Step 5: Implement TrainingContext**

Create immutable record:

```java
public record TrainingContext(
    List<String> weakPointLines,
    List<String> lowMasteryLines,
    List<String> behaviorSignalLines,
    List<String> patternLines,
    List<String> strongPointLines
) {
    public boolean isEmpty() { ... }
    public String toPromptText() { ... }
}
```

Prompt text labels:

```text
用户画像上下文：
- [弱项] Redis: 缓存一致性回答缺少异常场景
- [表现] communication_missing_example: 回答有结论但缺少例子
- [长期模式] 多个后端主题缺少工程落地细节
```

- [ ] **Step 6: Implement TrainingContextService**

Inject:

- `UserProfileService`
- `BehaviorSignalService`
- `ProfileConsolidationService`
- `UserStrongPointRepository`

Apply limits:

- weak points: 5
- low mastery: 3
- behavior signals: 3
- patterns: 2
- strong points: 2

Catch exceptions and return empty context.

- [ ] **Step 7: Integrate InterviewQuestionService**

Add:

```java
public List<InterviewQuestionDTO> generateQuestionsWithContext(
    JobRole jobRole,
    String resumeText,
    int questionCount,
    List<String> historicalQuestions,
    TrainingContext context
) {
    return generateQuestionsWithWeakContext(
        jobRole,
        resumeText,
        questionCount,
        historicalQuestions,
        context != null ? context.toPromptText() : ""
    );
}
```

- [ ] **Step 8: Integrate InterviewSessionService**

Inject `TrainingContextService`.

In `createSession`, replace direct `generateQuestions` call:

```java
TrainingContext context = trainingContextService.buildForInterview(
    "default",
    request.jobRole(),
    request.resumeId()
);
List<InterviewQuestionDTO> questions = questionService.generateQuestionsWithContext(
    request.jobRole(),
    request.resumeText(),
    request.questionCount(),
    historicalQuestions,
    context
);
```

Update existing `InterviewSessionServiceTest` constructors and verify old tests still pass.

- [ ] **Step 9: Add recommendations API**

```java
@GetMapping("/recommendations")
public Result<List<ProfileRecommendationDto>> getRecommendations(
        @RequestParam(defaultValue = "default") String userId) {
    return Result.success(recommendationService.getRecommendations(userId));
}
```

- [ ] **Step 10: Run tests**

```bash
mvn -pl app -Dtest=ProfileRecommendationServiceTest,TrainingContextServiceTest,InterviewSessionServiceTest test
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add app/src/main/java/interview/guide/modules/profile app/src/main/java/interview/guide/modules/interview \
  app/src/test/java/interview/guide/modules/profile/service/ProfileRecommendationServiceTest.java \
  app/src/test/java/interview/guide/modules/interview/service/TrainingContextServiceTest.java \
  app/src/test/java/interview/guide/modules/interview/service/InterviewSessionServiceTest.java
git commit -m "feat(profile): 将画像上下文接入普通面试"
```

### Task 7: Update frontend profile API and Profile page

**Files:**
- Modify: `frontend/src/api/profile.ts`
- Modify: `frontend/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Add frontend types and API methods**

In `profile.ts`, change defaults from `'0'` to `'default'`.

Add:

```ts
export type WeakPointStatus = 'ACTIVE' | 'IMPROVED' | 'DUE';

export interface BehaviorSignalDto {
  id: number;
  namespace: 'communication' | 'reasoning' | 'narrative' | 'metacognition';
  signalKey: string;
  polarity: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  statement: string;
  evidence: Array<{ topic?: string; sessionId?: number; summary?: string; seenAt?: string }>;
  timesSeen: number;
  status: 'ACTIVE' | 'IMPROVING' | 'IMPROVED' | 'ARCHIVED';
  lastSeen: string;
}

export interface ProfilePatternDto {
  id: number;
  patternType: string;
  title: string;
  summary: string;
  relatedTopics: string[];
  relatedSignalIds: number[];
  confidence: number | null;
  status: string;
  lastSeen: string;
}

export interface ProfileRecommendationDto {
  type: string;
  title: string;
  reason: string;
  topic: string | null;
  priority: number;
}
```

Add API methods:

```ts
getWeakPoints: (status: WeakPointStatus, userId = 'default', topic?: string) =>
  request.get<WeakPointDto[]>(buildUrl('/api/profile/weak-points', { userId, status, topic })),
getBehaviorSignals: (userId = 'default') =>
  request.get<BehaviorSignalDto[]>(buildUrl('/api/profile/behavior-signals', { userId })),
getPatterns: (userId = 'default') =>
  request.get<ProfilePatternDto[]>(buildUrl('/api/profile/patterns', { userId })),
getRecommendations: (userId = 'default') =>
  request.get<ProfileRecommendationDto[]>(buildUrl('/api/profile/recommendations', { userId })),
```

- [ ] **Step 2: Refactor ProfilePage data loading**

Load:

- profile
- active weak points
- due weak points
- improved weak points
- strong points
- behavior signals
- patterns
- recommendations

Use `Promise.all` and keep existing error handling.

- [ ] **Step 3: Render new sections**

Keep current layout style. Add sections below existing knowledge mastery:

- Weak point tabs backed by separate arrays.
- Behavior signals grouped by namespace.
- Long-term patterns.
- Recommendation cards.

Empty states:

```tsx
<p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-8">
  暂无表现画像，完成一次面试后会自动沉淀
</p>
```

- [ ] **Step 4: Build frontend**

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/profile.ts frontend/src/pages/ProfilePage.tsx
git commit -m "feat(frontend): 完善个人画像页展示"
```

### Task 8: Final verification

**Files:**
- No new files unless fixing test/build issues.

- [ ] **Step 1: Run backend tests**

```bash
mvn test
```

Expected: PASS.

- [ ] **Step 2: Run frontend build**

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Manual API smoke checks**

With backend running locally:

```bash
curl "http://localhost:8080/api/profile?userId=default"
curl "http://localhost:8080/api/profile/weak-points?userId=default&status=ACTIVE"
curl "http://localhost:8080/api/profile/weak-points?userId=default&status=IMPROVED"
curl "http://localhost:8080/api/profile/behavior-signals?userId=default"
curl "http://localhost:8080/api/profile/patterns?userId=default"
curl "http://localhost:8080/api/profile/recommendations?userId=default"
```

Expected: each returns a `Result` wrapper with successful payload, including empty lists when no data exists.

- [ ] **Step 4: Review final diff**

```bash
git status --short
git log --oneline -n 8
```

Expected: only intentional changes remain uncommitted, ideally none for this feature branch.

- [ ] **Step 5: Commit fixes if any**

If verification required fixes:

```bash
git add <fixed-files>
git commit -m "fix(profile): 完善画像闭环验证问题"
```

## Implementation Notes

- Keep existing unrelated worktree changes. Do not revert files outside this plan.
- Prefer constructor injection for newly added services.
- Keep new profile services small; avoid putting recommendation, consolidation, and signal merge all into `UserProfileService`.
- Do not add JD, recording review, Copilot Prep, or specialized training implementation in this plan.
- If LLM structured output breaks because `ProfileExtractResult` adds a field, ensure prompt format and null handling are updated together.
- If a task exposes that `mvn -pl app` is unsupported from this repo layout, run the equivalent command from `app/`: `cd app && mvn test`.
