# 模拟面试语音能力一期实施设计文档

## 1. 文档目的

本文档用于明确 `voice-agent` 技术能力嫁接到当前 `ai-interview` 项目中的一期实施方案，确保需求、范围、架构、接口和改造点一次性对齐，避免后续开发过程中出现理解偏差。

本文档只覆盖 `frontend/` Web 端和 `app/` 后端，不包含 `uniapp-interview/`。

## 2. 背景与目标

当前项目已经具备基础的模拟面试流程，以及初步的 ASR/TTS 能力，但语音能力尚未与模拟面试主流程完整融合。

本次目标不是把 `D:\Work\code\alibaba\spring-ai-alibaba\examples\voice-agent` 原样并入，而是复用其技术思路，将以下能力嫁接到当前项目：

1. 语音输入能力
2. 语音输出能力
3. 流式 TTS 输出能力
4. 后续可升级为实时流式语音交互的扩展能力

一期目标聚焦于“可用、稳定、易维护”。

## 3. 已确认需求

### 3.1 面试官输出模式

面试官输出模式支持两种：

1. `text`
2. `textVoice`

规则如下：

1. 默认是 `text`
2. 用户可以切换为 `textVoice`
3. 开启语音后，题目文字仍然显示，语音播报作为附加能力

### 3.2 用户回答模式

用户回答模式支持两种：

1. `text`
2. `voice`

规则如下：

1. 每一轮回答只能二选一
2. 文字回答和语音回答不能同时使用
3. 当切换到语音回答模式时，文本输入框隐藏

### 3.3 语音回答交互方式

一期采用：

1. 录音完成后提交
2. 不做实时识别
3. 不开发 WebSocket

### 3.4 识别结果与人工复查

语音回答提交后，需要在前端展示 ASR 识别出的文本。为确保识别准确性，一期采用**人工复查机制**：

1. 录音上传后，ASR 返回识别文本
2. **前端不直接提交识别结果**，而是进入"确认/编辑/重录"状态
3. 用户可：
   - 确认识别文本，然后提交答案推进会话
   - 手动编辑识别文本，然后提交
   - 重新录音
4. 用户确认后，才调用 `submitAnswer()` 推进题目

**设计理由**：将"识别"与"推进会话"解耦，降低 ASR 不稳定对面试流程的影响。

### 3.5 语音播放控制

当面试官处于 `textVoice` 模式时，前端需要支持：

1. 自动播放当前题目语音
2. 用户手动停止播放

### 3.6 错误兜底

若语音识别失败：

1. 不阻断面试流程
2. 提示识别失败
3. 允许用户切回文字模式继续作答

## 4. 一期范围与非范围

### 4.1 一期范围

一期必须完成：

1. Web 端面试官语音播报开关
2. Web 端用户文字回答 / 语音回答模式切换
3. 录音后提交语音答案
4. ASR 识别文本展示
5. 下一题文字展示
6. 下一题可选语音播报
7. 播放停止能力
8. ASR 失败后的回退交互

### 4.2 一期非范围

一期不做：

1. WebSocket
2. 实时语音识别中间字幕
3. 边说边识别
4. 边生成边播报的实时全双工语音交互
5. `uniapp-interview/` 端适配
6. 自由对话式 Voice Agent 面试官

## 5. 核心设计原则

### 5.1 保留单一业务主线

无论用户使用文字回答还是语音回答，最终都必须落到现有 `InterviewSessionService.submitAnswer()`。

这条原则非常关键，目的是避免形成两套独立的面试业务逻辑。

### 5.2 语音能力作为接入层扩展

语音能力只负责：

1. 把音频转成文本
2. 把题目文本转成语音
3. 把面试业务结果适配成前端可消费的文本和音频

语音层不负责会话状态推进、题目生成、答案评估等核心业务。

### 5.3 输入模式与输出模式解耦

