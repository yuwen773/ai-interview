# 用户画像完善设计

> 日期：2026-05-28
> 范围：完善画像核心能力，不包含 JD 定向备面、录音复盘、Copilot Prep。

## 背景

当前项目已经有画像基础能力：知识点掌握度、弱项、强项、SM-2 复习状态，以及面试评估完成后的异步画像更新。Web 端也有个人画像页和知识图谱页。

现有主要问题是画像闭环不完整：

- 默认用户 ID 不一致。画像查询默认 `0`，面试评估写入 `default`，导致真实训练数据在画像页不可见。
- 已改善弱项没有独立查询入口。前端从 due reviews 里过滤 `isImproved`，通常拿不到已改善数据。
- 画像偏知识维度，缺少沟通、推理、项目叙事、自我校准等长期表现信号。
- 普通面试创建链路没有稳定使用画像上下文。
- 长期模式没有沉淀，无法把多次训练中的共性短板总结出来。

本设计采用分层增强：先修数据闭环，再新增表现画像和长期模式，最后让普通面试读取裁剪后的画像上下文。

## 目标

本轮交付目标：

- 统一画像主链路默认用户 ID 为 `default`。
- 支持活跃弱项、待复习弱项、已改善弱项独立查询和展示。
- 新增表现画像，覆盖沟通表达、推理分析、项目叙事、自我校准。
- 新增长期模式，沉淀跨 topic、跨 session 的稳定问题或优势。
- 普通面试创建时读取画像上下文，最多注入少量高价值弱项、行为信号和长期模式。
- 增加后端回归测试和前端构建验证。

非目标：

- 不实现 JD 定向备面。
- 不实现录音复盘。
- 不实现 Copilot Prep。
- 不重构语音面试主链路。
- 不重命名现有旧表字段。

## 数据模型

现有知识画像继续复用：

- `user_topic_mastery`
- `user_weak_points`
- `user_strong_points`

新增表字段使用当前数据库风格：表名和列名采用 `snake_case`，Java/TypeScript DTO 字段采用小驼峰。

### user_behavior_signals

`user_behavior_signals` 记录长期可复用的表现信号，不与知识弱项混写。

建议字段：

```sql
CREATE TABLE user_behavior_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    namespace VARCHAR(32) NOT NULL,
    signal_key VARCHAR(128) NOT NULL,
    polarity VARCHAR(16) NOT NULL,
    statement TEXT NOT NULL,
    evidence_json JSONB,
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
```

`namespace` 固定为：

- `communication`
- `reasoning`
- `narrative`
- `metacognition`

`polarity` 固定为：

- `POSITIVE`
- `NEGATIVE`
- `NEUTRAL`

`status` 固定为：

- `ACTIVE`
- `IMPROVING`
- `IMPROVED`
- `ARCHIVED`

行为信号更新规则：

- 同一 `user_id + namespace + signal_key` 重复出现时累加 `times_seen`，追加证据摘要，更新 `last_seen`。
- 负向信号出现明确正向改善证据时，状态可从 `ACTIVE` 转为 `IMPROVING` 或 `IMPROVED`。
- 证据不足时不新增信号。
- 证据只保存摘要，不保存过长原文。
- `evidence_json` 第一版固定为数组，每条证据包含 `topic`、`sessionId`、`summary`、`seenAt`。示例：

```json
[
  {
    "topic": "Redis",
    "sessionId": 123,
    "summary": "回答缓存一致性时缺少异常场景举例",
    "seenAt": "2026-05-28T10:00:00"
  }
]
```

