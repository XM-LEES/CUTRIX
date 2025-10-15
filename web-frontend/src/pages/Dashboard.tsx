import React, { useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Spin } from 'antd';
import {
  TagsOutlined,
  UnorderedListOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useStyleStore } from '../store/styleStore';
import { usePlanStore } from '../store/planStore';
import { useWorkerStore } from '../store/workerStore';
import type { ProductionTask } from '../types';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { styles, fetchStyles, loading: stylesLoading } = useStyleStore();
  const { plans, fetchPlans, loading: plansLoading } = usePlanStore();
  const { workers, fetchWorkers, loading: workersLoading } = useWorkerStore();

  useEffect(() => {
    fetchStyles();
    fetchPlans();
    fetchWorkers();
  }, [fetchStyles, fetchPlans, fetchWorkers]);

  // 在处理 plans 数组前，先判断它是否为数组
  const pendingTasks = Array.isArray(plans)
    ? plans
        .flatMap(plan => plan.layouts ?? [])
        .flatMap(layout => layout.tasks ?? [])
        .filter((task: ProductionTask) => task.planned_layers > task.completed_layers)
        .length
    : 0; 

  const isLoading = stylesLoading || plansLoading || workersLoading;

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