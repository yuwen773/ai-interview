# CLAUDE.md

## Tech Stack

- **Backend**: Spring Boot 3.5 + Java 21 + Spring AI 1.1 (DashScope/Qwen)
- **Frontend**: React 18 + Vite 5 + TailwindCSS 4 + Three.js (VRM avatars)
- **MiniApp**: Taro 3 (WeChat/Alipay/H5)
- **Infra**: PostgreSQL 16 (pgvector) + Redis 7 (Redisson) + MinIO

## Commands

```bash
# Backend
cd app && mvn spring-boot:run                           # localhost:8080
mvn spring-boot:run -Dspring-boot.run.profiles=local    # local profile
mvn test                                                 # Tests
mvn package -DskipTests                                  # Build JAR

# Frontend
cd frontend && pnpm install && pnpm dev                  # localhost:5173

# MiniApp
cd uniapp-interview && pnpm dev:weapp                    # WeChat

# Infra
docker-compose up -d postgres redis minio createbuckets
```

Environment: copy `.env.example` to `.env`, set `AI_BAILIAN_API_KEY` and `AI_MODEL`.

## Architecture

### Backend (`app/src/main/java/interview/guide/`)

Layered: `Controller → Service → Repository → Infrastructure`

| Module | Purpose |
|--------|---------|
| `resume` | Upload, parsing (Tika), AI analysis, history |
| `interview` | Session, question generation, answer evaluation, job strategies, Xunfei avatar |
| `knowledgebase` | RAG: upload, vectorization (pgvector), similarity search, chat |
| `profile` | User profiling, spaced repetition (SM-2), weak/strong point tracking |
| `dashboard` | Summary statistics |
| `audio` | ASR/TTS adapters |
| `llmprovider` | LLM Provider dynamic registry (DashScope/OpenAI), encrypted API key storage |
| `schedule` | Interview schedule: CRUD, AI parsing (Feishu/Tencent/Zoom), status tracking |

**Shared** (`common/`):
- `result/Result<T>` — unified response (`{ code, message, data }`)
- `exception/ErrorCode` — 30+ error codes in 8 domains
- `async/AbstractStreamConsumer<T>` / `AbstractStreamProducer<T>` — Redis Streams for async tasks
- `ai/StructuredOutputInvoker` — LLM structured JSON output with retry
- `annotation/RateLimit` — Redis-backed rate limiting

Prompt templates: `.st` files in `resources/prompts/` (14 templates).

**Infrastructure**: `RedisService`, `FileStorageService` (S3/MinIO), `PdfExportService`, `XunfeiWebSocketClient`.

DB: Flyway migrations in `resources/db/migration/`.

### Frontend (`frontend/src/`)

React Router lazy-loaded pages. Key:
- `api/request.ts` — Axios singleton, unwraps `Result<T>`
- `components/InterviewAvatar/` — Three.js VRM loader with lip-sync and expressions

## Key Patterns

- **Template Method**: `AbstractStreamConsumer`/`AbstractStreamProducer` for Redis Stream async tasks
- **Strategy**: Job-specific question generation (`JavaBackendStrategy`, `PythonAlgorithmStrategy`, `WebFrontendStrategy`)
- **Adapter**: `AsrAdapter`/`TtsAdapter` for audio abstraction
- **SM-2**: `SpacedRepetitionService` with `Sm2State` (JSONB) in `user_weak_points`