- 合并证据时最多保留最近 5 条，避免画像记录无限增长。
- `signal_key` 不允许完全自由生成。Prompt 要求 LLM 输出小写 snake_case slug；后端在写入前执行 canonicalization：转小写、非字母数字替换为 `_`、连续 `_` 合并、长度限制 128。
- 第一版优先使用固定 key 族，LLM 只能从固定 key 族中选择，无法匹配时输出 `other_<short_slug>`。固定 key 族包括：
  - `communication_missing_example`
  - `communication_unclear_structure`
  - `communication_concise_summary`
  - `reasoning_boundary_case_gap`
  - `reasoning_complexity_unclear`
  - `reasoning_stepwise_analysis`
  - `narrative_missing_tradeoff`
  - `narrative_result_oriented`
  - `metacognition_uncertain_but_calibrated`
  - `metacognition_overconfident_without_evidence`

### user_profile_patterns

`user_profile_patterns` 记录跨 topic、跨 session 的长期模式。

建议字段：

```sql
CREATE TABLE user_profile_patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    pattern_type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    summary TEXT NOT NULL,
    related_topics JSONB,
    related_signal_ids JSONB,
    evidence_json JSONB,
    confidence NUMERIC(4, 3),
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

`pattern_type` 第一版支持：

- `KNOWLEDGE_GAP`
- `BEHAVIOR_RISK`
- `STRENGTH`

### user_profiles 扩展

在 `user_profiles` 上增加 consolidation 节流字段：

```sql
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS last_consolidated_at TIMESTAMP;
```

## 画像更新流程

当前 `ProfileMemoryService` 是 `Extract -> Update` 两阶段。本轮升级为轻量三阶段：

```text
面试评估完成
  -> ProfileMemoryService
  -> Stage 1 Extract：弱项、强项、表现信号
  -> Stage 2 Update：合并弱项、强项、表现信号
  -> Stage 3 Consolidation：满足节流条件时生成或更新长期模式
```

### Stage 1: Extract

扩展 `ProfileExtractResult`：

```java
public record ProfileExtractResult(
    List<WeakPointInsight> weakPoints,
    List<StrengthInsight> strengths,
    List<BehaviorSignalInsight> behaviorSignals
) {}
```

`BehaviorSignalInsight` 字段：

```java
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

提取阶段要求：

- 弱项和强项保持现有语义。
- 行为信号只提取可复用、可被后续训练验证的长期表现，不记录一次性情绪判断。
- 低置信度行为信号在 update 阶段可丢弃。

### Stage 2: Update

`ProfileUpdateService` 继续处理弱项和强项，新增行为信号操作。

行为信号操作：

- `ADD`：新增信号。
- `UPDATE`：同一信号累加次数和证据。
- `IMPROVE`：负向信号出现改善证据，转为 `IMPROVING` 或 `IMPROVED`。
- `NOOP`：证据不足或重复但无新增价值。

失败策略：

- LLM 决策失败时，弱项和强项沿用现有语义 fallback。
- 行为信号走确定性 fallback：按 `user_id + namespace + signal_key` 合并，低置信度丢弃。
- 行为信号失败不能影响弱项和强项写入。

### Stage 3: Consolidation

新增 `ProfileConsolidationService`，负责长期模式生成、节流判断和写入。

第一版触发条件满足任一即可：

- 距上次 consolidation 超过 24 小时。
- 活跃行为信号数量达到 5 条。
- 活跃弱项数量达到 10 条。
- 同一问题模式跨至少 2 个 topic 出现。

第一版“同一问题模式”的判定只使用确定性规则，不做额外聚类：

- 行为模式：同一 `namespace + signal_key` 出现在至少 2 个不同 topic 的证据中。
- 知识弱项模式：同一归一化弱项 key 出现在至少 2 个不同 topic。归一化弱项 key 由后端从弱项 `question_text` 生成，规则为去标点、去空白、转小写后取前 80 字符的稳定摘要；后续可替换为 embedding 聚类，但本轮不要求。
- 如果无法归一化或 topic 不足 2 个，不触发该条件。

Consolidation 失败只记录 warn，不回滚前两阶段更新。

## API 设计

保留现有 API：

```text
GET /api/profile?userId=default
GET /api/profile/strong-points?userId=default
GET /api/review/due?userId=default&topic=xxx
POST /api/review/enroll
POST /api/review/submit
```

