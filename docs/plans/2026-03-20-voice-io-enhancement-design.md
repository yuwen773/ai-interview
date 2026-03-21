# 面试语音 I/O 增强设计文档

**日期**: 2026-03-20
**状态**: 设计已批准
**版本**: 1.0

## 1. 概述

### 1.1 目标

在现有面试流程中增加语音 I/O 能力，作为可选项。用户可以选择：
- 输入方式：文字回答 / 语音回答
- 输出方式：文字显示 / 语音播放

### 1.2 设计原则

- **纯 I/O 增强**：不改变现有业务逻辑，复用 `InterviewSessionService.submitAnswer()`
- **最小改动**：后端仅增强音频服务，新增策略模式输出
- **渐进实现**：Phase 1 先用 REST API + SSE，后续可升级 WebSocket

## 2. 架构设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                         前端                                  │
│  ┌──────────────┐         ┌────────────────────────────────┐│
│  │ 面试界面     │         │ 语音控制面板                     ││
│  │ - 问题显示   │         │ - 录音按钮 (输入)                ││
│  │ - 答案输入   │         │ - 播放器 (输出)                  ││
│  │ - 提交按钮   │         │ - 语音开关设置                   ││
│  └──────┬───────┘         └────────────────────────────────┘│
└─────────┼────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────┐
│                        后端 API                               │
│                                                              │
│  POST /api/interview/{sessionId}/answer/voice                │
│  Parameters: file=audio.wav, outputMode=text|voice           │
│                                                              │
│  Response: JSON (text) or SSE (voice)                        │
└──────────────────────────────────────────────────────────────┘
          │                         ▲
          │                         │
          ▼                         │
┌─────────────────┐        ┌──────────────────┐
│   AsrService    │        │   TtsService     │
│  (复用现有)     │        │  (增强流式)       │
└─────────────────┘        └──────────────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │ AnswerOutputStrategy│
                        │ ├─ TextOutput       │
                        │ └─ VoiceOutput      │
                        └─────────────────────┘
```

### 2.2 数据流

```
用户语音
   ↓
ASR 转文字
   ↓
InterviewSessionService.submitAnswer() (复用现有)
   ↓
获取下一个问题
   ↓
┌─────────────┬─────────────┐
│ outputMode  │ outputMode  │
│   = text    │   = voice   │
└─────────────┴─────────────┘
      ↓              ↓
  返回 JSON      流式 TTS → SSE
```

## 3. 详细设计

### 3.1 后端 API 设计

#### 现有接口（保持不变）

```
POST /api/interview/{sessionId}/answers
Content-Type: application/json
Body: { "questionIndex": 0, "answer": "文字回答" }

Response:
{
  "hasNextQuestion": true,
  "nextQuestion": { ... },
  "currentIndex": 1,
  "totalQuestions": 5
}
```

#### 新增语音接口

```
POST /api/interview/{sessionId}/answer/voice
Content-Type: multipart/form-data
Parameters:
  - file: 音频文件 (WAV/MP3)
  - outputMode: "text" | "voice" (默认 voice)

Response (outputMode=text): JSON 同上
Response (outputMode=voice): SSE 流

event: audio
data: {"chunk": "base64音频片段1", "index": 0}

event: audio
data: {"chunk": "base64音频片段2", "index": 1}

event: end
data: {}
```

### 3.2 策略模式实现

```java
// 策略接口
public interface AnswerOutputStrategy {
    Object process(SubmitAnswerResponse response);
}

// 文字输出策略
@Component
public class TextOutputStrategy implements AnswerOutputStrategy {
    @Override
    public Object process(SubmitAnswerResponse response) {
        return Result.success(response);
    }
}

// 语音输出策略
@Component
@RequiredArgsConstructor
public class VoiceOutputStrategy implements AnswerOutputStrategy {
    private final TtsService ttsService;

    @Override
    public Object process(SubmitAnswerResponse response) {
        String questionText = response.nextQuestion().question();
        return ttsService.streamTtsSse(questionText);
    }
}
```

### 3.3 Controller 实现

```java
@PostMapping("/api/interview/{sessionId}/answer/voice")
public Object submitVoiceAnswer(
        @PathVariable String sessionId,
        @RequestParam("file") MultipartFile audioFile,
        @RequestParam(defaultValue = "voice") String outputMode) {

    // 1. ASR: 音频转文字
    String userAnswer = asrService.transcribe(audioFile);

    // 2. 获取当前问题索引
    InterviewSessionDTO session = sessionService.getSession(sessionId);
    int currentIndex = session.currentIndex();

    // 3. 复用现有 Service
    SubmitAnswerRequest request = new SubmitAnswerRequest(sessionId, currentIndex, userAnswer);
    SubmitAnswerResponse response = sessionService.submitAnswer(request);

    // 4. 根据输出模式返回
    AnswerOutputStrategy strategy = getOutputStrategy(outputMode);
    return strategy.process(response);
}

