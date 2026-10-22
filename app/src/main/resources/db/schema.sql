-- ============================================================================
-- interview-coach 生产库初始化脚本（PostgreSQL 16 + pgvector 0.8）
--
-- 为什么需要这个文件：仓库里只有 db/migration/ 下的「增量」迁移，没有建全表的
-- 基线 DDL，也没有 Flyway。原开发环境靠 spring.jpa.hibernate.ddl-auto=update
-- 自动建表。这里把实体 + 增量迁移合并成一份可重复执行的基线，生产环境用
-- ddl-auto=none 建好一次即可。
--
-- 列名规则：Hibernate 默认用 CamelCaseToUnderscoresNamingStrategy，
-- 实体字段 aBc 落库即 a_bc；写了 @Column(name="x") 的则原样用 x。
-- 所以整库统一蛇形，与迁移 SQL 的写法一致。首次建表时把 accessCount 写成
-- 带引号的驼峰会直接导致运行期 "column ... does not exist"。
--
-- 用法：
--   sudo -u postgres psql -d interview_guide -v ON_ERROR_STOP=1 -f schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- 简历
--   列名依据 ResumeEntity：没有 @Column(name=) → 一律驼峰转蛇形
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumes (
    id                 BIGSERIAL PRIMARY KEY,
    file_hash         VARCHAR(64)  NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    file_size         BIGINT,
    content_type      VARCHAR(255),
    storage_key       VARCHAR(500),
    storage_url       VARCHAR(1000),
    resume_text       TEXT,
    uploaded_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at   TIMESTAMP,
    access_count      INTEGER      DEFAULT 1,
    analyze_status    VARCHAR(20)  DEFAULT 'PENDING',
    analyze_error     VARCHAR(500)
);

