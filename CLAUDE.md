# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Interview Platform is a full-stack intelligent mock interview system featuring AI-powered virtual interviewers with 3D avatars, voice interaction, and resume analysis. It consists of three main parts:

- **Backend** (`app/`): Spring Boot 4 + Java 21 API
- **Frontend** (`frontend/`): React 18 + Vite web app
- **MiniApp** (`uniapp-interview/`): Taro 3 multi-platform app (WeChat/Alipay/H5)

## Common Commands

### Backend (Spring Boot)

```bash
cd app

# Run with Maven
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Build
mvn package -DskipTests

# Run tests
mvn test
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
pnpm install

# Development server (http://localhost:5173)
pnpm dev

# Type checking
pnpm tsc --noEmit

# Production build
pnpm build
```

### MiniApp (Taro)

```bash
cd uniapp-interview

pnpm dev:weapp    # WeChat Mini Program
pnpm dev:h5        # H5
pnpm build:weapp   # Build for WeChat
```

### Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO
docker-compose up -d postgres redis minio createbuckets

# View backend logs
docker-compose logs -f app
```

### Environment Setup

Copy `.env.example` to `.env` and configure:
- `AI_BAILIAN_API_KEY` - Alibaba DashScope API key for AI (Qwen model)
- `AI_MODEL` - Model name (default: qwen-plus)

## Architecture

### Backend Architecture

The backend follows a layered architecture:

```
Controller → Service → Repository → Infrastructure
```

Key modules under `app/src/main/java/interview/guide/`:

| Module | Purpose |
|--------|---------|
| `modules/resume/` | Resume upload, parsing, analysis |
| `modules/interview/` | Interview session management, question generation |
| `modules/knowledgebase/` | RAG-based document Q&A |
| `modules/audio/` | ASR (speech-to-text) and TTS (text-to-speech) |
| `common/` | Shared: exception handling, result封装, AOP |
| `infrastructure/` | Redis, file storage, PDF export |

**Async Processing**: Uses Redis Streams with template method pattern (`AbstractStreamConsumer`/`AbstractStreamProducer`) for long-running tasks like resume analysis and vectorization.

**AI Integration**: Uses Spring AI with `StructuredOutputInvoker` for typed AI responses and prompt templates (`.st` files under `resources/prompts/`).

### Frontend Architecture

The frontend uses React Router with lazy-loaded pages:

```
App.tsx → Routes → Page Components → Hooks/API
```

Key directories:
- `src/pages/` - Route pages (Upload, History, Interview, KnowledgeBase)
- `src/components/` - Reusable components including `InterviewAvatar/` (3D VRM) and `InterviewRoom/` (interview UI)
- `src/api/` - Axios API clients
- `src/hooks/` - Custom hooks (useTheme, useAvatar, useRecording)
- `src/components/InterviewAvatar/` - Three.js VRM model loader with lip-sync

**3D Avatar**: Uses `@pixiv/three-vrm` to load VRM models. The `InterviewAvatar` component manages the 3D interviewer appearance with avatar animations and voice-driven lip-sync.

**Interview Flow**: `InterviewPage` → `InterviewConfigPanel` (select job role) → `InterviewRoom` (3D avatar + chat panel)

### MiniApp Architecture

Taro 3-based multi-platform app sharing API contracts with the frontend. Key pages mirror the web app: upload, resume list, interview, and report views.

## API Conventions

The backend uses a unified `Result<T>` response wrapper:

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

Error responses have `code != 200`. Frontend API clients (`src/api/*.ts`) handle this via a response interceptor.

## Key Patterns

- **Template Method**: `AbstractStreamConsumer`/`AbstractStreamProducer` for Redis Stream async tasks
- **Strategy**: Job-specific interview strategies (`JavaBackendStrategy`, `WebFrontendStrategy`)
- **Adapter**: `AsrAdapter`/`TtsAdapter` for audio service abstraction
- **Rate Limiting**: `@RateLimit` annotation with Redis-backed `RateLimitAspect`

## Database

- **PostgreSQL** (port 5432): Main data store with pgvector extension for embedding similarity search
- **Redis** (port 6379): Session cache, rate limiting, async task queues (Streams)
- **MinIO** (port 9000): File storage for resumes and documents

