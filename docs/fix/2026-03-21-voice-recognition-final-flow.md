# 2026-03-21 语音识别最终链路说明

## 当前链路

### 1. 前端录音

- 文件位置：`frontend/src/hooks/useRecording.ts`
- 方案：
  - 使用 Web Audio 获取麦克风音频
  - 采集单声道 PCM 浮点数据
  - 重采样到 `16000 Hz`
  - 编码为 `audio/wav`

### 2. 前端上传

- 文件位置：`frontend/src/api/interview.ts`
- 接口：
  - `POST /api/interview/sessions/{sessionId}/answers/voice/recognize`
- 请求体：
  - `multipart/form-data`
  - 字段 `questionIndex`
  - 字段 `file`

### 3. 后端识别入口

- 文件位置：`app/src/main/java/interview/guide/modules/interview/InterviewController.java`
- 行为：
  - 只做语音识别
  - 不推进面试题目
  - 返回识别文本，供前端人工确认后再提交

### 4. 后端 ASR 服务

- 文件位置：`app/src/main/java/interview/guide/modules/audio/service/AsrService.java`
- 方案：
  - 使用 DashScope `PARAFORMER_REALTIME_V2`
  - 使用 `streamRecognition(Flux<ByteBuffer>, options)`
  - 按 64 KB 切分音频，避免 websocket 单帧过大
  - 显式传递：
    - `format`
    - `sampleRate=16000`
    - `languageHints=["zh","en"]`
  - 最终取最后一段非空识别结果

## 当前关键约束

- 前端上传音频必须是 `wav`
- 采样率必须和后端声明一致，目前固定 `16000 Hz`
- 识别接口只负责“转写”，不直接当作答案提交
- 用户仍需在前端确认识别文本，再调用正式答题提交接口

## 相关文件

- [useRecording.ts](/D:/Work/code/ai-interview/frontend/src/hooks/useRecording.ts)
- [interview.ts](/D:/Work/code/ai-interview/frontend/src/api/interview.ts)
- [InterviewPage.tsx](/D:/Work/code/ai-interview/frontend/src/pages/InterviewPage.tsx)
- [InterviewChatPanel.tsx](/D:/Work/code/ai-interview/frontend/src/components/InterviewChatPanel.tsx)
- [InterviewController.java](/D:/Work/code/ai-interview/app/src/main/java/interview/guide/modules/interview/InterviewController.java)
- [AsrService.java](/D:/Work/code/ai-interview/app/src/main/java/interview/guide/modules/audio/service/AsrService.java)

## 后续如果再改

- 如果切换 ASR 供应商，优先保留“前端确认后再提交”的交互，不要让识别结果直接推进面试
- 如果要支持更长录音，优先检查：
  - 音频时长
  - 分片大小
  - websocket 限制
  - 供应商对 `wav/pcm/opus` 的真实支持情况
