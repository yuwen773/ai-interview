# SM-2 间隔重复 + 用户画像系统设计方案

> 日期：2026-04-15
> 状态：已批准
> 目标：为 ai-interview 平台增加用户能力追踪和复习调度能力

---

## 1. 背景与目标

ai-interview 目前的问题：**没有让用户"回来"的机制**。面试结束 → 用户离开 → 可能再也不来。

TechSpar 项目的核心价值验证：**SM-2 间隔重复 + 用户画像**可以将面试工具升级为持续学习平台。

**核心目标：**
1. 面试结束后识别弱项，录入复习计划（SM-2 调度）
2. 下次专项训练时自动优先出弱项相关题目
3. Profile 页展示能力成长轨迹

---

## 2. 设计决策记录

| 决策点 | 选项 | 选择 | 理由 |
|--------|------|------|------|
| 复习触发方式 | A. 独立复习页面 | ❌ | TechSpar 验证：独立复习页不如在训练中自然复习 |
| 复习触发方式 | B. 训练时优先出弱项 | ✅ | 用户无需额外操作，润物无声 |
| 弱项录入时机 | A. 自动 | ❌ | 误判风险，用户无控制感 |
| 弱项录入时机 | B. 用户主动确认 | ✅ | 报告页确认，数据质量更高 |
| SM-2 存储位置 | A. 独立表 | ❌ | 语义内聚性差 |
| SM-2 存储位置 | B. 内嵌 weak_point JSONB | ✅ | TechSpar 验证，数据紧凑 |
| Mastery 计算 | A. SM-2 驱动 | ⚠️ | 太机械 |
| Mastery 计算 | B. LLM 综合评估 | ⚠️ | 调用频繁 |
| Mastery 计算 | C. 混合（指数移动平均） | ✅ | 兼顾实时性和准确性 |
| 画像可见性 | A. 公开可分享 | ❌ | 隐私风险 |
| 画像可见性 | B. 完全私有 | ✅ | 默认私有 |

---

## 3. 数据模型

### 3.1 弱项表（核心，SM-2 内嵌）

```sql
CREATE TABLE user_weak_points (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    topic           VARCHAR(64) NOT NULL,           -- 'MySQL', 'Redis', 'Java并发'
    question_text   TEXT NOT NULL,                   -- 被标记的题目原文
    answer_summary  TEXT,                             -- 上次回答摘要（复习上下文）
    score           DECIMAL(5,2),                   -- 被标记时的原始分数 0-10
    source          VARCHAR(32) DEFAULT 'INTERVIEW',  -- 来源
    session_id      BIGINT,                          -- 关联面试 session

    -- SM-2 调度状态（JSONB 内嵌）
    sr_state        JSONB DEFAULT
        '{"interval_days":1,"ease_factor":2.5,"repetitions":0,"next_review":"2026-04-16","last_score":null}',

    is_improved     BOOLEAN DEFAULT FALSE,           -- 是否已掌握
    improved_at     TIMESTAMP,
    times_seen      INT DEFAULT 1,                  -- 暴露次数
    first_seen      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_user_topic_question UNIQUE (user_id, question_text)
);

-- 复习查询索引（只索引未改善的）
CREATE INDEX idx_weak_due_review
    ON user_weak_points (user_id, (sr_state->>'next_review'::date))
    WHERE is_improved = FALSE;

CREATE INDEX idx_weak_user_topic
    ON user_weak_points (user_id, topic)
    WHERE is_improved = FALSE;
```

### 3.2 技能掌握度表

```sql
CREATE TABLE user_topic_mastery (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    topic           VARCHAR(64) NOT NULL,
    score           DECIMAL(5,2) DEFAULT 50.0,      -- 0-100，指数移动平均
    session_count   INT DEFAULT 0,                  -- 涉及此 topic 的面试次数
    notes           TEXT,                           -- LLM 描述的掌握情况
    last_assessed   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_user_topic_mastery UNIQUE (user_id, topic)
);

CREATE INDEX idx_mastery_user ON user_topic_mastery (user_id);
```

### 3.3 用户画像主表（轻量）

```sql
CREATE TABLE user_profiles (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL UNIQUE,
    target_role VARCHAR(128),                       -- 目标职位
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. SM-2 算法实现

### 4.1 核心公式

```
quality = mapScoreToQuality(score_0_10)
  0-2分 → 0（完全跑偏）
  3-4分 → 2（有印象但理解有误）
  5分   → 3（大方向对但不够深入）
  6-7分 → 4（理解正确且有自己的思考）
  8-10分 → 5（深入透彻）

通过 quality 计算：
  quality >= 3（通过）：
    reps == 0 → interval = 1天
    reps == 1 → interval = 3天
    reps >= 2 → interval = interval × ease_factor
    reps++
  quality < 3（失败）：
    interval = 1天
    reps = 0

