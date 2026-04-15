-- V2026-04-15__add_user_profile_tables.sql

CREATE TABLE user_profiles (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL UNIQUE,
    target_role VARCHAR(128),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_topic_mastery (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    topic           VARCHAR(64) NOT NULL,
    score           DECIMAL(5,2) DEFAULT 50.0,
    session_count   INT DEFAULT 0,
    notes           TEXT,
    last_assessed   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_topic_mastery UNIQUE (user_id, topic)
);

CREATE TABLE user_weak_points (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    topic           VARCHAR(64) NOT NULL,
    question_text   TEXT NOT NULL,
    answer_summary  TEXT,
    score           DECIMAL(5,2),
    source          VARCHAR(32) DEFAULT 'INTERVIEW',
    session_id      BIGINT,
    sr_state        JSONB DEFAULT
        '{"interval_days":1,"ease_factor":2.5,"repetitions":0,"next_review":null,"last_score":null}',
    is_improved     BOOLEAN DEFAULT FALSE,
    improved_at     TIMESTAMP,
    times_seen      INT DEFAULT 1,
    first_seen      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_topic_question UNIQUE (user_id, question_text)
);

CREATE INDEX idx_weak_due_review ON user_weak_points (user_id, ((sr_state->>'next_review')::date)) WHERE is_improved = FALSE;
CREATE INDEX idx_weak_user_topic ON user_weak_points (user_id, topic) WHERE is_improved = FALSE;
CREATE INDEX idx_mastery_user ON user_topic_mastery (user_id);