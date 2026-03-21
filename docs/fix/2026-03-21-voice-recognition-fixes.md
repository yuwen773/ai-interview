# 2026-03-21 语音识别问题修复记录

## 背景

阶段二语音答题联调时，前后端链路已打通，但语音识别连续出现多轮失败。最终问题不在单点，而是在接口形态、音频格式、采样率和 websocket 发送方式上连续踩坑。

## 解决的问题

### 1. DashScope prompt 类型不匹配

- 现象：后端报错 `Prompt type is not DashScopeAudioTranscriptionPrompt`
- 原因：`QWEN3_ASR_FLASH` 不接受通用 `AudioTranscriptionPrompt`
- 处理：确认 SDK 行为后，放弃这条不适合本地文件上传的调用路径

### 2. QWEN3 ASR 将输入当成 URL

- 现象：后端报错 `The provided URL does not appear to be valid`
- 原因：`QWEN3_ASR_FLASH` 这条批量转写路径更适合远程文件地址，不适合直接上传本地录音字节
- 处理：改为 `PARAFORMER_REALTIME_V2` 的 websocket 流式识别

### 3. 浏览器录音格式与 DashScope 不兼容

- 现象：`UNSUPPORTED_FORMAT`、`NO_VALID_AUDIO_ERROR`
- 原因：前端最初使用 `MediaRecorder`，实际产物是 `audio/webm;codecs=opus` 容器；DashScope 实时 ASR 不接受这类浏览器容器流直接上传
- 处理：前端改为 Web Audio 直接采样并编码为 `audio/wav`

### 4. 音频格式识别被文件名误导

- 现象：日志里 `contentType` 是 `audio/webm;codecs=opus`，但后端发送给 DashScope 的 `format` 仍然是 `webm`
- 原因：后端优先按文件名 `answer.webm` 取扩展名
- 处理：格式解析改为优先使用 `Content-Type`，仅在缺失时才退回扩展名

### 5. websocket 单帧过大

- 现象：`Max frame length of 262144 has been exceeded`
- 原因：后端一次性把整段音频作为一个二进制 frame 发送
- 处理：改用 `streamRecognition(Flux<ByteBuffer>, options)`，按 64 KB 分片推流

### 6. 采样率不一致导致空识别结果

- 现象：任务正常完成，但 `语音识别结果为空`
- 原因：前端生成的 WAV 采样率是浏览器默认值，后端声明给 DashScope 的是 `16000`
- 处理：
  - 前端录音重采样到 `16000 Hz`
  - 后端 ASR 参数显式设置 `sampleRate(16000)`

## 最终方案

- 前端：
  - 录音方式从 `MediaRecorder webm` 改为 Web Audio + `wav`
  - 录音数据重采样到 `16000 Hz`
  - 上传文件名按 Blob MIME 自动推断

- 后端：
  - 使用 `PARAFORMER_REALTIME_V2`
  - 使用 `streamRecognition` 发送分片音频
  - 显式传递 `format` 和 `sampleRate`
  - 聚合最后一段非空识别结果作为转写文本

## 这次联调的经验

- 浏览器“能播放”的录音格式，不等于 ASR 服务“能直接识别”的上传格式
- 语音识别链路要同时关注：模型接口类型、容器格式、编码格式、采样率、分片方式
- 先看真实日志，再猜问题；这次每一步基本都能从服务端日志直接定位
