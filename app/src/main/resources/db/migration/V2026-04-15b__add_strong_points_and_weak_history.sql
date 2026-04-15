-- V2026-04-15b__add_strong_points_and_weak_history.sql

CREATE TABLE user_strong_points (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL,
    topic       VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    source      VARCHAR(32) DEFAULT 'INTERVIEW',
    session_id  BIGINT,
    first_seen  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strong_user_topic ON user_strong_points (user_id, topic);

ALTER TABLE user_weak_points ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';