用户输入模式和面试官输出模式是两个独立维度，不允许耦合成一个总模式枚举。

原因：

1. 用户可以用文字回答，面试官同时使用文字加语音输出
2. 用户也可以语音回答，而面试官只输出文字
3. 两者组合存在笛卡尔积关系

### 5.4 一期优先稳定，不优先炫技

虽然 `voice-agent` 具备实时双向流能力，但一期明确不使用 WebSocket，优先使用现有更适合当前项目的 HTTP + SSE 方案。

## 6. 与 voice-agent 的关系

### 6.1 可以复用的技术思路

可以借鉴 `voice-agent` 的以下设计：

1. 语音输入和语音输出分层
2. 流式 TTS 输出能力
3. 统一事件模型的设计思路
4. 语音能力与上层业务解耦
5. 为后续实时语音升级预留扩展点

### 6.2 不直接复用的部分

以下内容不直接复用：

1. `sandwichAgent`
2. 点餐业务相关 Agent 配置
3. 由 Agent 主导整段对话的业务模式
4. 基于 PCM 实时二进制流的前端协议

原因是当前项目属于“状态驱动的结构化面试流程”，不是“自由对话式语音 Agent”。

## 7. 设计模式与分层方案

### 7.1 Strategy 模式

#### 用户输入策略

抽象接口：

`CandidateInputStrategy`

建议实现：

1. `TextCandidateInputStrategy`
2. `VoiceCandidateInputStrategy`

职责：

1. `TextCandidateInputStrategy` 直接返回文本答案
2. `VoiceCandidateInputStrategy` 调用 ASR，将音频转换为文本答案

#### 面试官输出策略

抽象接口：

`InterviewerOutputStrategy`

建议实现：

1. `TextOnlyOutputStrategy`
2. `TextAndVoiceOutputStrategy`

职责：

1. 将 `SubmitAnswerResponse` 转成前端消费结果
2. 控制是否需要附加语音播报能力

### 7.2 Orchestrator / Template Method 思路

建议新增统一编排类：

`InterviewTurnProcessor`

职责是固定一轮面试交互流程：

1. 读取请求
2. 选择输入策略
3. 标准化用户答案
4. 调用 `InterviewSessionService.submitAnswer()`
5. 选择输出策略
6. 返回结构化结果

这样可以避免 controller 直接堆积复杂判断。

### 7.3 Factory / Registry 模式

建议通过 Spring 注入实现策略注册表，而不是在 controller 内部写 `switch`。

推荐方式：

1. 每个策略实现暴露自身支持的 mode
2. 启动时注入 `Map<Mode, Strategy>`
3. 由 processor 根据 mode 查找策略

### 7.4 Adapter 模式

新增：

1. `AsrAdapter`
2. `TtsAdapter`

职责：

1. 屏蔽 DashScope SDK 调用细节
2. 避免 controller 和 processor 直接依赖第三方模型类
3. 为后续替换供应商或升级协议留出空间

## 8. 整体架构

一期推荐分为 6 层。

### 8.1 Controller 层

职责：

1. 接收 HTTP 请求
2. 参数校验
3. 调用 `InterviewTurnProcessor`
4. 返回 JSON 或 SSE

不负责：

1. ASR 细节
2. TTS 细节
3. 面试业务推进细节

### 8.2 Processor 层

即：

`InterviewTurnProcessor`

职责：

1. 一轮交互流程编排
2. 策略选择
3. 组装统一结果

### 8.3 Input Strategy 层

职责：

1. 将文本输入或语音输入统一转为答案文本

### 8.4 Output Strategy 层

职责：

1. 将统一的业务结果转换为前端可用的输出结果

### 8.5 Audio Adapter 层

职责：

1. ASR
2. TTS
3. 流式 TTS

### 8.6 核心业务层

保留现有：

1. `InterviewSessionService`
2. `InterviewHistoryService`
3. `InterviewPersistenceService`

核心业务层仍然是唯一业务真相来源。

