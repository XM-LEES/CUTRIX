import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography, Button, Table, message, Space, Card,
  Row, Col, Popconfirm, Tag, Input, Modal, Descriptions, Collapse
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';
import { useStyleStore } from '../store/styleStore';
import { useOrderStore } from '../store/orderStore';
import type { ProductionPlan } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Panel } = Collapse;


const ProductionPlanning: React.FC = () => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const navigate = useNavigate();
  const { plans, currentPlan, loading, fetchPlans, fetchPlan, deletePlan } = usePlanStore();
  const { styles, fetchStyles } = useStyleStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchPlans();
    fetchStyles();
    fetchOrders();
  }, [fetchPlans, fetchStyles, fetchOrders]);
  
  const styleMap = useMemo(() => styles.reduce((map, style) => ({ ...map, [style.style_id]: style.style_number }), {} as Record<number, string>), [styles]);
  const orderMap = useMemo(() => orders.reduce((map, order) => ({ ...map, [order.order_id]: order.order_number }), {} as Record<number, string>), [orders]);

  const handleDelete = async (id: number) => {
    try {
      await deletePlan(id);
      message.success('生产计划删除成功');
    } catch (error) {
      message.error((error as Error).message || '删除失败');
    }
  };

  const handleViewDetails = async (planId: number) => {
    await fetchPlan(planId);
    setIsDetailModalOpen(true);
  };

  const mainColumns = [
    { title: '计划名称', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '款号', dataIndex: 'style_id', key: 'style_id', render: (id: number) => styleMap[id] || 'N/A' },
    { title: '关联订单', dataIndex: 'linked_order_id', key: 'linked_order_id', render: (id?: number) => id ? <Tag color="blue">{orderMap[id]}</Tag> : <Tag>无关联</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 280,
      render: (_: any, record: ProductionPlan) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetails(record.plan_id)}>
            查看详情
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => message.info('修改功能待开发')}>
            修改
          </Button>
          <Button icon={<EyeOutlined />} size="small" type="primary" onClick={() => navigate(`/monitoring?plan_id=${record.plan_id}`)}>
            查看进度
          </Button>
          <Popconfirm title="确定删除此计划？" onConfirm={() => handleDelete(record.plan_id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 16 }}>生产计划管理</Title>
      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Search
              placeholder="按计划名称或订单号搜索..."
              onSearch={() => message.info('搜索功能待开发')}
              style={{ width: 250 }}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/planning/new')}>
              制定新计划
            </Button>
          </Col>
        </Row>
        <Table
          columns={mainColumns}
          dataSource={plans}
          rowKey="plan_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`计划详情: ${currentPlan?.plan_name || ''}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {loading || !currentPlan ? <Text>加载中...</Text> : (
            <Collapse accordion>
              {(currentPlan.layouts || []).map((layout) => (
                <Panel header={layout.layout_name} key={layout.layout_id}>
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="尺码配比">
                      {layout.ratios?.map(r => `${r.size}(${r.ratio})`).join(' | ')}
                    </Descriptions.Item>
                    <Descriptions.Item label="生产任务">
                      <ul style={{paddingLeft: 0, listStyle: 'none'}}>
                        {layout.tasks?.map(t => (
                          <li key={t.task_id}>{t.color}: <Text strong>{t.planned_layers}</Text> 层</li>
                        ))}
                      </ul>
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>
              ))}
            </Collapse>
        )}
      </Modal>

    </div>
  );
};

export default ProductionPlanning;