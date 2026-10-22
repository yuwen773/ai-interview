# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Backend**: Spring Boot 3.5 + Java 21 + Spring AI 1.1 (Alibaba DashScope/Qwen)
- **Frontend**: React 18 + Vite 5 + TailwindCSS 4 + Three.js (VRM 3D avatars)
- **MiniApp**: Taro 3 (WeChat/Alipay/H5)
- **Infra**: PostgreSQL 16 (pgvector) + Redis 7 (Redisson) + MinIO (S3)

## Commands

```bash
# Backend
cd app && mvn spring-boot:run                           # Run (localhost:8080)
mvn spring-boot:run -Dspring-boot.run.profiles=local    # Run with profile
mvn test                                                 # Tests
mvn package -DskipTests                                  # Build JAR

# Frontend
cd frontend && pnpm install && pnpm dev                  # Dev (localhost:5173)
pnpm tsc --noEmit                                        # Type check
pnpm build                                               # Production build

# MiniApp
cd uniapp-interview && pnpm dev:weapp                    # WeChat dev

# Infrastructure
docker-compose up -d postgres redis minio createbuckets  # Start services
```

Environment: copy `.env.example` to `.env`, set `AI_BAILIAN_API_KEY` and `AI_MODEL`.

**Deploying to prod**: the prod profile is `application-prod.yml` and reads every secret from env vars — never put a key in it. Activate with `SPRING_PROFILES_ACTIVE=prod` in the systemd unit, **not** inside the yml (setting `spring.profiles.active` in a profile-specific file fails at startup). Do not add `logging.file.name`: Spring Boot's default rolling strategy deletes the old file while the JVM still holds the inode, so output lands in an unlinked file that `du` can't see but `df` counts (this filled a 49 GB disk on 2026-10-22).

## Architecture

### Backend (`app/src/main/java/interview/guide/`)

Layered: `Controller → Service → Repository → Infrastructure`

6 feature modules under `modules/`:

| Module | Purpose |
|--------|---------|
| `resume` | Upload, parsing (Tika), AI analysis, history |
| `interview` | Session management, question generation, answer evaluation, job strategies, Xunfei avatar |
| `knowledgebase` | RAG: document upload, vectorization (pgvector), similarity search, chat |
| `profile` | User profiling, spaced repetition (SM-2), weak/strong point tracking, semantic dedup |
| `dashboard` | Summary statistics |
| `audio` | ASR/TTS adapters |

Shared under `common/`:
- `result/Result<T>` — unified response wrapper (code 200 = success, all errors in HTTP 200 body)
- `exception/ErrorCode` — 30+ error codes in 8 domains (1xxx-9xxx)
- `async/AbstractStreamConsumer<T>` / `AbstractStreamProducer<T>` — Redis Streams template method for async tasks (4 streams defined in `AsyncTaskStreamConstants`)
- `ai/StructuredOutputInvoker` — LLM structured JSON output with retry
- `annotation/RateLimit` — Redis-backed rate limiting (GLOBAL/IP/USER dimensions)

Prompt templates: `.st` files in `resources/prompts/` (14 templates for interview, resume, KB, profile).

`infrastructure/`: `RedisService` (Redisson), `FileStorageService` (S3/MinIO), `PdfExportService` (iText 8), `XunfeiWebSocketClient`.

DB schema: `resources/db/schema.sql` is the authoritative baseline (one-shot, run manually before first boot). `resources/db/migration/V*.sql` are historical incremental scripts and are **not executed** — Flyway is not a dependency. Production runs with `ddl-auto: none`; after changing an entity, edit `schema.sql` and apply the same change to the live DB by hand.

### Frontend (`frontend/src/`)

React Router with lazy-loaded pages. Key paths:
- `api/request.ts` — Axios singleton, unwraps `Result<T>` in interceptor
- `components/InterviewAvatar/` — Three.js VRM loader with lip-sync (`LipSync.ts`) and expression animations (`AvatarAnimations.ts`)
- `pages/` — 11 pages: upload, history, interview (config → room with 3D avatar), knowledge base (manage/upload/chat), profile

### API Convention

All responses use `Result<T>`: `{ "code": 200, "message": "success", "data": {...} }`. Frontend interceptor rejects on non-200 code.

## Key Patterns

- **Template Method**: `AbstractStreamConsumer`/`AbstractStreamProducer` for Redis Stream async tasks (resume analysis, KB vectorization, interview evaluation, profile update)
- **Strategy**: Job-specific interview question generation (`JavaBackendStrategy`, `PythonAlgorithmStrategy`, `WebFrontendStrategy`)
- **Adapter**: `AsrAdapter`/`TtsAdapter` for audio abstraction
- **SM-2 Spaced Repetition**: `SpacedRepetitionService` with `Sm2State` (JSONB) in `user_weak_points`