## 9. 一期后端设计

### 9.1 建议新增枚举

建议新增：

1. `CandidateInputMode`
2. `InterviewerOutputMode`

建议取值：

```java
public enum CandidateInputMode {
    TEXT,
    VOICE
}
```

```java
public enum InterviewerOutputMode {
    TEXT,
    TEXT_VOICE
}
```

### 9.2 建议新增模型

建议新增：

1. `NormalizedAnswer`
2. `InterviewTurnResponse`
3. `VoiceAnswerResponse`
4. `TtsStreamChunk`

建议字段思路：

`NormalizedAnswer`

1. `String answerText`
2. `String recognizedText`
3. `CandidateInputMode inputMode`

`InterviewTurnResponse`

1. `String recognizedText`
2. `boolean hasNextQuestion`
3. `InterviewQuestionDTO nextQuestion`
4. `int currentQuestionIndex`
5. `int totalQuestions`
6. `InterviewerOutputMode interviewerOutputMode`

### 9.3 输入策略接口

建议接口：

```java
public interface CandidateInputStrategy {
    CandidateInputMode getMode();
    NormalizedAnswer normalize(InterviewTurnInput input);
}
```

建议实现：

1. `TextCandidateInputStrategy`
2. `VoiceCandidateInputStrategy`

### 9.4 输出策略接口

建议接口：

```java
public interface InterviewerOutputStrategy {
    InterviewerOutputMode getMode();
    InterviewTurnResponse build(SubmitAnswerResponse submitAnswerResponse, String recognizedText);
}
```

### 9.5 编排服务

建议新增：

`InterviewTurnProcessor`

核心职责：

1. 选择 `CandidateInputStrategy`
2. 获取文本答案
3. 调用 `sessionService.submitAnswer()`
4. 选择 `InterviewerOutputStrategy`
5. 返回 `InterviewTurnResponse`

伪流程：

```text
request -> input strategy -> normalized answer
       -> submitAnswer()
       -> output strategy
       -> response
```

### 9.6 ASR Adapter

建议新增：

`AsrAdapter`

建议接口：

```java
public interface AsrAdapter {
    String transcribe(MultipartFile file);
}
```

实现中封装当前 `AsrService`。

### 9.7 TTS Adapter

建议新增：

`TtsAdapter`

建议接口：

```java
public interface TtsAdapter {
    byte[] synthesize(String text);
    Flux<byte[]> synthesizeStream(String text);
}
```

实现中封装当前 `TtsService`。

### 9.8 Controller 设计

建议在现有 `InterviewController` 基础上扩展，或新增专门的 `InterviewVoiceController`。

#### 阶段 2 接口：语音识别（仅识别，不推进会话）

`POST /api/interview/sessions/{sessionId}/answers/voice/recognize`

`multipart/form-data`

字段：

1. `questionIndex`
2. `file`

返回：

```json
{
  "success": true,
  "recognizedText": "我认为这个项目的难点在于..."
}
```

**设计说明**：此接口仅返回识别结果，不调用 `submitAnswer()`，前端获取识别结果后展示给用户确认/编辑。

#### 阶段 2 接口：确认提交（使用识别文本推进）

复用现有接口或扩展：

`POST /api/interview/sessions/{sessionId}/answers`

请求体：

```json
{
  "questionIndex": 0,
  "answerText": "用户确认或编辑后的文本",
  "interviewerOutputMode": "TEXT"
}
```

返回：现有 `SubmitAnswerResponse`

#### 阶段 3 接口：题目 TTS 流

#### 题目 TTS 流接口

建议保留独立接口，避免把 JSON 和 SSE 混在一个接口里。

建议：

`POST /api/interview/tts/stream`

请求体：

```json
{
  "text": "请描述一次你独立定位线上问题的经历。"
}
```

返回：

`Content-Type: text/event-stream`

事件数据使用 Base64 音频块即可。

