# SM-2 + 用户画像系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 为 ai-interview 平台增加用户能力追踪和复习调度能力，面试结束录入弱项，下次专项训练自动优先出弱项题，Profile 页展示成长轨迹。

**Architecture:** 后端新增三个表（user_weak_points / user_topic_mastery / user_profiles），新增 SpacedRepetitionService 处理 SM-2 调度，UserProfileService 处理画像读写。面试报告页增加"录入复习计划"按钮，专项训练题目生成时注入到期弱项上下文。前端新增 Profile 页面展示统计数据和成长曲线。

**Tech Stack:** Spring Boot 4, Spring AI, PostgreSQL + pgvector, Redis, React 18, Tailwind CSS v4

---

## Phase 1: 后端基础设施

### Task 1: 数据库表创建

**Files:**
- Create: `app/src/main/resources/db/migration/V2026-04-15__add_user_profile_tables.sql`

**Step 1: 创建迁移 SQL**

```sql
-- V2026-04-15__add_user_profile_tables.sql

CREATE TABLE user_profiles (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL UNIQUE,
    target_role VARCHAR(128),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_topic_mastery (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    topic           VARCHAR(64) NOT NULL,
    score           DECIMAL(5,2) DEFAULT 50.0,
    session_count   INT DEFAULT 0,
    notes           TEXT,
    last_assessed   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_topic_mastery UNIQUE (user_id, topic)
);

CREATE TABLE user_weak_points (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    topic           VARCHAR(64) NOT NULL,
    question_text   TEXT NOT NULL,
    answer_summary  TEXT,
    score           DECIMAL(5,2),
    source          VARCHAR(32) DEFAULT 'INTERVIEW',
    session_id      BIGINT,
    sr_state        JSONB DEFAULT 
        '{"interval_days":1,"ease_factor":2.5,"repetitions":0,"next_review":null,"last_score":null}',
    is_improved     BOOLEAN DEFAULT FALSE,
    improved_at     TIMESTAMP,
    times_seen      INT DEFAULT 1,
    first_seen      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_topic_question UNIQUE (user_id, question_text)
);

CREATE INDEX idx_weak_due_review ON user_weak_points (user_id, ((sr_state->>'next_review')::date)) WHERE is_improved = FALSE;
CREATE INDEX idx_weak_user_topic ON user_weak_points (user_id, topic) WHERE is_improved = FALSE;
CREATE INDEX idx_mastery_user ON user_topic_mastery (user_id);
```

**Step 2: 验证 SQL 语法**

Run: `psql -h localhost -U postgres -d ai_interview -f app/src/main/resources/db/migration/V2026-04-15__add_user_profile_tables.sql`
Expected: CREATE TABLE 3 statements OK

**Step 3: 提交**

```bash
git add app/src/main/resources/db/migration/V2026-04-15__add_user_profile_tables.sql
git commit -m "feat: add user profile tables (weak_points, topic_mastery, profiles)"
```

---

### Task 2: SpacedRepetitionService（SM-2 算法）

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/service/SpacedRepetitionService.java`

**Step 1: 创建 Sm2State 和 Sm2Result 记录类**

```java
// app/src/main/java/interview/guide/modules/profile/model/Sm2State.java
package interview.guide.modules.profile.model;

public record Sm2State(
    int intervalDays,
    double easeFactor,
    int repetitions,
    LocalDate nextReview,
    Double lastScore
) {
    public static Sm2State initial() {
        return new Sm2State(1, 2.5, 0, LocalDate.now().plusDays(1), null);
    }
}
```

**Step 2: 创建 Sm2Result**

```java
// app/src/main/java/interview/guide/modules/profile/model/Sm2Result.java
package interview.guide.modules.profile.model;

public record Sm2Result(
    int intervalDays,
    double easeFactor,
    int repetitions,
    LocalDate nextReview
) {}
```

**Step 3: 创建 SpacedRepetitionService**

```java
// app/src/main/java/interview/guide/modules/profile/service/SpacedRepetitionService.java
package interview.guide.modules.profile.service;

