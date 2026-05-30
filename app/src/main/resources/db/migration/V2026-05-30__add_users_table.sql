-- V2026-05-30__add_users_table.sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nickname        VARCHAR(128),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Step 1: Add nullable column (no default, allows existing rows)
ALTER TABLE resumes ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Update ALL existing rows (no WHERE - all rows need this)
UPDATE resumes SET user_id = 1;

-- Step 3: Set NOT NULL constraint after data is populated
ALTER TABLE resumes ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- 插入 default_user（email 故意用不可能真实存在的地址）
INSERT INTO users (id, email, password_hash, nickname, created_at, updated_at)
VALUES (1, 'default@local', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldSxad3/Og1YKAQv0fe', '默认用户', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 迁移：所有已有简历关联到 default_user
UPDATE resumes SET user_id = 1 WHERE user_id IS NULL;

-- 迁移：所有已有画像关联到 default_user
UPDATE user_profiles SET user_id = 'resume:1' WHERE user_id IS NULL OR user_id = 'java-backend';