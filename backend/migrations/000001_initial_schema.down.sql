-- 删除索引
DROP INDEX IF EXISTS idx_production_orders_style_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_production_plans_style_id;
DROP INDEX IF EXISTS idx_cutting_layouts_plan_id;
DROP INDEX IF EXISTS idx_layout_size_ratios_layout_id;
DROP INDEX IF EXISTS idx_production_tasks_style_id;
DROP INDEX IF EXISTS idx_production_tasks_layout_id;
DROP INDEX IF EXISTS idx_fabric_rolls_style_id;
DROP INDEX IF EXISTS idx_production_logs_task_id;
DROP INDEX IF EXISTS idx_production_logs_worker_id;

-- 删除触发器
DROP TRIGGER IF EXISTS trg_after_spreading_log_insert ON Production_Logs;
DROP FUNCTION IF EXISTS update_completed_layers();

-- 删除表 (按正确的依赖顺序)
DROP TABLE IF EXISTS Production_Logs;
DROP TABLE IF EXISTS Fabric_Rolls;
DROP TABLE IF EXISTS Production_Tasks;
DROP TABLE IF EXISTS Layout_Size_Ratios;
DROP TABLE IF EXISTS Cutting_Layouts;
DROP TABLE IF EXISTS Production_Plans;
DROP TABLE IF EXISTS Order_Items;
DROP TABLE IF EXISTS Production_Orders;
DROP TABLE IF EXISTS Workers;
DROP TABLE IF EXISTS Styles;