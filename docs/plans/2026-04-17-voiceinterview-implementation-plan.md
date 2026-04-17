# Voiceinterview 模块集成实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 interview-guide 的 voiceinterview 模块完整集成到 ai-interview，实现实时语音面试功能

**Architecture:** 直接移植 voiceinterview 模块（与 interview-guide 保持一致），包含 WebSocket 实时通信、阿里云 ASR/TTS/LLM 服务集成、多阶段面试流程、Redis Stream 异步评估

**Tech Stack:** Spring Boot 3.5, Spring AI 1.1, WebSocket, 阿里云 DashScope (qwen3-asr-flash-realtime, qwen-tts-realtime), Redis Streams, PostgreSQL/JPA

---

## Phase 1: 数据库与基础设施

### Task 1: 创建 Flyway Migration 文件

**Files:**
- Create: `app/src/main/resources/db/migration/V2026-04-18__add_voice_interview_tables.sql`

**Step 1: 创建 Migration 文件**

```sql
CREATE TABLE voice_interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    role_type VARCHAR(64) NOT NULL,
    skill_id VARCHAR(64) DEFAULT 'java-backend',
    difficulty VARCHAR(16) DEFAULT 'mid',
    custom_jd_text TEXT,
    resume_id BIGINT,
    intro_enabled BOOLEAN DEFAULT TRUE,
    tech_enabled BOOLEAN DEFAULT TRUE,
    project_enabled BOOLEAN DEFAULT TRUE,
    hr_enabled BOOLEAN DEFAULT TRUE,
    llm_provider VARCHAR(50) DEFAULT 'dashscope',
    current_phase VARCHAR(20),
    status VARCHAR(20),
    planned_duration INTEGER DEFAULT 30,
    actual_duration INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    paused_at TIMESTAMP,
    resumed_at TIMESTAMP,
    evaluate_status VARCHAR(20),
    evaluate_error VARCHAR(500)
);

CREATE TABLE voice_interview_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT,
    message_type VARCHAR(20),
    phase VARCHAR(20),
    user_recognized_text TEXT,
    ai_generated_text TEXT,
    timestamp TIMESTAMP,
    sequence_num INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE voice_interview_evaluations (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT UNIQUE,
    overall_score INTEGER,
    overall_feedback TEXT,
    question_evaluations_json TEXT,
    strengths_json TEXT,
    improvements_json TEXT,
    reference_answers_json TEXT,
    interviewer_role VARCHAR(255),
    interview_date TIMESTAMP,
    created_at TIMESTAMP
);

CREATE INDEX idx_voice_interview_messages_session_id ON voice_interview_messages(session_id);
CREATE INDEX idx_voice_interview_sessions_user_id ON voice_interview_sessions(user_id);
```

**Step 2: 验证 Migration 语法**

运行: `cd app && mvn flyway:migrate -Dflyway.validateOnMigrate=false -X`
Expected: Migration 执行成功，表创建完成

**Step 3: Commit**

```bash
git add app/src/main/resources/db/migration/V2026-04-18__add_voice_interview_tables.sql
git commit -m "feat(voiceinterview): 创建语音面试表结构"
```

---

