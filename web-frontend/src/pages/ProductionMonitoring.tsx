import React, { useEffect, useMemo } from 'react';
import {
  Typography, Table, Card, Row, Col, Progress, Tag, Button, Space
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined } from '@ant-design/icons';
import { usePlanStore } from '../store/planStore';
import { useStyleStore } from '../store/styleStore';
import { useOrderStore } from '../store/orderStore';
import type { ProductionPlan } from '../types'; // <-- 修正点：移除了未使用的 ProductionTask
import dayjs from 'dayjs';

const { Title } = Typography;

const ProductionMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const { plans, loading: plansLoading, fetchPlans } = usePlanStore();
  const { styles, loading: stylesLoading, fetchStyles } = useStyleStore();
  const { orders, loading: ordersLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchPlans();
    fetchStyles();
    fetchOrders();
  }, [fetchPlans, fetchStyles, fetchOrders]);

  const styleMap = useMemo(() => styles.reduce((map, style) => ({ ...map, [style.style_id]: style.style_number }), {} as Record<number, string>), [styles]);
  const orderMap = useMemo(() => orders.reduce((map, order) => ({ ...map, [order.order_id]: order }), {} as Record<number, any>), [orders]);

  // 计算总体进度
  const plansWithProgress = useMemo(() => {
    return plans.map(plan => {
      const allTasks = plan.layouts?.flatMap(l => l.tasks || []) || [];
      const totalPlanned = allTasks.reduce((sum, task) => sum + task.planned_layers, 0);
      const totalCompleted = allTasks.reduce((sum, task) => sum + task.completed_layers, 0);
      const progress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
      return { ...plan, overall_progress: progress };
    });
  }, [plans]);

  const mainColumns = [
    { title: '计划名称', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '款号', dataIndex: 'style_id', key: 'style_id', render: (id: number) => styleMap[id] || 'N/A' },
    { title: '关联订单', dataIndex: 'linked_order_id', key: 'linked_order_id', render: (id?: number) => id && orderMap[id] ? orderMap[id].order_number : <Tag>无</Tag> },
    {
      title: '总体进度',
      dataIndex: 'overall_progress',
      key: 'overall_progress',
      render: (progress: number) => <Progress percent={progress} />
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProductionPlan) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡到 onRow
              navigate(`/monitoring/${record.plan_id}`);
            }}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={2}>生产进度监控</Title></Col>
      </Row>

      <Card>
        <Table
          columns={mainColumns}
          dataSource={plansWithProgress}
          rowKey="plan_id"
          loading={plansLoading || stylesLoading || ordersLoading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => {
            return {
              onClick: () => navigate(`/monitoring/${record.plan_id}`),
              style: { cursor: 'pointer' }
            };
          }}
        />
      </Card>
    </div>
  );
};

export default ProductionMonitoring;