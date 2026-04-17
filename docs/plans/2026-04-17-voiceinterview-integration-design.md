# 语音面试模块集成设计

## 1. 概述

将 `D:\Work\code\interview-guide` 项目中的 `voiceinterview` 模块完整集成到 `ai-interview` 项目中，实现实时语音面试功能。

### 1.1 目标

- 实现完整的实时语音面试系统
- 支持 WebSocket 双向通信
- 集成阿里云 ASR/TTS/LLM 服务
- 独立评估服务生成面试报告

### 1.2 参考项目

- 源码：`D:\Work\code\interview-guide`
- 模块：`app/src/main/java/interview/guide/modules/voiceinterview/`

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         前端 (Frontend)                              │
│                  VoiceInterviewPage.tsx                             │
│            WebSocket 连接 / 音频流 / 字幕展示                         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    WebSocket + REST API
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                         后端 (Backend)                               │
│  ┌─────────────────┐    ┌────────────────────────────────────────┐  │
│  │ voiceinterview   │    │           interview (现有)              │  │
│  │   Controller     │    │                                        │  │
│  └────────┬────────┘    └────────────────────────────────────────┘  │
│           │                                                         │
│  ┌────────▼────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  WebSocket      │    │   Service    │    │  Evaluation      │   │
│  │  Handler       │    │   Layer      │    │  Service         │   │
│  └────────┬────────┘    └──────────────┘    └──────────────────┘   │
│           │                      │                      │           │
│  ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐  │
│  │ QwenAsrService │    │ DashscopeLlm    │    │ Redis Stream    │  │
│  │ (实时 ASR)     │    │ Service (LLM)  │    │ Producer/Consumer│  │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │
│           │                     │                      │           │
│  ┌────────▼─────────────────────▼───────────────────────▼────────┐  │
│  │              阿里云 DashScope API (ASR/TTS/LLM)               │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. 模块结构

```
modules/voiceinterview/
├── config/
│   ├── VoiceInterviewProperties.java      # 配置属性
│   └── WebSocketConfig.java               # WebSocket 端点配置
├── controller/
│   └── VoiceInterviewController.java     # REST API
├── dto/
│   ├── CreateSessionRequest.java
│   ├── SessionMetaDTO.java
│   ├── SessionResponseDTO.java
│   ├── VoiceEvaluationDetailDTO.java
│   ├── VoiceEvaluationStatusDTO.java
│   ├── VoiceInterviewMessageDTO.java
│   ├── WebSocketControlMessage.java
│   └── WebSocketSubtitleMessage.java
├── handler/
│   └── VoiceInterviewWebSocketHandler.java # WebSocket 处理器
├── listener/
│   ├── VoiceEvaluateStreamProducer.java   # 评估任务发送
│   └── VoiceEvaluateStreamConsumer.java   # 评估任务消费
├── model/
│   ├── VoiceInterviewSessionEntity.java   # 会话实体
│   ├── VoiceInterviewMessageEntity.java   # 消息实体
│   ├── VoiceInterviewEvaluationEntity.java # 评估实体
│   └── VoiceInterviewSessionStatus.java   # 状态枚举
├── repository/
│   ├── VoiceInterviewSessionRepository.java
│   ├── VoiceInterviewMessageRepository.java
│   └── VoiceInterviewEvaluationRepository.java
└── service/
    ├── VoiceInterviewService.java          # 会话管理
    ├── VoiceInterviewEvaluationService.java # 评估服务
    ├── VoiceInterviewPromptService.java    # Prompt 模板
    ├── DashscopeLlmService.java            # LLM 服务
    ├── QwenAsrService.java                 # 实时 ASR
    └── QwenTtsService.java                 # 实时 TTS
```

## 4. 数据库表

### 4.1 Flyway Migration

新建文件：`resources/db/migration/V2026-04-18__add_voice_interview_tables.sql`

### 4.2 表结构