### Task 2: 移植配置类 VoiceInterviewProperties

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/config/VoiceInterviewProperties.java`
- Reference: `D:\Work\code\interview-guide\...\voiceinterview\config\VoiceInterviewProperties.java`

**Step 1: 创建配置类**

从 interview-guide 复制 `VoiceInterviewProperties.java`，调整包名为 `interview.guide.modules.voiceinterview.config`

**Step 2: 添加配置到 application.yml**

```yaml
app:
  voice-interview:
    llm-provider: dashscope
    qwen:
      asr:
        model: qwen3-asr-flash-realtime
        url: wss://dashscope.aliyuncs.com/api-ws/v1/realtime
        language: zh
        format: pcm
        sample-rate: 16000
        enable-turn-detection: true
        turn-detection-type: server_vad
        turn-detection-silence-duration-ms: 1000
      tts:
        model: qwen-tts-realtime
        voice: Cherry
        format: pcm
        sample-rate: 24000
        mode: commit
        language-type: Chinese
    phase:
      intro:
        min-duration: 3
        suggested-duration: 5
        max-duration: 8
        min-questions: 2
        max-questions: 5
      tech:
        min-duration: 8
        suggested-duration: 10
        max-duration: 15
        min-questions: 3
        max-questions: 8
      project:
        min-duration: 8
        suggested-duration: 10
        max-duration: 15
        min-questions: 2
        max-questions: 5
      hr:
        min-duration: 3
        suggested-duration: 5
        max-duration: 8
        min-questions: 2
        max-questions: 5
    planned-duration: 30
```

**Step 3: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/config/VoiceInterviewProperties.java
git add app/src/main/resources/application.yml
git commit -m "feat(voiceinterview): 添加语音面试配置类"
```

---

### Task 3: 移植 WebSocket 配置

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/config/WebSocketConfig.java`

**Step 1: 创建 WebSocket 配置**

```java
package interview.guide.modules.voiceinterview.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import interview.guide.modules.voiceinterview.handler.VoiceInterviewWebSocketHandler;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final VoiceInterviewWebSocketHandler voiceInterviewWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(voiceInterviewWebSocketHandler, "/ws/voice-interview/{sessionId}")
                .setAllowedOrigins("*");
    }
}
```

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/config/WebSocketConfig.java
git commit -m "feat(voiceinterview): 添加 WebSocket 配置"
```

---

## Phase 2: 模型层

### Task 4: 移植实体类

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/model/VoiceInterviewSessionEntity.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/model/VoiceInterviewMessageEntity.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/model/VoiceInterviewEvaluationEntity.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/model/VoiceInterviewSessionStatus.java`

**Step 1: 创建所有实体类**

从 interview-guide 复制并调整包名。关键修改：
- 移除 `interview.guide.common.model.AsyncTaskStatus` 引用，改为本地枚举或使用 String
- 调整导入语句

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/model/
git commit -m "feat(voiceinterview): 添加语音面试实体类"
```

---

### Task 5: 移植 Repository

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/repository/VoiceInterviewSessionRepository.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/repository/VoiceInterviewMessageRepository.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/repository/VoiceInterviewEvaluationRepository.java`

**Step 1: 创建所有 Repository**

```java
// VoiceInterviewSessionRepository.java
package interview.guide.modules.voiceinterview.repository;

import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoiceInterviewSessionRepository extends JpaRepository<VoiceInterviewSessionEntity, Long> {
    List<VoiceInterviewSessionEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<VoiceInterviewSessionEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, VoiceInterviewSessionStatus status);
    Optional<VoiceInterviewSessionEntity> findByIdAndUserId(Long id, String userId);
}
```

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/repository/
git commit -m "feat(voiceinterview): 添加语音面试 Repository"
```

---

## Phase 3: DTO 层

### Task 6: 移植 DTO 类

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/CreateSessionRequest.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/SessionMetaDTO.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/SessionResponseDTO.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/VoiceEvaluationDetailDTO.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/VoiceEvaluationStatusDTO.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/VoiceInterviewMessageDTO.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/WebSocketControlMessage.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/dto/WebSocketSubtitleMessage.java`

**Step 1: 创建所有 DTO**

从 interview-guide 复制所有 DTO 文件，调整包名

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/dto/
git commit -m "feat(voiceinterview): 添加语音面试 DTO"
```

---

## Phase 4: 服务层

### Task 7: 移植 DashscopeLlmService

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/service/DashscopeLlmService.java`

**Step 1: 创建服务**

从 interview-guide 复制，核心功能：
- 流式 LLM 对话（使用 Spring AI ChatClient）
- 句子级流式响应（边生成边触发 TTS）

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/service/DashscopeLlmService.java
git commit -m "feat(voiceinterview): 添加 Dashscope LLM 服务"
```

