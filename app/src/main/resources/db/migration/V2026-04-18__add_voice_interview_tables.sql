-- Voice Interview Tables
-- V2026-04-18__add_voice_interview_tables.sql

-- 语音面试会话表
CREATE TABLE voice_interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    role_type VARCHAR(64) NOT NULL,
    skill_id VARCHAR(64) DEFAULT 'java-backend',
    difficulty VARCHAR(16) DEFAULT 'mid',
    custom_jd_text TEXT,
    resume_id BIGINT,
    intro_enabled BOOLEAN DEFAULT TRUE,
    tech_enabled BOOLEAN DEFAULT TRUE,
    project_enabled BOOLEAN DEFAULT TRUE,
    hr_enabled BOOLEAN DEFAULT TRUE,
    llm_provider VARCHAR(50) DEFAULT 'dashscope',
    current_phase VARCHAR(20),
    status VARCHAR(20),
    planned_duration INTEGER DEFAULT 30,
    actual_duration INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    paused_at TIMESTAMP,
    resumed_at TIMESTAMP,
    evaluate_status VARCHAR(20),
    evaluate_error VARCHAR(500)
);

-- 语音面试消息表
CREATE TABLE voice_interview_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT,
    message_type VARCHAR(20),
    phase VARCHAR(20),
    user_recognized_text TEXT,
    ai_generated_text TEXT,
    timestamp TIMESTAMP,
    sequence_num INTEGER,
    created_at TIMESTAMP
);

-- 语音面试评估表
CREATE TABLE voice_interview_evaluations (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT UNIQUE,
    overall_score INTEGER,
    overall_feedback TEXT,
    question_evaluations_json TEXT,
    strengths_json TEXT,
    improvements_json TEXT,
    reference_answers_json TEXT,
    interviewer_role VARCHAR(255),
    interview_date TIMESTAMP,
    created_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_voice_interview_messages_session_id ON voice_interview_messages(session_id);
CREATE INDEX idx_voice_interview_sessions_user_id ON voice_interview_sessions(user_id);