**voice_interview_sessions**
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
```

**voice_interview_messages**
```sql
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
```

**voice_interview_evaluations**
```sql
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
```

## 5. 多阶段面试流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────────┐
│  INTRO  │ → │  TECH   │ → │ PROJECT │ → │   HR    │ → │ COMPLETED │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └───────────┘
  开场介绍      技术面试       项目经验        HR/综合        面试结束
```

**会话状态：**
- `IN_PROGRESS` - 面试进行中
- `PAUSED` - 暂停（5分钟无活动自动暂停）
- `COMPLETED` - 已完成

## 6. WebSocket 通信协议

**连接路径：** `ws://host/ws/voice-interview/{sessionId}`

**客户端 → 服务器：**
```json
{"type": "audio", "data": "base64编码音频"}
{"type": "control", "action": "submit", "data": {"text": "..."}}
{"type": "control", "action": "end_interview"}
{"type": "control", "action": "start_phase", "phase": "TECH"}
```

**服务器 → 客户端：**
```json
{"type": "control", "action": "welcome", "message": "..."}
{"type": "subtitle", "text": "...", "isFinal": true}
{"type": "text", "content": "..."}
{"type": "audio", "data": "base64", "text": "..."}
{"type": "error", "message": "..."}
```

## 7. API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/voice-interview/sessions` | 创建会话 |
| GET | `/api/voice-interview/sessions/{id}` | 获取会话 |
| POST | `/api/voice-interview/sessions/{id}/end` | 结束会话 |
| PUT | `/api/voice-interview/sessions/{id}/pause` | 暂停 |
| PUT | `/api/voice-interview/sessions/{id}/resume` | 恢复 |
| GET | `/api/voice-interview/sessions` | 列表 |
| DELETE | `/api/voice-interview/sessions/{id}` | 删除 |
| GET | `/api/voice-interview/sessions/{id}/messages` | 对话历史 |
| GET | `/api/voice-interview/sessions/{id}/evaluation` | 评估状态/结果 |
| POST | `/api/voice-interview/sessions/{id}/evaluation` | 触发评估 |

## 8. 配置

**application.yml：**
```yaml
app:
  voice-interview:
    llm-provider: dashscope
    qwen:
      asr:
        model: qwen3-asr-flash-realtime
      tts:
        model: qwen-tts-realtime
        voice: Cherry
    phases:
      intro:
        enabled: true
      tech:
        enabled: true
      project:
        enabled: true
      hr:
        enabled: true
    planned-duration: 30
```

## 9. 前端结构

```
frontend/src/pages/voiceinterview/
├── VoiceInterviewPage.tsx          # 主页面
├── VoiceInterviewListPage.tsx       # 会话列表
└── components/
    ├── VoiceInterviewRoom.tsx       # 面试房间
    ├── AudioRecorder.tsx           # 录音组件
    ├── SubtitleDisplay.tsx          # 字幕展示
    └── EvaluationResult.tsx         # 评估结果
```

## 10. 文件清单

| 类别 | 数量 | 说明 |
|------|------|------|
| Config | 2 | VoiceInterviewProperties, WebSocketConfig |
| Controller | 1 | VoiceInterviewController |
| DTO | 7 | 7个数据传输对象 |
| Handler | 1 | VoiceInterviewWebSocketHandler |
| Listener | 2 | Producer, Consumer |
| Model | 4 | 3 Entity + 1 Enum |
| Repository | 3 | JPA Repository |
| Service | 6 | 核心业务服务 |
| Migration | 1 | Flyway SQL |
| Frontend | 6+ | 页面和组件 |
| Prompt | 1 | 评估模板 |

## 11. 依赖关系

**后端依赖：**
- Spring Boot 3.5.8
- Spring AI 1.1.2
- Redis + Redisson（已有）
- PostgreSQL + JPA（已有）
- DashScope SDK（通过 spring-ai-alibaba）

**前端依赖：**
- React 18（已有）
- WebSocket 客户端（内置）
- 音频处理（内置）
