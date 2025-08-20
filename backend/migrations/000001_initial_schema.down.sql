-- 删除索引
DROP INDEX IF EXISTS idx_production_tasks_style_id;
DROP INDEX IF EXISTS idx_production_tasks_color;
DROP INDEX IF EXISTS idx_fabric_rolls_style_id;
DROP INDEX IF EXISTS idx_fabric_rolls_color;
DROP INDEX IF EXISTS idx_fabric_rolls_status;
DROP INDEX IF EXISTS idx_production_logs_task_id;
DROP INDEX IF EXISTS idx_production_logs_roll_id;
DROP INDEX IF EXISTS idx_production_logs_worker_id;
DROP INDEX IF EXISTS idx_production_logs_process_name;
DROP INDEX IF EXISTS idx_production_logs_parent_log_id;
DROP INDEX IF EXISTS idx_production_logs_log_time;
DROP INDEX IF EXISTS idx_order_details_style_id;

-- 删除触发器
DROP TRIGGER IF EXISTS trg_after_spreading_log_insert ON Production_Logs;
DROP FUNCTION IF EXISTS update_completed_layers();

-- 删除表 (按正确的依赖顺序)
DROP TABLE IF EXISTS Production_Logs;
DROP TABLE IF EXISTS Fabric_Rolls;
DROP TABLE IF EXISTS Production_Tasks;
DROP TABLE IF EXISTS Order_Details;
DROP TABLE IF EXISTS Workers;
DROP TABLE IF EXISTS Styles;