## 10. 一期前端设计

### 10.1 前端状态设计

建议在面试页面新增状态：

1. `candidateInputMode: 'text' | 'voice'`
2. `interviewerOutputMode: 'text' | 'textVoice'`
3. `isPlayingQuestionAudio: boolean`
4. `recognizedText: string | null`

### 10.2 页面交互规则

#### 文字回答模式

1. 显示 textarea
2. 允许手动输入和提交

#### 语音回答模式

1. 隐藏 textarea
2. 显示录音按钮
3. 录音结束后上传音频
4. 成功后将识别文本展示为用户消息

#### 面试官语音播报模式

1. 下一题仍展示文字
2. 前端自动发起 TTS 流请求
3. 自动播放语音
4. 用户可手动停止播放

### 10.3 失败回退交互

若语音识别失败：

1. 前端提示失败
2. 保持当前题目不推进
3. 允许用户切回 `text` 模式重新作答

## 11. 现有代码问题与修正要求

### 11.1 ASR 需要先修正

当前 `AsrService` 中使用了占位文件路径，不是上传文件本身：

`/path/to/your/resource/speech/audio.wav`

这意味着现有 ASR 实现尚未真正可用，一期开发前必须先修复。

修正要求：

1. 使用上传的 `MultipartFile`
2. 转为 `Resource` 后调用 DashScope
3. 返回真实识别结果

### 11.2 依赖版本需要统一

当前根 `pom.xml` 和 `app/pom.xml` 中 Spring AI Alibaba 版本存在漂移。

一期开发前建议统一版本，避免后续扩展时出现兼容性问题。

### 11.3 语音接口不要形成第二套业务流程

语音接口最终必须调用：

`InterviewSessionService.submitAnswer()`

不能在语音接口内重新实现：

1. 题目推进
2. 会话状态更新
3. 下一题生成逻辑

## 12. 文件级改造清单

### 12.1 后端

建议修改或新增以下文件：

#### 修改

1. `app/src/main/java/interview/guide/modules/audio/service/AsrService.java`
2. `app/src/main/java/interview/guide/modules/audio/service/TtsService.java`
3. `app/src/main/java/interview/guide/modules/interview/InterviewController.java`
4. `app/pom.xml`
5. 根 `pom.xml`

#### 新增

1. `app/src/main/java/interview/guide/modules/interview/voice/InterviewTurnProcessor.java`
2. `app/src/main/java/interview/guide/modules/interview/voice/model/CandidateInputMode.java`
3. `app/src/main/java/interview/guide/modules/interview/voice/model/InterviewerOutputMode.java`
4. `app/src/main/java/interview/guide/modules/interview/voice/model/NormalizedAnswer.java`
5. `app/src/main/java/interview/guide/modules/interview/voice/model/InterviewTurnInput.java`
6. `app/src/main/java/interview/guide/modules/interview/voice/model/InterviewTurnResponse.java`
7. `app/src/main/java/interview/guide/modules/interview/voice/input/CandidateInputStrategy.java`
8. `app/src/main/java/interview/guide/modules/interview/voice/input/TextCandidateInputStrategy.java`
9. `app/src/main/java/interview/guide/modules/interview/voice/input/VoiceCandidateInputStrategy.java`
10. `app/src/main/java/interview/guide/modules/interview/voice/output/InterviewerOutputStrategy.java`
11. `app/src/main/java/interview/guide/modules/interview/voice/output/TextOnlyOutputStrategy.java`
12. `app/src/main/java/interview/guide/modules/interview/voice/output/TextAndVoiceOutputStrategy.java`
13. `app/src/main/java/interview/guide/modules/audio/adapter/AsrAdapter.java`
14. `app/src/main/java/interview/guide/modules/audio/adapter/TtsAdapter.java`
15. 需要时可新增 `app/src/main/java/interview/guide/modules/interview/voice/InterviewVoiceController.java`

