-- 创建款号表
CREATE TABLE Styles (
    style_id SERIAL PRIMARY KEY,
    style_number VARCHAR(50) NOT NULL UNIQUE
);

-- 创建员工表
CREATE TABLE Workers (
    worker_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    notes VARCHAR(150),
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker', 'pattern_maker')),
    worker_group VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- (新) 生产订单表
CREATE TABLE Production_Orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    style_id INT NOT NULL REFERENCES Styles(style_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- (新) 生产订单项目表 (颜色-尺码-数量)
CREATE TABLE Order_Items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES Production_Orders(order_id) ON DELETE CASCADE,
    color VARCHAR(50) NOT NULL,
    size VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    UNIQUE(order_id, color, size)
);

-- (新) 生产计划表
CREATE TABLE Production_Plans (
    plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(255) NOT NULL,
    style_id INT NOT NULL REFERENCES Styles(style_id),
    linked_order_id INT REFERENCES Production_Orders(order_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- (新) 裁剪排版表
CREATE TABLE Cutting_Layouts (
    layout_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES Production_Plans(plan_id) ON DELETE CASCADE,
    layout_name VARCHAR(255) NOT NULL,
    description TEXT
);

-- (新) 排版尺码比例表
CREATE TABLE Layout_Size_Ratios (
    ratio_id SERIAL PRIMARY KEY,
    layout_id INT NOT NULL REFERENCES Cutting_Layouts(layout_id) ON DELETE CASCADE,
    size VARCHAR(50) NOT NULL,
    ratio INT NOT NULL
);

-- (修改) 生产任务表 (现在关联到 Cutting_Layouts)
CREATE TABLE Production_Tasks (
    task_id SERIAL PRIMARY KEY,
    style_id INT NOT NULL REFERENCES Styles(style_id),
    layout_id INT REFERENCES Cutting_Layouts(layout_id), -- 新增外键
    layout_name VARCHAR(50) NOT NULL, -- marker_id 重命名而来
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

-- 创建触发器函数：更新已完成层数 (这个逻辑保持不变，依然很好用)
CREATE OR REPLACE FUNCTION update_completed_layers()
RETURNS TRIGGER AS $$
BEGIN
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

-- 创建索引
CREATE INDEX idx_production_orders_style_id ON Production_Orders(style_id);
CREATE INDEX idx_order_items_order_id ON Order_Items(order_id);
CREATE INDEX idx_production_plans_style_id ON Production_Plans(style_id);
CREATE INDEX idx_cutting_layouts_plan_id ON Cutting_Layouts(plan_id);
CREATE INDEX idx_layout_size_ratios_layout_id ON Layout_Size_Ratios(layout_id);
CREATE INDEX idx_production_tasks_style_id ON Production_Tasks(style_id);
CREATE INDEX idx_production_tasks_layout_id ON Production_Tasks(layout_id);
CREATE INDEX idx_fabric_rolls_style_id ON Fabric_Rolls(style_id);
CREATE INDEX idx_production_logs_task_id ON Production_Logs(task_id);
CREATE INDEX idx_production_logs_worker_id ON Production_Logs(worker_id);
CREATE UNIQUE INDEX idx_workers_name ON Workers(name);

-- 插入示例数据
INSERT INTO Workers (name, password_hash, role) VALUES
('admin', '$2a$12$gwwSt9.uKHrxcCffsmgc0OvsdcRa1qldHE4bR/XrKNlYMK6IRyGty', 'admin'),
('manager', '$2a$12$gwwSt9.uKHrxcCffsmgc0OvsdcRa1qldHE4bR/XrKNlYMK6IRyGty', 'manager'),
('张三', '', 'worker'),
('李四', '', 'worker'),
('王五', '', 'pattern_maker')
ON CONFLICT (name) DO NOTHING;

INSERT INTO Styles (style_number) VALUES 
('BEE3TS111'), ('BEE3TS112'), ('BEE3TS113')
ON CONFLICT (style_number) DO NOTHING;