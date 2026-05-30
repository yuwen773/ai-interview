CREATE TABLE IF NOT EXISTS user_behavior_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    namespace VARCHAR(32) NOT NULL,
    signal_key VARCHAR(128) NOT NULL,
    polarity VARCHAR(16) NOT NULL,
    statement TEXT NOT NULL,
    evidence_json JSONB NOT NULL DEFAULT '[]',
    source_type VARCHAR(32),
    source_session_id BIGINT,
    times_seen INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    improved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_behavior_signal UNIQUE (user_id, namespace, signal_key)
);

CREATE TABLE IF NOT EXISTS user_profile_patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    pattern_type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    summary TEXT NOT NULL,
    related_topics JSONB NOT NULL DEFAULT '[]',
    related_signal_ids JSONB NOT NULL DEFAULT '[]',
    evidence_json JSONB NOT NULL DEFAULT '[]',
    confidence NUMERIC(4, 3),
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS last_consolidated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_behavior_signal_user_status
    ON user_behavior_signals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_behavior_signal_user_namespace
    ON user_behavior_signals (user_id, namespace);
CREATE INDEX IF NOT EXISTS idx_profile_patterns_user_status_last_seen
    ON user_profile_patterns (user_id, status, last_seen DESC);

DELETE FROM user_profiles p0
USING user_profiles pd
WHERE p0.user_id = '0'
  AND pd.user_id = 'default';

UPDATE user_profiles SET user_id = 'default' WHERE user_id = '0';

DELETE FROM user_topic_mastery m0
USING user_topic_mastery md
WHERE m0.user_id = '0'
  AND md.user_id = 'default'
  AND m0.topic = md.topic;

UPDATE user_topic_mastery SET user_id = 'default' WHERE user_id = '0';

DELETE FROM user_weak_points w0
USING user_weak_points wd
WHERE w0.user_id = '0'
  AND wd.user_id = 'default'
  AND w0.question_text = wd.question_text;

UPDATE user_weak_points SET user_id = 'default' WHERE user_id = '0';

DELETE FROM user_strong_points s0
USING user_strong_points sd
WHERE s0.user_id = '0'
  AND sd.user_id = 'default'
  AND s0.topic = sd.topic
  AND s0.description = sd.description;

UPDATE user_strong_points SET user_id = 'default' WHERE user_id = '0';
