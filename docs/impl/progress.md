# Progress

## 2026-03-21

### 模拟面试语音能力一期 - 阶段 1

- 完成 ASR 基础修复，`AsrService` 已改为直接处理上传的 `MultipartFile`
- 统一 Spring AI Alibaba 依赖版本，父子 POM 对齐到 `1.1.2.2`
- 新增音频 Adapter 层：`AsrAdapter`、`TtsAdapter` 及默认实现
- 新增语音面试骨架：输入/输出模式枚举、轮次输入输出模型、输入输出策略、`InterviewTurnProcessor`
- 为 Adapter、Strategy、Processor 及音频服务补充单元测试
- 为阶段一相关代码补充说明性注释，便于后续接入阶段 2/3

### 验证

- 阶段一相关定向测试通过
- 全量 `mvn -pl app test` 仍存在仓库内原有 `DocumentParseIntegrationTest` 资源缺失问题，未在本次处理范围

### 模拟面试语音能力一期 - 阶段 2

- 完成前端语音答题链路：录音、识别、人工确认、重录、确认提交
- 新增后端语音识别接口，仅返回识别文本，不直接推进面试流程
- 修复 Spring Controller `@PathVariable` 参数名反射问题，并开启 `-parameters`
- 完成语音识别联调修复：切换为 `wav + 16000Hz`、使用 DashScope 实时 ASR、按 64 KB 分片推流
- 补充语音识别问题复盘与最终链路说明文档到 `docs/fix`

### 阶段 2 验证

- `mvn -pl app "-Dtest=AsrServiceTest,InterviewControllerTest,InterviewTurnProcessorTest,VoiceCandidateInputStrategyTest" test` 通过
- `mvn -pl app -DskipTests compile` 通过
- `pnpm build` 通过

### 模拟面试语音能力一期 - 阶段 3

- 新增题目播报接口 `POST /api/interview/tts/stream`
- 答题接口支持 `interviewerOutputMode`，统一返回 `InterviewTurnResponse`
- 前端接入面试官输出模式切换与题目自动播报
- 支持手动停止、重复播放，同题重播复用本地缓存音频
- TTS 同步合成失败时回退到流式聚合，保障题目播报可用

### 阶段 3 验证

- `mvn -pl app "-Dtest=InterviewControllerTest,TtsServiceTest,DefaultTtsAdapterTest" test` 通过
- `pnpm build` 通过

### 模拟面试语音能力一期 - 阶段 4

- 后端补充语音请求防重，避免同一题重复识别或重复提交
- 后端补充空音频、非法问题索引、非支持音频格式等边界校验
- 后端为 ASR/TTS 增加结构化埋点日志，记录成功/失败与耗时
- TTS 接口在异常时返回空流并记录失败，不阻断面试主流程
- 前端补充录音/播放互斥、重复操作防护和更清晰的加载禁用态
- 前端补充语音失败回退操作，可直接重试或切回文字模式继续作答
- 前端补充识别文本被编辑的轻量埋点日志