import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.Sm2State;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class SpacedRepetitionService {

    public Sm2Result sm2Update(Sm2State state, double score0to10) {
        int quality = mapScoreToQuality(score0to10);
        double ef = state.easeFactor();
        int reps = state.repetitions();
        int interval = state.intervalDays();

        if (quality >= 3) {
            if (reps == 0) interval = 1;
            else if (reps == 1) interval = 3;
            else interval = (int) Math.round(interval * ef);
            reps++;
        } else {
            interval = 1;
            reps = 0;
        }

        ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

        return new Sm2Result(interval, ef, reps, LocalDate.now().plusDays(interval));
    }

    private int mapScoreToQuality(double score) {
        if (score <= 2) return 0;
        if (score <= 4) return 2;
        if (score <= 5) return 3;
        if (score <= 7) return 4;
        return 5;
    }

    public boolean isImproved(int repetitions) {
        return repetitions >= 3;
    }
}
```

**Step 4: 写单元测试**

```java
// app/src/test/java/interview/guide/modules/profile/service/SpacedRepetitionServiceTest.java
package interview.guide.modules.profile.service;

import interview.guide.modules.profile.model.Sm2Result;
import interview.guide.modules.profile.model.Sm2State;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class SpacedRepetitionServiceTest {

    private final SpacedRepetitionService service = new SpacedRepetitionService();

    @Test
    void shouldPassSimpleQuestion() {
        Sm2State state = Sm2State.initial();
        Sm2Result result = service.sm2Update(state, 7.0);

        assertEquals(3, result.intervalDays());
        assertEquals(1, result.repetitions());
        assertEquals(LocalDate.now().plusDays(3), result.nextReview());
    }

    @Test
    void shouldFailAndReset() {
        Sm2State state = new Sm2State(3, 2.5, 1, LocalDate.now(), null);
        Sm2Result result = service.sm2Update(state, 2.0);

        assertEquals(1, result.intervalDays());
        assertEquals(0, result.repetitions());
    }

    @Test
    void shouldReachImprovedAfterThreePasses() {
        Sm2State state = new Sm2State(3, 2.5, 2, LocalDate.now(), null);
        Sm2Result result = service.sm2Update(state, 8.0);

        assertEquals(3, result.repetitions());
        assertTrue(service.isImproved(result.repetitions()));
    }
}
```

**Step 5: 运行测试**

Run: `cd app && mvn test -Dtest=SpacedRepetitionServiceTest`
Expected: 3 tests PASS

**Step 6: 提交**

```bash
git add app/src/main/java/interview/guide/modules/profile/
git commit -m "feat: add SpacedRepetitionService with SM-2 algorithm

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Entity 类创建

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/entity/UserWeakPointEntity.java`
- Create: `app/src/main/java/interview/guide/modules/profile/entity/UserTopicMasteryEntity.java`
- Create: `app/src/main/java/interview/guide/modules/profile/entity/UserProfileEntity.java`

**Step 1: 创建 UserWeakPointEntity**

```java
// app/src/main/java/interview/guide/modules/profile/entity/UserWeakPointEntity.java
package interview.guide.modules.profile.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "user_weak_points")
public class UserWeakPointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "topic", nullable = false)
    private String topic;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "answer_summary", columnDefinition = "TEXT")
    private String answerSummary;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "source")
    private String source = "INTERVIEW";

    @Column(name = "session_id")
    private Long sessionId;

    @Type(JsonType.class)
    @Column(name = "sr_state", columnDefinition = "jsonb")
    private Map<String, Object> srState = Map.of(
        "interval_days", 1,
        "ease_factor", 2.5,
        "repetitions", 0,
        "next_review", LocalDate.now().plusDays(1).toString(),
        "last_score", null
    );

    @Column(name = "is_improved")
    private Boolean isImproved = false;

    @Column(name = "improved_at")
    private LocalDateTime improvedAt;

    @Column(name = "times_seen")
    private Integer timesSeen = 1;

    @Column(name = "first_seen")
    private LocalDateTime firstSeen = LocalDateTime.now();

    @Column(name = "last_seen")
    private LocalDateTime lastSeen = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // getters and setters
}
```

**Step 2: 创建 UserTopicMasteryEntity 和 UserProfileEntity（类似结构）**

**Step 3: 提交**

```bash
git add app/src/main/java/interview/guide/modules/profile/entity/
git commit -m "feat: add profile entity classes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Repository 创建

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/repository/UserWeakPointRepository.java`
- Create: `app/src/main/java/interview/guide/modules/profile/repository/UserTopicMasteryRepository.java`
- Create: `app/src/main/java/interview/guide/modules/profile/repository/UserProfileRepository.java`

**Step 1: 创建 UserWeakPointRepository**

```java
// app/src/main/java/interview/guide/modules/profile/repository/UserWeakPointRepository.java
package interview.guide.modules.profile.repository;

