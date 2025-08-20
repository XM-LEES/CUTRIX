-- backend/migrations/000002_add_auth_to_workers.up.sql

-- 为 Workers 表添加认证和角色字段
ALTER TABLE Workers ADD COLUMN username VARCHAR(50);
ALTER TABLE Workers ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE Workers ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'worker';
ALTER TABLE Workers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 使用现有的 name 字段填充 username，并确保其唯一
UPDATE Workers SET username = name;
ALTER TABLE Workers ALTER COLUMN username SET NOT NULL;
ALTER TABLE Workers ADD CONSTRAINT workers_username_key UNIQUE (username);

-- 为方便测试，手动创建一个管理员账号
-- 密码是 'admin'
INSERT INTO Workers (name, username, password_hash, role)
VALUES ('admin', 'admin', '$2a$10$f.wT9q3p3.V.d52a7.g.6uDSj7fJ8i3a2L419p2.9wXl1/t.b.z/S', 'admin')
ON CONFLICT (username) DO NOTHING;