---

### Task 8: 移植 QwenAsrService

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/service/QwenAsrService.java`

**Step 1: 创建 ASR 服务**

从 interview-guide 复制，核心功能：
- WebSocket 连接阿里云 qwen3-asr-flash-realtime
- 实时语音识别
- 支持服务端 VAD

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/service/QwenAsrService.java
git commit -m "feat(voiceinterview): 添加阿里云 ASR 服务"
```

---

### Task 9: 移植 QwenTtsService

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/service/QwenTtsService.java`

**Step 1: 创建 TTS 服务**

从 interview-guide 复制，核心功能：
- WebSocket 连接阿里云 qwen-tts-realtime
- 实时语音合成
- 支持分块音频推送

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/service/QwenTtsService.java
git commit -m "feat(voiceinterview): 添加阿里云 TTS 服务"
```

---

### Task 10: 移植 VoiceInterviewPromptService

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/service/VoiceInterviewPromptService.java`

**Step 1: 创建 Prompt 服务**

从 interview-guide 复制，核心功能：
- 生成系统提示词
- 包含语音面试输出约束
- 技能指令、简历上下文

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/service/VoiceInterviewPromptService.java
git commit -m "feat(voiceinterview): 添加语音面试 Prompt 服务"
```

---

### Task 11: 移植 VoiceInterviewEvaluationService

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/service/VoiceInterviewEvaluationService.java`

**Step 1: 创建评估服务**

从 interview-guide 复制，核心功能：
- 分批评估（复用现有 AnswerEvaluationService 逻辑）
- 结构化输出
- 生成评估报告

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/service/VoiceInterviewEvaluationService.java
git commit -m "feat(voiceinterview): 添加语音面试评估服务"
```

---

### Task 12: 移植 VoiceInterviewService

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/service/VoiceInterviewService.java`

**Step 1: 创建核心业务服务**

从 interview-guide 复制，核心功能：
- 会话创建/结束/暂停/恢复
- 消息保存
- 对话历史获取
- 阶段转换
- 触发异步评估

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/service/VoiceInterviewService.java
git commit -m "feat(voiceinterview): 添加语音面试核心服务"
```

---

## Phase 5: WebSocket 与异步

### Task 13: 移植 VoiceInterviewWebSocketHandler

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/handler/VoiceInterviewWebSocketHandler.java`

**Step 1: 创建 WebSocket 处理器**

从 interview-guide 复制，核心功能：
- 处理用户音频 → STT → LLM → TTS → AI音频 流程
- 开场问题自动触发
- STT 合并防抖
- LLM 流式响应
- 音频推送

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/handler/VoiceInterviewWebSocketHandler.java
git commit -m "feat(voiceinterview): 添加 WebSocket 处理器"
```

---

### Task 14: 移植 Redis Stream Producer/Consumer

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/listener/VoiceEvaluateStreamProducer.java`
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/listener/VoiceEvaluateStreamConsumer.java`

**Step 1: 创建 Producer**

从 interview-guide 复制，发送评估任务到 Redis Stream

**Step 2: 创建 Consumer**

从 interview-guide 复制，消费评估任务并执行评估

**Step 3: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/listener/
git commit -m "feat(voiceinterview): 添加 Redis Stream 评估任务处理"
```

---

## Phase 6: Controller

### Task 15: 移植 VoiceInterviewController

**Files:**
- Create: `app/src/main/java/interview/guide/modules/voiceinterview/controller/VoiceInterviewController.java`

**Step 1: 创建 Controller**

从 interview-guide 复制，实现以下 API：
- POST `/api/voice-interview/sessions` - 创建会话
- GET `/api/voice-interview/sessions/{id}` - 获取会话
- POST `/api/voice-interview/sessions/{id}/end` - 结束会话
- PUT `/api/voice-interview/sessions/{id}/pause` - 暂停
- PUT `/api/voice-interview/sessions/{id}/resume` - 恢复
- GET `/api/voice-interview/sessions` - 列表
- DELETE `/api/voice-interview/sessions/{id}` - 删除
- GET `/api/voice-interview/sessions/{id}/messages` - 对话历史
- GET `/api/voice-interview/sessions/{id}/evaluation` - 评估状态/结果
- POST `/api/voice-interview/sessions/{id}/evaluation` - 触发评估

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/modules/voiceinterview/controller/VoiceInterviewController.java
git commit -m "feat(voiceinterview): 添加语音面试 Controller"
```