import interview.guide.modules.profile.entity.UserWeakPointEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserWeakPointRepository extends JpaRepository<UserWeakPointEntity, Long> {

    List<UserWeakPointEntity> findByUserIdAndIsImprovedFalse(String userId);

    @Query(value = """
        SELECT * FROM user_weak_points
        WHERE user_id = :userId
          AND topic = :topic
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        ORDER BY (sr_state->>'ease_factor')::decimal ASC
        """, nativeQuery = true)
    List<UserWeakPointEntity> findDueReviews(
        @Param("userId") String userId,
        @Param("topic") String topic,
        @Param("date") LocalDate date
    );

    @Query(value = """
        SELECT * FROM user_weak_points
        WHERE user_id = :userId
          AND is_improved = false
          AND (sr_state->>'next_review')::date <= :date
        ORDER BY (sr_state->>'ease_factor')::decimal ASC
        """, nativeQuery = true)
    List<UserWeakPointEntity> findAllDueReviews(@Param("userId") String userId, @Param("date") LocalDate date);

    boolean existsByUserIdAndQuestionText(String userId, String questionText);
}
```

**Step 2: 提交**

```bash
git add app/src/main/java/interview/guide/modules/profile/repository/
git commit -m "feat: add profile repositories

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: UserProfileService（画像读写）

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/service/UserProfileService.java`

**Step 1: 创建 UserProfileService**

```java
// app/src/main/java/interview/guide/modules/profile/service/UserProfileService.java
package interview.guide.modules.profile.service;

