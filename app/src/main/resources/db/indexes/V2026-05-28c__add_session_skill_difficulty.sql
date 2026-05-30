-- 添加 skillId 和 difficulty 字段到 interview_sessions 表
-- 用于 InterviewHubPage 面试中心首页的会话列表

ALTER TABLE interview_sessions
ADD COLUMN IF NOT EXISTS skill_id VARCHAR(50) DEFAULT 'java-backend',
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'mid';

-- 为新字段添加索引
CREATE INDEX IF NOT EXISTS idx_interview_session_skill_created
ON interview_sessions(skill_id, created_at);