-- ResumeAnalysisEntity: resume_id 显式命名，其余驼峰转蛇形
CREATE TABLE IF NOT EXISTS resume_analyses (
    id                 BIGSERIAL PRIMARY KEY,
    resume_id          BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    overall_score     INTEGER,
    content_score     INTEGER,
    structure_score   INTEGER,
    skill_match_score  INTEGER,
    expression_score  INTEGER,
    project_score     INTEGER,
    summary          TEXT,
    strengths_json    TEXT,
    suggestions_json  TEXT,
    analyzed_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume ON resume_analyses(resume_id);

-- ---------------------------------------------------------------------------
-- 面试
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_sessions (
    id                      BIGSERIAL PRIMARY KEY,
    session_id             VARCHAR(36) NOT NULL UNIQUE,
    resume_id               BIGINT      NOT NULL REFERENCES resumes(id),
    total_questions        INTEGER,
    job_role               VARCHAR(50),
    job_label_snapshot      VARCHAR(100),
    current_question_index  INTEGER DEFAULT 0,
    status                VARCHAR(20) DEFAULT 'CREATED',
    questions_json         TEXT,
    overall_score          INTEGER,
    overall_feedback       TEXT,
    strengths_json         TEXT,
    improvements_json      TEXT,
    reference_answers_json  TEXT,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at           TIMESTAMP,
    evaluate_status        VARCHAR(20),
    evaluate_error         VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_resume ON interview_sessions(resume_id);

CREATE TABLE IF NOT EXISTS interview_answers (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_index  INTEGER,
    question       TEXT,
    category       VARCHAR(255),
    user_answer     TEXT,
    score          INTEGER,
    feedback       TEXT,
    reference_answer TEXT,
    key_points_json  TEXT,
    answered_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session ON interview_answers(session_id);

-- ---------------------------------------------------------------------------
-- 知识库 / RAG
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id                 BIGSERIAL PRIMARY KEY,
    file_hash         VARCHAR(64)  NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    category         VARCHAR(100),
    original_filename VARCHAR(255) NOT NULL,
    file_size         BIGINT,
    content_type      VARCHAR(255),
    storage_key       VARCHAR(500),
    storage_url       VARCHAR(1000),
    uploaded_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at   TIMESTAMP,
    access_count      INTEGER DEFAULT 0,
    question_count    INTEGER DEFAULT 0,
    vector_status     VARCHAR(20) DEFAULT 'PENDING',
    vector_error      VARCHAR(500),
    chunk_count       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rag_chat_sessions (
    id             BIGSERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    status       VARCHAR(20) DEFAULT 'ACTIVE',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    is_pinned     BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS rag_session_knowledge_bases (
    session_id        BIGINT NOT NULL REFERENCES rag_chat_sessions(id) ON DELETE CASCADE,
    knowledge_base_id BIGINT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, knowledge_base_id)
);

CREATE TABLE IF NOT EXISTS rag_chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES rag_chat_sessions(id) ON DELETE CASCADE,
    type          VARCHAR(20) NOT NULL,
    content       TEXT NOT NULL,
    message_order  INTEGER NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP,
    completed     BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_rag_chat_messages_session ON rag_chat_messages(session_id);

-- ---------------------------------------------------------------------------
-- 用户画像（来自 db/migration/V2026-04-15*）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL UNIQUE,
    target_role VARCHAR(128),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_topic_mastery (
    id            BIGSERIAL PRIMARY KEY,
    user_id       VARCHAR(64) NOT NULL,
    topic         VARCHAR(64) NOT NULL,
    score         DECIMAL(5,2) DEFAULT 50.0,
    session_count INT DEFAULT 0,
    notes         TEXT,
    last_assessed TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_topic_mastery UNIQUE (user_id, topic)
);

CREATE TABLE IF NOT EXISTS user_weak_points (
    id             BIGSERIAL PRIMARY KEY,
    user_id        VARCHAR(64) NOT NULL,
    topic          VARCHAR(64) NOT NULL,
    question_text  TEXT NOT NULL,
    answer_summary TEXT,
    score          DECIMAL(5,2),
    source         VARCHAR(32) DEFAULT 'INTERVIEW',
    session_id     BIGINT,
    sr_state       JSONB DEFAULT '{}'::jsonb,
    history        JSONB DEFAULT '[]'::jsonb,
    embedding      BYTEA,
    is_improved    BOOLEAN DEFAULT FALSE,
    improved_at    TIMESTAMP,
    times_seen     INT DEFAULT 1,
    first_seen     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 原迁移里的 ((sr_state->>'next_review')::date) 表达式索引建不出来：
-- text->date 是 STABLE 不是 IMMUTABLE，PostgreSQL 会直接拒绝。到期复习查询
-- 先按 user_id 过滤，行数很少，部分索引足够。
--
-- 不要再单独建 (user_id)：它是下面两个复合索引的前缀，查询优化器能直接用，
-- 单独一份只是多占空间、多一份写放大。
CREATE INDEX IF NOT EXISTS idx_weak_user_topic ON user_weak_points (user_id, topic) WHERE is_improved = FALSE;
CREATE INDEX IF NOT EXISTS idx_weak_last_seen  ON user_weak_points (user_id, last_seen) WHERE is_improved = FALSE;

CREATE TABLE IF NOT EXISTS user_strong_points (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL,
    topic       VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    source      VARCHAR(32) DEFAULT 'INTERVIEW',
    session_id  BIGINT,
    first_seen  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_strong_user_topic ON user_strong_points (user_id, topic);

-- ---------------------------------------------------------------------------
-- 语音面试（来自 db/migration/V2026-04-18）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_interview_sessions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          VARCHAR(255),
    role_type        VARCHAR(64) NOT NULL,
    skill_id         VARCHAR(64) DEFAULT 'java-backend',
    difficulty       VARCHAR(16) DEFAULT 'mid',
    custom_jd_text   TEXT,
    resume_id        BIGINT,
    intro_enabled    BOOLEAN DEFAULT TRUE,
    tech_enabled     BOOLEAN DEFAULT TRUE,
    project_enabled  BOOLEAN DEFAULT TRUE,
    hr_enabled       BOOLEAN DEFAULT TRUE,
    llm_provider     VARCHAR(50) DEFAULT 'dashscope',
    current_phase    VARCHAR(20),
    status           VARCHAR(20),
    planned_duration INTEGER DEFAULT 30,
    actual_duration  INTEGER,
    start_time       TIMESTAMP,
    end_time         TIMESTAMP,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP,
    paused_at        TIMESTAMP,
    resumed_at       TIMESTAMP,
    evaluate_status  VARCHAR(20),
    evaluate_error   VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_voice_interview_sessions_user_id ON voice_interview_sessions(user_id);

CREATE TABLE IF NOT EXISTS voice_interview_messages (
    id                   BIGSERIAL PRIMARY KEY,
    session_id           BIGINT,
    message_type         VARCHAR(20),
    phase                VARCHAR(20),
    user_recognized_text TEXT,
    ai_generated_text    TEXT,
    timestamp            TIMESTAMP,
    sequence_num         INTEGER,
    created_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_voice_interview_messages_session_id ON voice_interview_messages(session_id);

CREATE TABLE IF NOT EXISTS voice_interview_evaluations (
    id                        BIGSERIAL PRIMARY KEY,
    session_id                BIGINT UNIQUE,
    overall_score             INTEGER,
    overall_feedback          TEXT,
    question_evaluations_json TEXT,
    strengths_json            TEXT,
    improvements_json         TEXT,
    reference_answers_json    TEXT,
    interviewer_role          VARCHAR(255),
    interview_date            TIMESTAMP,
    created_at                TIMESTAMP
);

-- Spring AI PgVectorStore 自己在启动时 CREATE TABLE IF NOT EXISTS vector_store，
-- 这里不重复建。