新增弱项状态查询：

```text
GET /api/profile/weak-points?userId=default&status=ACTIVE|IMPROVED|DUE&topic=xxx
```

`status` 语义：

- `ACTIVE`：`is_improved = false` 的全部弱项，不要求已到复习时间。
- `IMPROVED`：`is_improved = true` 的全部弱项。
- `DUE`：`is_improved = false` 且 `sr_state->>'next_review'` 不为空，并且日期小于等于当前日期的弱项。`DUE` 是复习队列视图，不是生命周期状态。
- `topic` 为空时查询全部 topic；不为空时按 topic 精确过滤。

新增表现画像查询：

```text
GET /api/profile/behavior-signals?userId=default&namespace=communication|reasoning|narrative|metacognition&status=ACTIVE|IMPROVING|IMPROVED
```

新增长期模式查询：

```text
GET /api/profile/patterns?userId=default&status=ACTIVE
```

新增推荐查询：

```text
GET /api/profile/recommendations?userId=default
```

推荐接口第一版只返回可展示的推荐卡片，不要求立即实现专项训练模块。推荐来源包括到期弱项、低分 topic、负向行为信号和长期模式。
`ProfileRecommendationService` 第一版只做轻量聚合和排序，不引入新训练系统、不生成新训练任务、不持久化推荐结果。

默认用户 ID 调整：

- `ProfileController` 默认 `userId` 改为 `default`。
- `ReviewController` 默认 `userId` 改为 `default`。
- `KnowledgeGraphController` 默认 `userId` 改为 `default`。
- 前端 `profileApi` 默认 `userId` 改为 `default`。
- 面试评估画像更新继续使用 `default`。

## 服务边界

服务职责：

- `UserProfileService`：画像概览、弱项查询、复习相关逻辑。
- `ProfileExtractService`：从面试问答提取弱项、强项、行为信号。
- `ProfileUpdateService`：弱项、强项、行为信号的 LLM 决策与应用。
- `BehaviorSignalService`：表现信号查询、确定性合并、改善判断。
- `ProfileConsolidationService`：长期模式生成、节流判断和写入。
- `TrainingContextService`：读取画像快照，构建出题上下文。
- `ProfileRecommendationService`：生成画像页“下一步推荐”。

普通面试创建链路调整为：

```text
InterviewSessionService.createSession
  -> TrainingContextService.buildForInterview(default, jobRole, resumeId)
  -> InterviewQuestionService.generateQuestionsWithContext(...)
```

`InterviewSessionService` 不拼接画像 prompt。`TrainingContextService` 负责读取和裁剪画像；`InterviewQuestionService` 只消费裁剪后的上下文。

## 前端设计

`frontend/src/pages/ProfilePage.tsx` 继续作为主入口，结构调整为：

1. 总览：练习次数、综合均分、待复习、技能覆盖。
2. 知识掌握：技能分数图和 topic mastery 列表。
3. 弱项复习：活跃弱项、待复习、已改善，分别调用状态查询 API。
4. 强项沉淀：按 topic 展示长期优势。
5. 表现画像：按 `communication / reasoning / narrative / metacognition` 分组。
6. 长期模式：展示跨 topic 的规律、置信度、相关 topic。
7. 推荐训练：展示推荐卡片和推荐原因。

表现画像每条信号展示：

- 状态。
- 正向、负向或中性。
- 出现次数。
- 最近证据摘要。
- 最近出现时间。

前端约束：

- 无行为信号、无长期模式时展示空状态。
- 不使用 mock 数据填充真实画像区域。
- 已改善 tab 不再从 due reviews 过滤。
- 页面 API 默认用户改为 `default`。

## 出题上下文设计

`TrainingContextService` 输出结构化上下文，再裁剪成 prompt 段落。

普通面试第一版注入：

