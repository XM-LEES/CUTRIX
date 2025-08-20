-- 创建款号表
CREATE TABLE Styles (
    style_id SERIAL PRIMARY KEY,
    style_number VARCHAR(50) NOT NULL UNIQUE
);

-- 创建员工表
CREATE TABLE Workers (
    worker_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    notes VARCHAR(150),
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'worker',
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 创建订单明细表
CREATE TABLE Order_Details (
    detail_id SERIAL PRIMARY KEY,
    style_id INT NOT NULL REFERENCES Styles(style_id),
    color VARCHAR(50) NOT NULL,
    quantity INT NOT NULL
);

-- 创建生产任务表
CREATE TABLE Production_Tasks (
    task_id SERIAL PRIMARY KEY,
    style_id INT NOT NULL REFERENCES Styles(style_id),
    marker_id VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    planned_layers INT NOT NULL,
    completed_layers INT NOT NULL DEFAULT 0
);

-- 创建布匹表
CREATE TABLE Fabric_Rolls (
    roll_id VARCHAR(100) PRIMARY KEY,
    style_id INT NOT NULL REFERENCES Styles(style_id),
    color VARCHAR(50) NOT NULL,
    registration_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT '可用'
);

-- 创建生产记录表
CREATE TABLE Production_Logs (
    log_id BIGSERIAL PRIMARY KEY,
    task_id INT REFERENCES Production_Tasks(task_id),
    roll_id VARCHAR(100) REFERENCES Fabric_Rolls(roll_id),
    parent_log_id BIGINT REFERENCES Production_Logs(log_id),
    worker_id INT NOT NULL REFERENCES Workers(worker_id),
    process_name VARCHAR(20) NOT NULL,
    layers_completed INT,
    log_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器函数：更新已完成为层数
CREATE OR REPLACE FUNCTION update_completed_layers()
RETURNS TRIGGER AS $$
BEGIN
    -- 仅当插入的日志是'拉布'类型时，才执行更新操作
    IF NEW.process_name = '拉布' AND NEW.task_id IS NOT NULL THEN
        UPDATE Production_Tasks
        SET completed_layers = completed_layers + NEW.layers_completed
        WHERE task_id = NEW.task_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trg_after_spreading_log_insert
AFTER INSERT ON Production_Logs
FOR EACH ROW
EXECUTE FUNCTION update_completed_layers();

-- 创建索引以提高查询性能
CREATE INDEX idx_production_tasks_style_id ON Production_Tasks(style_id);
CREATE INDEX idx_production_tasks_color ON Production_Tasks(color);
CREATE INDEX idx_fabric_rolls_style_id ON Fabric_Rolls(style_id);
CREATE INDEX idx_fabric_rolls_color ON Fabric_Rolls(color);
CREATE INDEX idx_fabric_rolls_status ON Fabric_Rolls(status);
CREATE INDEX idx_production_logs_task_id ON Production_Logs(task_id);
CREATE INDEX idx_production_logs_roll_id ON Production_Logs(roll_id);
CREATE INDEX idx_production_logs_worker_id ON Production_Logs(worker_id);
CREATE INDEX idx_production_logs_process_name ON Production_Logs(process_name);
CREATE INDEX idx_production_logs_parent_log_id ON Production_Logs(parent_log_id);
CREATE INDEX idx_production_logs_log_time ON Production_Logs(log_time);
CREATE INDEX idx_order_details_style_id ON Order_Details(style_id);
-- 为 name 和 username 列创建索引以提高查询性能
CREATE UNIQUE INDEX idx_workers_name ON Workers(name);
CREATE UNIQUE INDEX idx_workers_username ON Workers(username);

-- 插入示例数据
-- 管理员账号: admin / admin
-- 普通员工账号: zhangsan (无密码)
INSERT INTO Workers (name, username, password_hash, role) VALUES
('系统管理员', 'admin', '$2a$10$t.hV.K/yB3Y2v2C/j6g7e.eA/ZgqLw7i8a.pZGLv1/zE.iY/jG/9i', 'admin'), -- 密码是 'admin'
('张三', 'zhangsan', '', 'worker'),
('李四', 'lisi', '', 'worker'),
('王五', 'wangwu', '', 'worker')
ON CONFLICT (username) DO NOTHING;

INSERT INTO Styles (style_number) VALUES 
('BEE3TS111'), ('BEE3TS112'), ('BEE3TS113');

INSERT INTO Order_Details (style_id, color, quantity) VALUES 
(1, '韩白', 100),
(1, '黑色', 80),
(2, '韩白', 120),
(3, '红色', 60);