### 12.2 前端

建议修改或新增以下文件：

#### 修改

1. `frontend/src/pages/InterviewPage.tsx`
2. `frontend/src/components/InterviewChatPanel.tsx`
3. `frontend/src/api/interview.ts`
4. `frontend/src/api/audio.ts`
5. `frontend/src/hooks/useRecording.ts`

#### 新增

1. `frontend/src/hooks/useQuestionVoicePlayer.ts`
2. 需要时新增 `frontend/src/types/voice.ts`
3. 需要时新增面试页内的模式切换组件

## 13. 前后端协作约定

### 13.1 聊天区消息展示规则

1. 面试官消息始终展示文字
2. 用户语音回答成功后，聊天区展示识别出的文本
3. 若识别失败，不向聊天区写入用户消息

### 13.2 语音播放规则

1. 只播放“下一题”
2. 不回放用户语音原始录音
3. 新一轮播放开始前，应停止上一轮未完成播放

### 13.3 模式切换规则

1. 回答模式切换只影响当前及后续轮次
2. 面试官输出模式切换只影响当前及后续题目

## 14. 四阶段实施计划

一期按四个阶段实施，每个阶段完成后进行人工复查和单元测试，确保风险可控。

### 14.1 阶段 1：后端能力打底

**里程碑 M1**：后端语音基础设施可用

#### 后端任务

1. 修复 ASR 实现
   - 使用上传的 `MultipartFile` 替代占位路径
   - 转为 `Resource` 后调用 DashScope
   - 返回真实识别结果

2. 统一依赖版本
   - 对齐根 `pom.xml` 和 `app/pom.xml` 中的 Spring AI Alibaba 版本

3. 新增 Adapter 层
   - `AsrAdapter` 接口及实现
   - `TtsAdapter` 接口及实现

4. 新增枚举和模型类
   - `CandidateInputMode`
   - `InterviewerOutputMode`
   - `NormalizedAnswer`
   - `InterviewTurnInput`
   - `InterviewTurnResponse`

5. 新增 Strategy 骨架
   - `CandidateInputStrategy` 接口
   - `TextCandidateInputStrategy` 实现
   - `VoiceCandidateInputStrategy` 实现
   - `InterviewerOutputStrategy` 接口
   - `TextOnlyOutputStrategy` 实现
   - `TextAndVoiceOutputStrategy` 实现

6. 新增 `InterviewTurnProcessor`
   - 策略选择逻辑
   - 流程编排骨架
   - 暂不接入完整流程

#### 测试要求

- 为 Adapter 层编写单元测试
- 为 Strategy 层编写单元测试
- 为 Processor 编写单元测试

#### 验收标准

- [ ] ASR 可正确处理上传文件并返回识别文本
- [ ] TTS 可正确合成语音
- [ ] 各策略接口可用且注入正确
- [ ] Processor 可正确选择策略并编排流程

---

### 14.2 阶段 2：语音答题 + 人工复查

**里程碑 M2**：语音回答可识别，且支持人工复查后再提交

#### 后端任务

1. 新增语音识别接口（仅识别，不推进会话）
   - `POST /api/interview/sessions/{sessionId}/answers/voice/recognize`
   - 返回识别文本，不调用 `submitAnswer()`

2. 扩展提交接口支持识别文本
   - 确认现有 `submitAnswer()` 可接收文本答案

#### 前端任务

1. 增加输入模式状态
   - `candidateInputMode: 'text' | 'voice'`

2. 增加模式切换 UI
   - 文字/语音模式切换按钮

3. 语音录制与上传
   - 集成录音功能
   - 上传音频到识别接口

4. 人工复查界面
   - 展示 ASR 识别结果
   - 提供确认/编辑/重录操作
   - 用户确认后提交答案

5. 识别文本展示
   - 确认后将文本展示为用户消息

#### 测试要求

