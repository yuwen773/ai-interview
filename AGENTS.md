# Repository Guidelines
> using UTF-8 to read all documents
## Project Structure & Module Organization
This repository is split by runtime:

- `app/`: Spring Boot backend. Main code lives in `app/src/main/java/interview/guide`, organized into `common`, `infrastructure`, and feature modules under `modules/` (`audio`, `interview`, `knowledgebase`, `resume`).
- `app/src/test/java`: JUnit and integration tests.
- `frontend/`: Vite + React web client. UI code is in `frontend/src`, grouped into `api`, `components`, `hooks`, `pages`, `types`, and `utils`.
- `uniapp-interview/`: Taro-based mobile/mini-program client.
- `docker/` and `docker-compose.yml`: local infrastructure setup.
- `docs/`: architecture, API, deployment, and development notes.

Do not commit generated output such as `app/target/` or frontend build artifacts.

## Build, Test, and Development Commands
- `docker-compose up -d postgres redis minio createbuckets`: start local dependencies.
- `mvn test`: run backend tests from the repo root.
- `cd app && mvn spring-boot:run -Dspring-boot.run.profiles=local`: run the backend on `:8080`.
- `cd frontend && pnpm install && pnpm dev`: start the web app on `:5173`.
- `cd frontend && pnpm build`: type-check and produce a production build.
- `cd uniapp-interview && pnpm install && pnpm dev:weapp`: run the mini-program locally.

## Coding Style & Naming Conventions
Use Java 21 and TypeScript. Follow 4-space indentation in Java and keep existing TypeScript formatting style in touched files. Use:

- PascalCase for Java classes and React components, for example `ResumeUploadService` and `FileUploadCard`.
- camelCase for methods, functions, and variables.
- UPPER_SNAKE_CASE for constants.
- lowercase package paths such as `interview.guide.modules.resume.service`.

Frontend linting is configured in `frontend/eslint.config.js`. Run ESLint before large frontend changes if you add a local script or IDE task.

## Testing Guidelines
Backend tests use JUnit 5 and Spring Boot Test. Name test classes `*Test` or `*IntegrationTest` and keep them near the feature they cover under `app/src/test/java`. Run `mvn test` before opening a PR. There is no established frontend test suite yet, so verify web and mini-program changes manually and document what you checked.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commits, often with a scope, for example `feat(frontend): add voice control panel` or `fix: correct callback signature`. Keep subjects short and imperative.

PRs should include a clear summary, linked issue if applicable, test notes, and screenshots or short recordings for UI work. Call out config changes explicitly, especially anything involving `.env`, AI keys, storage, Redis, or PostgreSQL.

## Security & Configuration Tips
Start from `.env.example` and keep secrets out of git. Review `app/src/main/resources/application-*.yml` before changing environment-specific settings. Treat AI credentials, MinIO access keys, and database connection details as sensitive.