EF 更新：max(1.3, EF + (0.1 - (5-quality) × (0.08 + (5-quality) × 0.02)))
```

### 4.2 Java 实现

```java
@Service
public class SpacedRepetitionService {

    public record Sm2Result(
        int intervalDays,
        double easeFactor,
        int repetitions,
        LocalDate nextReview
    ) {}

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
}
```

### 4.3 弱项自动归档规则

```
满足以下任一条件 → is_improved = TRUE：
  1. reps >= 3（同一道题连续答对 3 次）

满足以下条件 → is_archived = TRUE（不再出现）：
  1. last_seen 距今 > 60 天
  2. last_seen 距今 > 30 天 AND times_seen <= 2
```

---

## 5. Mastery 指数移动平均

```java
public void updateMasteryAfterReview(String userId, String topic, double score) {
    UserTopicMastery mastery = masteryRepo.findByUserIdAndTopic(userId, topic)
        .orElse(new UserTopicMastery(userId, topic, 50.0, 0));

    int n = mastery.getSessionCount();
    // weight 上限 0.15，防止单次影响过大
    double weight = Math.max(0.15, 1.0 / (n + 1));
    double newScore = mastery.getScore() * (1 - weight) + score * weight;

    mastery.setScore(Math.round(newScore * 10) / 10.0);
    mastery.setSessionCount(n + 1);
    mastery.setUpdatedAt(LocalDateTime.now());
    masteryRepo.save(mastery);
}
```

---

## 6. LLM 画像提取

### 6.1 提取 Prompt

```
你是一个面试教练的分析引擎。根据面试对话记录，提取关于候选人的结构化洞察。

返回 JSON：
{
    "weak_points": [
        {"point": "对 MySQL 索引失效场景回答不完整", "topic": "MySQL", "score": 4.0}
    ],
    "strong_points": [
        {"point": "Redis 持久化机制理解准确", "topic": "Redis"}
    ],
    "topic_mastery": {
        "MySQL": {"notes": "索引相关知识扎实，但深入场景稍弱"}
    },
    "session_summary": "本次面试表现...",
    "avg_score": 6.5
}
```

### 6.2 弱项入库时机

```
面试报告页
    │
    ├─ 用户点击"录入复习计划"
    │
    ├─ 调用 /api/profile/extract 获得 LLM 识别的弱项列表
    │
    ├─ 用户在弹窗中确认/修改弱项
    │
    └─ 调用 /api/review/enroll 批量写入
        └─ 每条初始 sr_state = {interval:1, ef:2.5, reps:0, next_review:明天}
```

---

## 7. API 设计

### 7.1 复习相关

```
POST /api/review/enroll
  批量录入复习计划
  Body: [
    {
      "topic": "MySQL",
      "questionText": "为什么有些查询不走索引？",
      "answerSummary": "只提到了最左前缀原则，未涉及范围查询...",
      "score": 4.0,
      "source": "INTERVIEW",
      "sessionId": 123
    }
  ]
  Response: { "enrolled": 3 }


GET  /api/review/due?topic=MySQL
  获取该 topic 到期复习的弱项（供题目生成参考）
  Response: [
    {
      "id": 1,
      "topic": "MySQL",
      "questionText": "...",
      "answerSummary": "...",
      "srState": {...}
    }
  ]
```

### 7.2 画像相关

```
GET  /api/profile
  获取完整用户画像
  Response: {
    "targetRole": "Java后端",
    "topicMastery": {
      "MySQL": {"score": 55.0, "notes": "...", "sessionCount": 3},
      "Redis": {"score": 82.0, "notes": "...", "sessionCount": 2}
    },
    "weakPoints": [...],
    "strongPoints": [...],
    "stats": {
      "totalSessions": 10,
      "avgScore": 6.5,
      "scoreHistory": [...]
    }
  }

PUT  /api/profile/target-role
  更新目标职位

POST /api/profile/extract
  从面试记录提取弱项/强项（用户触发）
  Body: { "sessionId": 123 }
  Response: {
    "weakPoints": [...],
    "strongPoints": [...],
    "topicMastery": {...}
  }
```

---

## 8. 页面改造

### 8.1 面试报告页（改造）

**新增"录入复习计划"按钮：**
- 位置：报告页底部操作区
- 点击 → 弹出弱项确认弹窗
- 弹窗内容：LLM 识别的弱项列表，用户可勾选/取消/添加
- 确认后 → 调用 `/api/review/enroll`

### 8.2 专项训练页（改造）

**题目生成时注入弱项上下文：**
```java
List<WeakPoint> dueReviews = weakPointRepo.findDueReviews(userId, topic);
// → 按 EF 升序（最难的最先出）

