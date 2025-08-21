import React, { useEffect, useState } from 'react';
import {
  Typography, Table, Card, Row, Col, Collapse, Progress, Descriptions, Tag, Empty, Spin
} from 'antd';
import { usePlanStore } from '../store/planStore';
import { useStyleStore } from '../store/styleStore';
import { useOrderStore } from '../store/orderStore';
// highlight-start
import type { ProductionPlan, ProductionOrder, CuttingLayout, ProductionTask, OrderItem } from '../types';
// highlight-end
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// 辅助函数：计算产出
const calculateOutput = (tasks: ProductionTask[] = [], ratios: any[] = []) => {
    const output: Record<string, number> = {};
    const ratioMap = ratios.reduce((acc, r) => ({ ...acc, [r.size]: r.ratio }), {});

    tasks.forEach(task => {
        if (task.completed_layers > 0) {
            Object.keys(ratioMap).forEach(size => {
                if (!output[size]) output[size] = 0;
                output[size] += task.completed_layers * ratioMap[size];
            });
        }
    });
    return output;
};

// 辅助函数：获取订单需求
const getOrderDemand = (orderItems: OrderItem[] = []) => {
    const demand: Record<string, number> = {};
    orderItems.forEach(item => {
        if (!demand[item.size]) demand[item.size] = 0;
        demand[item.size] += item.quantity;
    });
    return demand;
}

const ProductionMonitoring: React.FC = () => {
  const { plans, loading: plansLoading, fetchPlans } = usePlanStore();
  const { styles, loading: stylesLoading, fetchStyles } = useStyleStore();
  const { orders, loading: ordersLoading, fetchOrders } = useOrderStore();
  
  const [detailedPlans, setDetailedPlans] = useState<Record<number, ProductionPlan>>({});
  const [expandingLoading, setExpandingLoading] = useState<number | null>(null);
  const planStore = usePlanStore();


  useEffect(() => {
    fetchPlans();
    fetchStyles();
    fetchOrders();
  }, [fetchPlans, fetchStyles, fetchOrders]);

  const styleMap = React.useMemo(() => styles.reduce((map, style) => ({ ...map, [style.style_id]: style.style_number }), {} as Record<number, string>), [styles]);
  const orderMap = React.useMemo(() => orders.reduce((map, order) => ({ ...map, [order.order_id]: order }), {} as Record<number, ProductionOrder>), [orders]);


  const handleExpand = async (planId: number) => {
    if (!planId || detailedPlans[planId]) return;

    setExpandingLoading(planId);
    await planStore.fetchPlan(planId);
    const detailedPlan = planStore.currentPlan;
    if (detailedPlan) {
        setDetailedPlans(prev => ({...prev, [planId]: detailedPlan}))
    }
    setExpandingLoading(null);
  };

  const expandedRowRender = (plan: ProductionPlan) => {
    const detailedPlan = detailedPlans[plan.plan_id];
    
    if (expandingLoading === plan.plan_id) {
        return <div style={{textAlign: 'center', padding: 20}}><Spin /></div>;
    }

    if (!detailedPlan || !detailedPlan.layouts) {
      return <Empty description="无法加载计划详情" />;
    }

    const linkedOrder = detailedPlan.linked_order_id ? orderMap[detailedPlan.linked_order_id] : null;
    const demand = getOrderDemand(linkedOrder?.items);

    return (
      <Collapse accordion>
        {detailedPlan.layouts.map(layout => {
            const output = calculateOutput(layout.tasks, layout.ratios);

            return (
                <Panel header={<Title level={5}>{layout.layout_name}</Title>} key={layout.layout_id}>
                    <Row gutter={32}>
                        <Col span={12}>
                            <Title level={5}>任务进度</Title>
                            <Table
                                size="small"
                                rowKey="task_id"
                                dataSource={layout.tasks}
                                pagination={false}
                                columns={[
                                    { title: '颜色', dataIndex: 'color', key: 'color' },
                                    { title: '计划份数', dataIndex: 'planned_layers', key: 'planned_layers' },
                                    { title: '完成份数', dataIndex: 'completed_layers', key: 'completed_layers' },
                                    {
                                        title: '进度', dataIndex: 'progress', key: 'progress',
                                        render: (_, record) => (
                                            <Progress
                                                percent={record.planned_layers > 0 ? Math.round((record.completed_layers / record.planned_layers) * 100) : 0}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        </Col>
                        <Col span={12}>
                             <Title level={5}>产出估算 vs. 订单需求</Title>
                             <Descriptions bordered size="small" column={1}>
                                {Object.keys(demand).length > 0 ? (
                                    Object.keys(demand).map(size => (
                                        <Descriptions.Item key={size} label={`${size}码`}>
                                            <Text strong>{output[size] || 0}</Text> / {demand[size]}
                                        </Descriptions.Item>
                                    ))
                                ) : (
                                     Object.keys(output).map(size => (
                                        <Descriptions.Item key={size} label={`${size}码`}>
                                            <Text strong>{output[size] || 0}</Text>
                                        </Descriptions.Item>
                                    ))
                                )}
                             </Descriptions>
                        </Col>
                    </Row>
                </Panel>
            );
        })}
      </Collapse>
    );
  };


  const mainColumns = [
    { title: '计划名称', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '款号', dataIndex: 'style_id', key: 'style_id', render: (id: number) => styleMap[id] || 'N/A' },
    { title: '关联订单', dataIndex: 'linked_order_id', key: 'linked_order_id', render: (id?: number) => id && orderMap[id] ? orderMap[id].order_number : <Tag>无</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={2}>生产进度监控</Title></Col>
      </Row>

      <Card>
        <Table
          columns={mainColumns}
          dataSource={plans}
          rowKey="plan_id"
          loading={plansLoading || stylesLoading || ordersLoading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender,
            onExpand: (expanded, record) => {
              if (expanded) {
                handleExpand(record.plan_id);
              }
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ProductionMonitoring;