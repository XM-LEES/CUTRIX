import React, { useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Spin } from 'antd';
import {
  TagsOutlined,
  UnorderedListOutlined,
  BlockOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useStyleStore } from '../store/styleStore';
import { usePlanStore } from '../store/planStore'; // 替换：使用 planStore
import { useWorkerStore } from '../store/workerStore';
import type { ProductionTask } from '../types'; // 新增：为 task 参数提供类型

const { Title } = Typography;

const Dashboard: React.FC = () => {
  // 从各自的 store 中获取数据和加载状态
  const { styles, fetchStyles, loading: stylesLoading } = useStyleStore();
  const { plans, fetchPlans, loading: plansLoading } = usePlanStore(); // 替换：使用 planStore
  const { workers, fetchWorkers, loading: workersLoading } = useWorkerStore();

  // 组件加载时，触发所有数据获取函数
  useEffect(() => {
    fetchStyles();
    fetchPlans(); // 替换：获取 plans
    fetchWorkers();
  }, [fetchStyles, fetchPlans, fetchWorkers]);

  // 修改：从所有计划的所有任务中计算待完成任务数
  const pendingTasks = plans
    .flatMap(plan => plan.layouts ?? [])
    .flatMap(layout => layout.tasks ?? [])
    .filter((task: ProductionTask) => task.planned_layers > task.completed_layers)
    .length;

  // 统一的加载状态
  const isLoading = stylesLoading || plansLoading || workersLoading; // 替换：使用 plansLoading

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>仪表板</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="款号总数"
              value={styles.length}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="待完成任务"
              value={pendingTasks}
              prefix={<UnorderedListOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="布匹库存 (开发中)"
              value={0}
              prefix={<BlockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="在职员工总数"
              value={workers.filter(w => w.is_active).length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;