# 面试日程管理模块设计方案

> 参考 `interview-guide` (Gradle) `interviewschedule` 模块设计
>
> 目标项目：`ai-interview` (Maven)
>
> 设计日期：2026-05-28

---

## 一、模块概述

| 项目 | 内容 |
|------|------|
| **模块名** | `interview-schedule` |
| **定位** | 面试日程管理：创建/查看/更新/删除面试日程，AI 解析面试邀约 |
| **参考实现** | `D:\Work\code\interview-guide\modules\interviewschedule\` |
| **实现方式** | 完全参考 + 适配 Maven 包结构 |

---

## 二、功能范围

### 2.1 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 日程创建 | HR/面试官创建面试记录（公司、岗位、时间、类型、链接等） | P0 |
| 日程查询 | 按 ID 查询、按时间范围查询、按状态过滤 | P0 |
| 日程更新 | 更新除状态外的字段（公司、岗位、时间等） | P0 |
| 日程删除 | 删除面试记录 | P0 |
| 状态更新 | 更新日程状态（PENDING → COMPLETED / CANCELLED / RESCHEDULED） | P0 |
| AI 解析 | 解析面试邀约文本（飞书/腾讯会议/Zoom 格式识别） | P1 |

### 2.2 非功能性

- 与现有 `llmprovider` 模块集成（用于 AI 解析）
- 使用 Flyway 迁移脚本管理数据库
- 与现有 `Result<T>` 响应格式保持一致

---

## 三、数据模型

### 3.1 Entity

**表名**：`interview_schedule`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| company_name | VARCHAR(255) | NOT NULL | 公司名称 |
| position | VARCHAR(255) | NOT NULL | 岗位名称 |
| interview_time | TIMESTAMP | NOT NULL | 面试时间 |
| interview_type | VARCHAR(50) | - | ONSITE / VIDEO / PHONE |
| meeting_link | TEXT | - | 会议链接 |
| round_number | INT | DEFAULT 1 | 第几轮面试 |
| interviewer | VARCHAR(255) | - | 面试官姓名 |
| notes | TEXT | - | 备注 |
| status | VARCHAR(50) | NOT NULL | PENDING / COMPLETED / CANCELLED / RESCHEDULED |
| created_at | TIMESTAMP | - | 创建时间 |
| updated_at | TIMESTAMP | - | 更新时间 |

### 3.2 状态枚举

```
PENDING      — 待面试（默认）
COMPLETED    — 已完成
CANCELLED    — 已取消
RESCHEDULED  — 已改期
```

---

## 四、API 设计

**基础路径**：`/api/interview-schedule`

### 4.1 接口清单

| 方法 | 路径 | 说明 | 请求体 | 返回 |
|------|------|------|--------|------|
| POST | `/parse` | AI 解析面试邀约文本 | ParseRequest | ParseResponse |
| POST | `/` | 创建面试记录 | CreateInterviewRequest | InterviewScheduleDTO |
| GET | `/{id}` | 根据 ID 查询 | - | InterviewScheduleDTO |
| GET | `/` | 查询列表（支持过滤） | - | List<InterviewScheduleDTO> |
| PUT | `/{id}` | 更新面试记录 | CreateInterviewRequest | InterviewScheduleDTO |
| DELETE | `/{id}` | 删除面试记录 | - | void |
| PATCH/PUT | `/{id}/status` | 更新状态 | status 参数 | InterviewScheduleDTO |

### 4.2 请求/响应模型

**CreateInterviewRequest**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| companyName | String | @NotBlank | 公司名称 |
| position | String | @NotBlank | 岗位名称 |
| interviewTime | LocalDateTime | @NotNull | 面试时间 |
| interviewType | String | - | ONSITE / VIDEO / PHONE |
| meetingLink | String | - | 会议链接 |
| roundNumber | Integer | 默认 1 | 第几轮 |
| interviewer | String | - | 面试官 |
| notes | String | - | 备注 |

**InterviewScheduleDTO**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| companyName | String | 公司名称 |
| position | String | 岗位名称 |
| interviewTime | LocalDateTime | 面试时间 |
| interviewType | String | 面试形式 |
| meetingLink | String | 会议链接 |
| roundNumber | Integer | 第几轮 |
| interviewer | String | 面试官 |
| notes | String | 备注 |
| status | InterviewStatus | 状态 |
| createdAt | LocalDateTime | 创建时间 |
| updatedAt | LocalDateTime | 更新时间 |

**ParseRequest**

| 字段 | 类型 | 说明 |
|------|------|------|
| rawText | String | @NotBlank 原始邀约文本 |
| source | String | 来源平台（feishu/tencent/zoom） |

**ParseResponse**

| 字段 | 类型 | 说明 |
|------|------|------|
| success | Boolean | 是否解析成功 |
| data | CreateInterviewRequest | 解析结果（成功时） |
| confidence | Double | 置信度（0.0-1.0） |
| parseMethod | String | 解析方式（rule / ai / none） |
| log | String | 解析日志 |

---

## 五、服务设计

### 5.1 InterviewScheduleService

| 方法 | 说明 |
|------|------|
| create(request) | 创建日程，状态默认为 PENDING |
| update(id, request) | 更新日程（除状态外） |
| delete(id) | 删除日程 |
| updateStatus(id, status) | 更新状态 |
| getById(id) | 按 ID 查询 |
| getAll(status, start, end) | 按条件查询列表 |

### 5.2 InterviewParseService

| 方法 | 说明 |
|------|------|
| parse(rawText, source) | 解析面试邀约文本 |

**解析策略**（两阶段）：

1. **规则解析**（优先）：识别飞书/腾讯会议/Zoom 格式
2. **AI 解析**（fallback）：调用 LLM 提取结构化信息

---

## 六、包结构

```
modules/schedule/
├── controller/
│   └── InterviewScheduleController.java
├── model/
│   ├── InterviewScheduleEntity.java
│   ├── InterviewScheduleDTO.java
│   ├── CreateInterviewRequest.java
│   ├── InterviewStatus.java
│   ├── ParseRequest.java
│   └── ParseResponse.java
├── repository/
│   └── InterviewScheduleRepository.java
├── service/
│   ├── InterviewScheduleService.java
│   └── InterviewParseService.java
```

**与 interview-guide 映射关系**：

| interview-guide | ai-interview |
|-----------------|--------------|
| `interview.guide.modules.interviewschedule` | `interview.guide.modules.schedule` |

---

## 七、技术实现要点

### 7.1 AI 解析集成

- 使用现有的 `LlmProviderRegistry` 获取 ChatClient
- 复用 `PromptSanitizer` 进行输入清洗
- 解析 Prompt 参考 interview-guide 的实现

### 7.2 数据库迁移

使用 Flyway 脚本：

```sql
-- V1.0.0__create_interview_schedule.sql
CREATE TABLE interview_schedule (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    interview_time TIMESTAMP NOT NULL,
    interview_type VARCHAR(50),
    meeting_link TEXT,
    round_number INT DEFAULT 1,
    interviewer VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 7.3 与现有模块的关系

- **独立模块**：不依赖 resume / interview / knowledgebase
- **可选依赖 llmprovider**：用于 AI 解析功能

---

## 八、工作量评估

| 任务 | 工时 |
|------|------|
| 创建模块骨架、包结构 | 1h |
| 编写 Flyway 迁移脚本 | 0.5h |
| 实现 Entity + Repository | 1h |
| 实现 InterviewScheduleService | 2h |
| 实现 InterviewParseService | 4h |
| 实现 Controller | 1h |
| 单元测试 | 2h |
| **合计** | **约 11.5h** |

---

## 九、验收标准

| 检查项 | 验收条件 |
|--------|----------|
| 日程 CRUD | 创建/查询/更新/删除正常返回 200 |
| 状态流转 | PENDING → COMPLETED / CANCELLED / RESCHEDULED 正常 |
| AI 解析 | 飞书/腾讯会议/Zoom 格式文本解析成功 |
| 数据库 | Flyway 迁移执行成功，表结构正确 |
| 编译 | `mvn compile` 无错误 |