- 为识别接口编写单元测试
- 前端编写录音、上传、确认流程的测试
- 集成测试：完整录音→识别→确认→提交流程

#### 验收标准

- [ ] 用户可录音并上传
- [ ] ASR 返回识别结果
- [ ] 用户可确认/编辑/重录
- [ ] 确认后会话正确推进
- [ ] 识别失败可切回文字模式

---

### 14.3 阶段 3：面试官语音播报

**里程碑 M3**：面试官题目支持语音播报

#### 后端任务

1. 收敛 TTS 流接口
   - `POST /api/interview/tts/stream`
   - 返回 `text/event-stream` 格式

2. 扩展答题接口返回输出模式
   - `InterviewTurnResponse` 包含 `interviewerOutputMode`

#### 前端任务

1. 增加输出模式状态
   - `interviewerOutputMode: 'text' | 'textVoice'`

2. 增加输出模式切换 UI
   - 文字/文字+语音 模式切换

3. 题目语音播报
   - 下一题展示后自动播放
   - 播放 `textVoice` 模式的题目

4. 播放控制
   - 手动停止播放
   - 新题目播放前停止上一轮

5. 新增 Hook
   - `useQuestionVoicePlayer.ts`

#### 测试要求

- 为 TTS 流接口编写单元测试
- 前端编写播放控制测试
- 集成测试：答题→接收下一题→自动播报

#### 验收标准

- [ ] 用户可切换面试官输出模式
- [ ] 下一题文字正常展示
- [ ] `textVoice` 模式自动播放语音
- [ ] 用户可手动停止播放
- [ ] 新题目播放前停止上一轮

---

### 14.4 阶段 4：异常兜底和整体稳定性

**里程碑 M4**：异常兜底和整体稳定性达标

#### 后端任务

1. 完善异常处理
   - ASR 失败不阻断流程
   - TTS 失败不阻断流程
   - 空音频/格式错误处理

2. 补充边界场景处理
   - 重复提交防护
   - 超时处理
   - 并发控制

#### 前端任务

1. 完善错误提示
   - 识别失败提示
   - 播放失败提示
   - 网络错误提示

2. 失败回退交互
   - 保持当前题目不推进
   - 允许切回文字模式
   - 提供重试能力

3. 体验优化
   - 加载状态
   - 禁用状态
   - 操作反馈

4. 可观测性埋点
   - 识别准确率（用户编辑率）
   - 语音模式使用率
   - 播放完成率

#### 后端任务（补充）

1. 可观测性埋点
   - ASR 成功率/失败率
   - TTS 成功率/失败率
   - 识别耗时分布
   - 合成耗时分布

#### 测试要求

- 编写异常场景单元测试
- 编写边界场景单元测试
- 端到端测试覆盖所有异常路径

#### 验收标准

- [ ] 空音频提交有提示
- [ ] ASR 失败有提示且可切回文字
- [ ] TTS 失败有提示但不阻断流程
- [ ] 播放可手动停止
- [ ] 语音模式切回文字可继续作答
- [ ] 重复提交有防护
- [ ] 网络错误有友好提示

---

### 14.5 阶段间依赖关系

```
阶段 1 (后端打底)
    ↓
阶段 2 (语音答题+人工复查)
    ↓
阶段 3 (面试官播报)
    ↓
阶段 4 (异常兜底+稳定性)
```

- 阶段 1 是所有后续阶段的基础
- 阶段 2 和阶段 3 无强依赖，可并行开发（输入/输出解耦）
- 阶段 4 依赖阶段 2 和阶段 3 完成

## 15. 测试与验收要点

### 15.1 阶段 1 验收（M1：后端能力打底）

#### 单元测试

- [ ] `AsrAdapter.transcribe()` 测试
  - 正常音频文件
  - 空文件
  - 格式错误文件

- [ ] `TtsAdapter.synthesize()` 测试
  - 正常文本
  - 空文本
  - 长文本