private AnswerOutputStrategy getOutputStrategy(String mode) {
    return "voice".equals(mode) ? voiceOutputStrategy : textOutputStrategy;
}
```

### 3.4 TtsService 增强

```java
// 新增方法
public SseEmitter streamTtsSse(String text) {
    SseEmitter emitter = new SseEmitter(30000L);

    DashScopeAudioSpeechOptions options = DashScopeAudioSpeechOptions.builder()
        .model(DashScopeModel.AudioModel.COSYVOICE_V3_FLASH.getValue())
        .textType("PlainText")
        .voice("longanyang")
        .format("mp3")
        .sampleRate(22050)
        .build();

    TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);

    dashScopeTtsModel.stream(prompt)
        .map(this::extractAudio)
        .filter(bytes -> bytes != null && bytes.length > 0)
        .doOnComplete(() -> {
            try {
                emitter.send(SseEvent.builder().name("end").data(Map.of()).build());
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        })
        .doOnError(emitter::completeWithError)
        .subscribe(audioBytes -> {
            try {
                emitter.send(SseEvent.builder()
                    .name("audio")
                    .data(Map.of(
                        "chunk", Base64.getEncoder().encodeToString(audioBytes),
                        "index", counter.getAndIncrement()
                    ))
                    .build());
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        });

    return emitter;
}
```

## 4. 前端设计

### 4.1 组件结构

```typescript
// components/VoiceControlPanel.tsx
interface VoiceControlPanelProps {
  sessionId: string;
  questionIndex: number;
  onAnswerSubmitted?: (response: SubmitAnswerResponse) => void;
}

export function VoiceControlPanel({
  sessionId,
  questionIndex,
  onAnswerSubmitted
}: VoiceControlPanelProps) {
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const { playAudioStream } = useVoicePlayer();

  const handleSubmit = async () => {
    const audioBlob = await stopRecording();

    const response = await fetch(
      `/api/interview/${sessionId}/answer/voice?outputMode=voice`,
      {
        method: 'POST',
        body: createFormData(audioBlob)
      }
    );

    await playAudioStream(response);
  };

  return (
    <div className="voice-control-panel">
      <button onClick={isRecording ? handleSubmit : startRecording}>
        {isRecording ? "停止录音" : "开始录音"}
      </button>
    </div>
  );
}
```

### 4.2 录音 Hook

```typescript
// hooks/useVoiceRecorder.ts
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1 }
    });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.start(100); // 每100ms一个chunk
    setIsRecording(true);
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      mediaRecorderRef.current?.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setIsRecording(false);
        resolve(blob);
      };
      mediaRecorderRef.current?.stop();
    });
  };

  return { isRecording, startRecording, stopRecording };
}
```

### 4.3 播放器 Hook

```typescript
// hooks/useVoicePlayer.ts
export function useVoicePlayer() {
  const audioQueueRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudioStream = async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.slice(5));
          if (data.chunk) {
            audioQueueRef.current.push(data.chunk);
          }
        }
      }
    }

    // 播放队列中的音频
    playQueuedAudio();
  };

  const playQueuedAudio = () => {
    const audio = audioRef.current || new Audio();
    audioRef.current = audio;

    const playNext = () => {
      if (audioQueueRef.current.length === 0) return;

      const base64Audio = audioQueueRef.current.shift()!;
      audio.src = `data:audio/mp3;base64,${base64Audio}`;
      audio.play();
      audio.onended = playNext;
    };

    playNext();
  };

  return { playAudioStream };
}
```

## 5. 错误处理

### 5.1 后端错误处理

| 场景 | HTTP 状态 | 处理方式 |
|------|-----------|----------|
| 音频文件为空 | 400 | 返回错误提示 |
| ASR 识别失败 | 500 | 返回错误，建议重试或使用文字 |
| ASR 返回空文本 | 400 | 提示"未识别到语音" |
| TTS 服务异常 | 500 | SSE 发送 error 事件 |
| 会话不存在 | 404 | 返回标准错误响应 |

### 5.2 前端错误处理

```typescript
try {
  await playAudioStream(response);
} catch (error) {
  if (error.message.includes('ASR')) {
    toast.error('语音识别失败，请重试或使用文字输入');
  } else if (error.message.includes('TTS')) {
    toast.error('语音播放失败，将显示文字');
    // 降级到文字显示
  } else {
    toast.error('发生错误，请重试');
  }
}
```

## 6. 实施计划

### 6.1 Phase 1 任务清单

| # | 任务 | 文件 | 预计时间 |
|---|------|------|----------|
| 1 | 增强 TtsService 添加流式 SSE 方法 | TtsService.java | 30min |
| 2 | 实现策略模式接口和实现类 | AnswerOutputStrategy.java 等 | 45min |
| 3 | Controller 添加语音回答接口 | InterviewController.java | 30min |
| 4 | 前端录音 Hook | useVoiceRecorder.ts | 45min |
| 5 | 前端播放器 Hook | useVoicePlayer.ts | 45min |
| 6 | 语音控制面板组件 | VoiceControlPanel.tsx | 45min |
| 7 | 集成到面试页面 | InterviewPage.tsx | 30min |
| 8 | 测试与调试 | - | 60min |

**总计**: 约 5 小时

### 6.2 Phase 2（可选升级）

- WebSocket 实时语音交互
- 边录音边识别（流式 ASR）
- Agent 流式生成 + TTS 流式输出

## 7. 文件清单

### 后端

```
app/src/main/java/interview/guide/modules/
├── audio/
│   ├── service/
│   │   └── TtsService.java                    # 修改：添加 streamTtsSse()
│   └── strategy/                              # 新增包
│       ├── AnswerOutputStrategy.java          # 新增
│       ├── TextOutputStrategy.java            # 新增
│       └── VoiceOutputStrategy.java           # 新增
│
├── interview/
│   └── InterviewController.java               # 修改：添加 submitVoiceAnswer()
```

### 前端

```
frontend/src/
├── components/
│   └── VoiceControlPanel.tsx                  # 新增
├── hooks/
│   ├── useVoiceRecorder.ts                    # 新增
│   └── useVoicePlayer.ts                      # 新增
├── api/
│   └── interview.ts                           # 修改：添加 voiceAnswer()
└── types/
    └── voice.ts                               # 新增
```

## 8. 验收标准

- [ ] 用户可以通过语音提交答案
- [ ] 语音识别正确率 > 90%
- [ ] 面试官语音输出流畅无卡顿
- [ ] 支持文字/语音模式切换
- [ ] 错误处理完善，用户能看到友好提示
- [ ] 不影响现有文字问答功能