import interview.guide.modules.profile.entity.*;
import interview.guide.modules.profile.model.*;
import interview.guide.modules.profile.repository.*;
import interview.guide.modules.profile.model.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserProfileService {

    @Autowired private UserWeakPointRepository weakPointRepo;
    @Autowired private UserTopicMasteryRepository masteryRepo;
    @Autowired private UserProfileRepository profileRepo;
    @Autowired private SpacedRepetitionService srService;

    @Transactional
    public int enrollWeakPoints(String userId, List<WeakPointEnrollItem> items) {
        int count = 0;
        for (WeakPointEnrollItem item : items) {
            if (weakPointRepo.existsByUserIdAndQuestionText(userId, item.getQuestionText())) {
                continue; // 防止重复录入
            }
            UserWeakPointEntity entity = new UserWeakPointEntity();
            entity.setUserId(userId);
            entity.setTopic(item.getTopic());
            entity.setQuestionText(item.getQuestionText());
            entity.setAnswerSummary(item.getAnswerSummary());
            entity.setScore(BigDecimal.valueOf(item.getScore()));
            entity.setSource(item.getSource());
            entity.setSessionId(item.getSessionId());
            entity.setSrState(Map.of(
                "interval_days", 1,
                "ease_factor", 2.5,
                "repetitions", 0,
                "next_review", LocalDate.now().plusDays(1).toString(),
                "last_score", item.getScore()
            ));
            entity.setTimesSeen(1);
            weakPointRepo.save(entity);
            count++;
        }
        return count;
    }

    public List<UserWeakPointEntity> getDueReviews(String userId, String topic) {
        return weakPointRepo.findDueReviews(userId, topic, LocalDate.now());
    }

    public List<UserWeakPointEntity> getAllDueReviews(String userId) {
        return weakPointRepo.findAllDueReviews(userId, LocalDate.now());
    }

    @Transactional
    public Sm2Result submitReviewAnswer(Long weakPointId, double score) {
        UserWeakPointEntity entity = weakPointRepo.findById(weakPointId)
            .orElseThrow(() -> new RuntimeException("WeakPoint not found"));

        Map<String, Object> stateMap = entity.getSrState();
        Sm2State state = new Sm2State(
            ((Number) stateMap.get("interval_days")).intValue(),
            ((Number) stateMap.get("ease_factor")).doubleValue(),
            ((Number) stateMap.get("repetitions")).intValue(),
            LocalDate.parse((String) stateMap.get("next_review")),
            (Double) stateMap.get("last_score")
        );

        Sm2Result result = srService.sm2Update(state, score);

        Map<String, Object> newState = new HashMap<>(stateMap);
        newState.put("interval_days", result.intervalDays());
        newState.put("ease_factor", result.easeFactor());
        newState.put("repetitions", result.repetitions());
        newState.put("next_review", result.nextReview().toString());
        newState.put("last_score", score);
        entity.setSrState(newState);

        if (srService.isImproved(result.repetitions())) {
            entity.setIsImproved(true);
            entity.setImprovedAt(LocalDateTime.now());
        }

        entity.setLastSeen(LocalDateTime.now());
        entity.setTimesSeen(entity.getTimesSeen() + 1);
        weakPointRepo.save(entity);

        // 同时更新 topic mastery
        updateMasteryAfterReview(entity.getUserId(), entity.getTopic(), score);

        return result;
    }

    private void updateMasteryAfterReview(String userId, String topic, double score) {
        UserTopicMasteryEntity mastery = masteryRepo.findByUserIdAndTopic(userId, topic)
            .orElseGet(() -> {
                UserTopicMasteryEntity m = new UserTopicMasteryEntity();
                m.setUserId(userId);
                m.setTopic(topic);
                m.setScore(BigDecimal.valueOf(50.0));
                m.setSessionCount(0);
                return m;
            });

        int n = mastery.getSessionCount();
        double weight = Math.max(0.15, 1.0 / (n + 1));
        double newScore = mastery.getScore().doubleValue() * (1 - weight) + score * weight;
        mastery.setScore(BigDecimal.valueOf(Math.round(newScore * 10) / 10.0));
        mastery.setSessionCount(n + 1);
        mastery.setLastAssessed(LocalDateTime.now());
        masteryRepo.save(mastery);
    }

    public UserProfileDto getProfile(String userId) {
        // 构造 DTO，包含 mastery + weak points + stats
        // ...
    }
}
```

**Step 2: 提交**

```bash
git add app/src/main/java/interview/guide/modules/profile/service/UserProfileService.java
git commit -m "feat: add UserProfileService with enroll and review logic

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: LLM 画像提取

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/service/ProfileExtractService.java`
- Create: `app/src/main/resources/prompts/profile-extract-system.st`
- Create: `app/src/main/resources/prompts/profile-extract-user.st`

**Step 1: 创建 Prompt 模板**

```st
# profile-extract-system.st
你是一个面试教练的分析引擎。根据面试对话记录，提取关于候选人的结构化洞察。

提取规则：
- 每场面试最多 3 个弱项、2 个强项（宁缺毋滥）
- 弱项必须是具体的、可改进的，而非泛泛的"基础不扎实"
- 强项必须是有证据支撑的

返回严格 JSON 格式。
```

```st
# profile-extract-user.st
面试主题：{jobRole}
面试问题与用户回答：

{for each answer}
Q{index}: {question}
A: {answer}
评估: {existingScore}/10
---
{/for each}
```

**Step 2: 创建 ProfileExtractService**

使用 Spring AI 的 `StructuredOutputInvoker` 调用 LLM，解析返回的 JSON。

**Step 3: 提交**

---

### Task 7: REST API 端点

**Files:**
- Create: `app/src/main/java/interview/guide/modules/profile/controller/ProfileController.java`
- Modify: `app/src/main/java/interview/guide/modules/interview/controller/InterviewController.java`（报告页增加端点）

**Step 1: 创建 ProfileController**

```java
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired private UserProfileService profileService;
    @Autowired private ProfileExtractService extractService;

    @GetMapping
    public Result<UserProfileDto> getProfile(@RequestParam String userId) {
        return Result.success(profileService.getProfile(userId));
    }

    @PostMapping("/extract")
    public Result<ProfileExtractResult> extract(@RequestBody ExtractRequest req) {
        return Result.success(extractService.extractFromSession(req.getSessionId()));
    }
}
```

```java
@RestController
@RequestMapping("/api/review")
public class ReviewController {

