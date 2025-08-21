import React, { useEffect } from 'react';
import { Typography, Table, Progress, message, Card } from 'antd';
import { useTaskStore } from '../store';
import type { ProductionTask } from '../types';

const { Title } = Typography;

const Tasks: React.FC = () => {
  const { tasks, loading, error, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (error) {
    message.error(error);
  }

  const columns = [
    { title: '任务ID', dataIndex: 'task_id', key: 'task_id' },
    { title: '排版名称', dataIndex: 'layout_name', key: 'layout_name' },
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '计划份数', dataIndex: 'planned_layers', key: 'planned_layers' },
    { title: '完成份数', dataIndex: 'completed_layers', key: 'completed_layers' },
    {
      title: '进度', key: 'progress',
      render: (record: ProductionTask) => {
        const progress = record.planned_layers > 0
          ? Math.round((record.completed_layers / record.planned_layers) * 100)
          : 0;
        return <Progress percent={progress} />;
      }
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 16 }}>所有生产任务 (只读)</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="task_id"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default Tasks;