- [ ] `TtsAdapter.synthesizeStream()` 测试
  - 流式输出验证
  - 中断处理

- [ ] Strategy 层测试
  - `TextCandidateInputStrategy` 返回原文本
  - `VoiceCandidateInputStrategy` 调用 ASR
  - `TextOnlyOutputStrategy` 不附加语音
  - `TextAndVoiceOutputStrategy` 附加语音标识

- [ ] `InterviewTurnProcessor` 测试
  - 策略选择正确性
  - 流程编排完整性

#### 集成测试

- [ ] ASR 端到端：上传文件 → 识别文本
- [ ] TTS 端到端：文本 → 音频流

---

### 15.2 阶段 2 验收（M2：语音答题+人工复查）

#### 单元测试

- [ ] 识别接口单元测试
  - 正常识别
  - 识别失败
  - 空音频

#### 前端测试

- [ ] 录音功能测试
  - 开始录音
  - 停止录音
  - 上传音频

- [ ] 人工复查界面测试
  - 识别结果展示
  - 确认操作
  - 编辑操作
  - 重录操作

#### 集成测试

- [ ] 完整语音答题流程
  1. 切换到语音模式
  2. 录音并上传
  3. 接收识别结果
  4. 确认识别文本
  5. 会话推进到下一题

- [ ] 识别失败回退流程
  1. 录音上传
  2. 识别失败提示
  3. 切回文字模式
  4. 文字提交成功

#### 业务验收

- [ ] 用户可完整走通语音答题流程
- [ ] 识别文本可编辑后再提交
- [ ] 识别失败不影响面试继续

---

### 15.3 阶段 3 验收（M3：面试官语音播报）

#### 单元测试

- [ ] TTS 流接口单元测试
  - 正常流式输出
  - 空文本处理
  - 流中断处理

#### 前端测试

- [ ] 播放控制测试
  - 自动播放
  - 手动停止
  - 切换题目时停止上一轮

- [ ] 模式切换测试
  - text ↔ textVoice 切换
  - 切换后立即生效

#### 集成测试

- [ ] 答题 → 下一题 → 播报流程
  1. 切换到 `textVoice` 模式
  2. 提交答案
  3. 接收下一题
  4. 文字展示
  5. 语音自动播放

#### 业务验收

- [ ] 面试官语音播报正常
- [ ] 播放控制响应及时
- [ ] 模式切换体验流畅

---

### 15.4 阶段 4 验收（M4：异常兜底+稳定性）

#### 单元测试

- [ ] 异常处理测试
  - ASR 失败不抛异常
  - TTS 失败不抛异常
  - 空音频处理
  - 格式错误处理

- [ ] 边界场景测试
  - 重复提交防护
  - 超时处理
  - 并发控制

#### 前端测试

- [ ] 错误提示测试
  - 所有异常情况有提示
  - 提示文案清晰

- [ ] 状态管理测试
  - 加载状态正确
  - 禁用状态正确
  - 错误状态正确

#### 端到端测试

- [ ] 完整面试流程（文字答题）
- [ ] 完整面试流程（语音答题）
- [ ] 完整面试流程（混合模式）
- [ ] 所有异常场景覆盖

#### 业务验收

- [ ] 所有异常场景有兜底
- [ ] 用户体验友好
- [ ] 无阻断性 bug

#### 可观测性验收

- [ ] ASR 成功率/失败率可监控
- [ ] TTS 成功率/失败率可监控
- [ ] 用户编辑率可统计（反映 ASR 质量）
- [ ] 语音模式使用率可统计
- [ ] 关键指标有告警阈值

---

### 15.5 整体回归测试

阶段 4 完成后，执行完整回归测试：

- [ ] 现有文字答题流程不受影响
- [ ] 语音答题完整流程可用
- [ ] 语音播报完整流程可用
- [ ] 混合模式场景可用
- [ ] 所有异常场景有兜底
- [ ] 性能符合预期