    @Autowired private UserProfileService profileService;

    @PostMapping("/enroll")
    public Result<Integer> enroll(@RequestBody List<WeakPointEnrollItem> items, @RequestParam String userId) {
        int count = profileService.enrollWeakPoints(userId, items);
        return Result.success(count);
    }

    @GetMapping("/due")
    public Result<List<WeakPointDto>> getDueReviews(@RequestParam String userId,
            @RequestParam(required = false) String topic) {
        var reviews = topic != null
            ? profileService.getDueReviews(userId, topic)
            : profileService.getAllDueReviews(userId);
        return Result.success(reviews.stream().map(this::toDto).toList());
    }

    @PostMapping("/submit")
    public Result<Sm2Result> submitReview(@RequestBody ReviewSubmitRequest req) {
        return Result.success(profileService.submitReviewAnswer(req.getWeakPointId(), req.getScore()));
    }
}
```

**Step 2: 提交**

---

## Phase 2: 面试报告页改造

### Task 8: 报告页增加"录入复习计划"按钮

**Files:**
- Modify: `frontend/src/pages/InterviewReportPage.tsx`

**Step 1: 增加按钮**

在报告页底部操作区增加"录入复习计划"按钮，点击弹出确认弹窗。

**Step 2: 提交**

---

## Phase 3: 专项训练改造

### Task 9: 题目生成注入弱项上下文

**Files:**
- Modify: `app/src/main/java/interview/guide/modules/interview/service/QuestionGenerationService.java`

**Step 1: 注入 dueReviews 到 prompt**

```java
List<UserWeakPointEntity> dueReviews = profileService.getDueReviews(userId, topic);
if (!dueReviews.isEmpty()) {
    String weakContext = dueReviews.stream()
        .map(wp -> String.format("- [%s] %s (暴露%d次, EF=%.1f)",
            wp.getTopic(), wp.getQuestionText(), wp.getTimesSeen(),
            ((Number) wp.getSrState().get("ease_factor")).doubleValue()))
        .collect(Collectors.joining("\n"));
    promptContext += "\n\n历史弱项（优先考察）：\n" + weakContext;
}
```

**Step 2: 提交**

---

## Phase 4: Profile 前端页面

### Task 10: Profile 页面骨架

**Files:**
- Create: `frontend/src/pages/ProfilePage.tsx`
- Modify: `frontend/src/App.tsx`（增加路由）

**Step 1: 参考 TechSpar Profile.jsx 布局实现**

主要组件：
- `StatsCard`：练习统计（总次数、综合均分、分模式统计）
- `DomainTable`：能力地图（topic + 掌握度条 + 分区标签）
- `EvidenceTable`：弱项/强项/已改善列表（可筛选）
- `ScoreChart`：SVG 折线成长图

**Step 2: API 调用**

```typescript
// frontend/src/api/profile.ts
export const getProfile = () => request.get('/api/profile?userId=current');
export const extractProfile = (sessionId: number) =>
  request.post('/api/profile/extract', { sessionId });
```

**Step 3: 提交**

---

## 验证计划

1. **后端单元测试**：`mvn test -Dtest=SpacedRepetitionServiceTest`
2. **API 手动测试**：
   - `POST /api/review/enroll` → 弱项入库
   - `GET /api/review/due?userId=xxx&topic=MySQL` → 返回到期弱项
   - `POST /api/review/submit` → SM-2 状态更新
   - `GET /api/profile?userId=xxx` → 返回画像
3. **前端页面**：访问 `/profile` 验证布局和数据展示
4. **端到端**：面试结束 → 录入复习计划 → 专项训练 → 验证弱项优先出题