String weakPointContext = dueReviews.stream()
    .map(wp -> String.format("- [%s] %s (暴露%d次)",
        wp.getTopic(), wp.getQuestionText(), wp.getTimesSeen()))
    .collect(Collectors.joining("\n"));

// 加入 prompt：优先考察以下弱项相关题目
```

**用户感知：** "系统知道我上次哪里答得不好，这次专门练这个"

### 8.3 Profile 页 `/profile`（新增）

参考 TechSpar `Profile.jsx` 布局：

```
┌──────────────────────────────────────────────────────────┐
│ 个人画像                                                 │
│ 12次回答分析 | 5次完整面试 | 上次更新 4月15日           │
├──────────────────────────────────────────────────────────┤
│ 练习统计                                                 │
│ ┌────────┬─────────┬──────────────────────────┐          │
│ │总练习  │综合均分 │ 简历面试  3次/6.5分     │          │
│ │  5     │  6.5    │ 专项训练  2次/6.0分     │          │
│ └────────┴─────────┴──────────────────────────┘          │
├────────────────────────┬─────────────────────────────────┤
│ 当前重点                │ 最近信号                        │
│ ┌──────────────────┐  │ ┌────────────────────────────┐  │
│ │ 主推荐：MySQL    │  │ │ 最近改善：索引失效场景     │  │
│ │ 55/100  待补2    │  │ │ 稳定得分：Redis持久化      │  │
│ │ ██████░░░░░     │  │ └────────────────────────────┘  │
│ └──────────────────┘  │                                  │
├────────────────────────┴─────────────────────────────────┤
│ 证据库    [全部] [待改进] [强项] [已改善]                 │
│ ┌──────────────────────────────────────────────────────┐│
│ │ ● MySQL 索引失效场景         MySQL   3次    04-10   ││
│ │ ● Redis 持久化机制理解准确   Redis   1次    04-08   ││
│ └──────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│ 成长趋势                                                 │
│ ┌──────────────────────────────────────────────────────┐│
│ │     ╭╮                                               ││
│ │    ╭╯ ╰╮     ← 折线图 SVG                           ││
│ │  ╭╯    ╰───                                         ││
│ │──╯                                                   ││
│ └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## 9. TechSpar 参考实现

### 9.1 关键文件对应

| TechSpar | ai-interview | 说明 |
|----------|-------------|------|
| `backend/memory.py` | `UserProfileService.java` | 用户画像管理 |
| `backend/spaced_repetition.py` | `SpacedRepetitionService.java` | SM-2 算法 |
| `backend/vector_memory.py` | 复用 pgvector | 向量语义搜索 |
| `backend/prompts/interviewer.py` | `resources/prompts/profile-extract.st` | LLM 提取 prompt |
| `frontend/src/pages/Profile.jsx` | `frontend/src/pages/ProfilePage.tsx` | 画像页（新增） |
| `frontend/src/pages/TopicDetail.jsx` | - | Topic 详情页（不实现） |

### 9.2 TechSpar 关键设计借鉴

1. **SM-2 内嵌于 weak_point**：`sr` 字段直接存在 JSONB 里
2. **两阶段画像更新**：Extract（LLM 提取）→ Update（Mem0 风格 ADD/UPDATE/NOOP）
3. **弱项自动归档**：`last_seen > 60d` 或 `> 30d 且 times_seen <= 2`
4. **Mastery 指数移动平均**：`weight = max(0.15, 1/(n+1))`
5. **Profile 页分区**：补课区（<40）、过渡区（40-70）、优势区（>=70）

---

## 10. 实施计划

### Phase 1：后端基础设施（1 周）
- [ ] 数据库表：`user_weak_points`、`user_topic_mastery`、`user_profiles`
- [ ] `SpacedRepetitionService`：SM-2 算法
- [ ] `UserProfileService`：画像读写
- [ ] API 端点： enroll、due、extract、profile

### Phase 2：面试报告页改造（0.5 周）
- [ ] 报告页增加"录入复习计划"按钮
- [ ] 弱项确认弹窗（可编辑列表）
- [ ] 调用 `/api/review/enroll`

### Phase 3：专项训练改造（0.5 周）
- [ ] 题目生成时注入 `dueReviews` 上下文
- [ ] 优先出弱项相关题

### Phase 4：Profile 页（1 周）
- [ ] Profile 页面（参考 TechSpar 布局）
- [ ] 练习统计卡片
- [ ] 证据库列表（弱项/强项/已改善）
- [ ] 成长趋势 SVG 图表

---

## 11. 不纳入本期范围

- 独立复习页面 + 复习作答流程（TechSpar 验证：非必要）
- 邮件/通知召回（无邮件基础设施）
- 画像公开分享
- TopicDetail 详情页
- LangGraph 状态机

---

*本文档由 Claude Code 生成，经 TechSpar 项目分析后修订*