---

## Phase 7: 前端

### Task 16: 创建前端页面结构

**Files:**
- Create: `frontend/src/pages/voiceinterview/VoiceInterviewListPage.tsx`
- Create: `frontend/src/pages/voiceinterview/VoiceInterviewPage.tsx`

**Step 1: 创建页面组件**

参考 interview-guide 的 `VoiceInterviewPage.tsx`，创建：
- 会话列表页
- 主面试页面

**Step 2: Commit**

```bash
git add frontend/src/pages/voiceinterview/
git commit -m "feat(voiceinterview): 添加前端语音面试页面"
```

---

### Task 17: 创建前端组件

**Files:**
- Create: `frontend/src/pages/voiceinterview/components/VoiceInterviewRoom.tsx`
- Create: `frontend/src/pages/voiceinterview/components/AudioRecorder.tsx`
- Create: `frontend/src/pages/voiceinterview/components/SubtitleDisplay.tsx`
- Create: `frontend/src/pages/voiceinterview/components/EvaluationResult.tsx`

**Step 1: 创建组件**

参考 interview-guide 实现：
- 面试房间（WebSocket 连接管理）
- 录音组件
- 字幕展示
- 评估结果展示

**Step 2: Commit**

```bash
git add frontend/src/pages/voiceinterview/components/
git commit -m "feat(voiceinterview): 添加前端组件"
```

---

## Phase 8: 路由与集成

### Task 18: 添加前端路由

**Files:**
- Modify: `frontend/src/App.tsx` 或路由配置文件

**Step 1: 添加路由**

```tsx
{
  path: '/voice-interview',
  children: [
    { index: true, element: <VoiceInterviewListPage /> },
    { path: ':sessionId', element: <VoiceInterviewPage /> }
  ]
}
```

**Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(voiceinterview): 添加语音面试路由"
```

---

### Task 19: 添加后端模块扫描

**Files:**
- Modify: `app/src/main/java/interview/guide/AiInterviewApplication.java`

**Step 1: 添加组件扫描**

```java
@EntityScan(basePackages = "interview.guide.modules.voiceinterview.model")
@EnableJpaRepositories(basePackages = "interview.guide.modules.voiceinterview.repository")
```

**Step 2: Commit**

```bash
git add app/src/main/java/interview/guide/AiInterviewApplication.java
git commit -m "feat(voiceinterview): 启用 voiceinterview 模块扫描"
```

---

## Phase 9: 验证与测试

### Task 20: 编译验证

**Step 1: 运行 Maven 编译**

Run: `cd app && mvn compile -q`
Expected: 编译成功，无错误

**Step 2: 运行前端编译**

Run: `cd frontend && pnpm build`
Expected: 构建成功

---

### Task 21: 功能验证

**Step 1: 启动后端服务**

Run: `cd app && mvn spring-boot:run -Dspring-boot.run.profiles=local`

**Step 2: 测试 API**

```bash
# 创建会话
curl -X POST http://localhost:8080/api/voice-interview/sessions \
  -H "Content-Type: application/json" \
  -d '{"roleType":"java-backend","resumeId":1}'

# 获取会话
curl http://localhost:8080/api/voice-interview/sessions/1
```

---

## 执行方式

**Plan complete and saved to `docs/plans/2026-04-17-voiceinterview-implementation-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
