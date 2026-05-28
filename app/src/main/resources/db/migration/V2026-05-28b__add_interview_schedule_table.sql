CREATE TABLE interview_schedule (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    interview_time TIMESTAMP NOT NULL,
    interview_type VARCHAR(50),
    meeting_link TEXT,
    round_number INT DEFAULT 1,
    interviewer VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_interview_schedule_status ON interview_schedule(status);
CREATE INDEX idx_interview_schedule_interview_time ON interview_schedule(interview_time);