- 最多 5 条到期或高频活跃弱项。
- 最多 3 条低分 topic mastery。
- 最多 3 条负向或改善中的行为信号。
- 最多 2 条长期模式。
- 最多 2 条强项。

约束：

- 已改善弱项不会作为高优先级追问。
- 不注入完整历史回答，只注入摘要、topic 和必要证据摘要。
- 画像为空时退回当前题目生成逻辑。
- `TrainingContextService` 失败时，面试创建继续，使用空上下文。
- prompt 长度由 `TrainingContextService` 控制，避免在 `InterviewQuestionService` 中散落裁剪逻辑。

## 错误处理

错误处理分级：

- 评估报告生成是主链路，画像更新失败不影响报告。
- `ProfileExtractService` 整体提取失败：本次画像更新结束，记录 error。
- 行为信号解析失败：丢弃行为信号部分，弱项和强项继续更新。
- `ProfileUpdateService` LLM 决策失败：弱项和强项走现有 fallback，行为信号走确定性 fallback。
- `ProfileConsolidationService` 失败：记录 warn，不回滚画像更新。
- `TrainingContextService` 失败：面试创建继续，使用空画像上下文。

## 迁移策略

新增 Flyway 迁移：

- 新建 `user_behavior_signals`。
- 新建 `user_profile_patterns`。
- 给 `user_profiles` 增加 `last_consolidated_at`。

默认用户 ID 迁移：

- 主路径统一为 `default`。
- 实施一次 Flyway 数据迁移，将画像相关表中 `user_id = '0'` 的数据改为 `default`。
- 如果 `default` 已存在同类唯一键冲突，最终策略是保留 `default` 数据，删除冲突的 `0` 数据；非冲突数据迁移到 `default`。迁移完成后画像相关表不再保留 `user_id = '0'` 的记录。
- 冲突判断按各表唯一约束或业务唯一键执行：
  - `user_profiles`：`user_id`。
  - `user_topic_mastery`：`user_id + topic`。
  - `user_weak_points`：`user_id + question_text`。
  - `user_strong_points`：`user_id + topic + description`，该表当前没有唯一约束，迁移脚本按该业务键去重。
  - `user_behavior_signals`：`user_id + namespace + signal_key`。
  - `user_profile_patterns`：第一版迁移前不存在历史 `0` 数据，无需处理。
- 查询层不做 `0` 兼容，避免长期双默认用户。
- 测试数据和前端默认值同步改为 `default`。

旧表策略：

- 不重命名已有旧表字段。
- 新表和新列保持 `snake_case`。
- Java 实体使用 `@Column(name = "...")` 显式映射。

## 测试策略

后端单元测试：

- 弱项状态查询：`ACTIVE / IMPROVED / DUE`。
- 行为信号新增、重复合并、改善状态转换。
- consolidation 节流条件。
- `TrainingContextService` 裁剪数量和空画像降级。
- `ProfileRecommendationService` 基于弱项、信号、模式生成推荐。

后端集成或服务测试：

- 面试评估后画像更新使用 `default`。
- `GET /api/profile/weak-points?status=IMPROVED` 返回已改善弱项。
- 普通面试创建调用画像上下文生成。
- 行为信号失败不影响弱项和强项更新。

前端验证：

- `cd frontend && pnpm build`。
- Profile 页在无数据、有弱项、有行为信号、有长期模式时不报错。
- 已改善 tab 使用新 API 数据。

最终验证：

- `mvn test`。
- `cd frontend && pnpm build`。

## 验收标准

- 完成一次普通面试后，画像写入和画像页读取使用同一个用户 ID。
- 活跃弱项、待复习、已改善能独立展示。
- 面试完成后能沉淀至少一种表现信号。
- 重复行为信号会累加 `times_seen`，不会无限新增相似项。
- 满足节流条件时能生成长期模式。
- 新建普通面试会读取画像上下文。
- 画像服务异常不会阻断面试创建或报告生成。
- 后端测试通过，前端生产构建通过。
