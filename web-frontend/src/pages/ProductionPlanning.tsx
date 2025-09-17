import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography, Button, Table, message, Space, Card,
  Row, Col, Popconfirm, Tag, Input, Modal, Descriptions
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';
import { useStyleStore } from '../store/styleStore';
import { useOrderStore } from '../store/orderStore';
import type { ProductionPlan, ProductionTask } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

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
  
  const handleSearch = (value: string) => {
    fetchPlans(value.trim());
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
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/planning/edit/${record.plan_id}`)}>
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
  
  const layoutDetailColumns = [
      { title: '排版名称', dataIndex: 'layout_name', key: 'layout_name'},
      { title: '尺码配比', dataIndex: 'ratios', key: 'ratios', render: (ratios: any[]) => ratios?.map(r => `${r.size}(${r.ratio})`).join(' | ') },
      { title: '颜色', dataIndex: 'tasks', key: 'color', render: (tasks: ProductionTask[]) => tasks?.map(t => t.color).join(', ') },
      { title: '拉布层数', dataIndex: 'tasks', key: 'layers', render: (tasks: ProductionTask[]) => tasks?.[0]?.planned_layers },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 16 }}>生产计划管理</Title>
      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Search
              placeholder="按计划名称或订单号搜索..."
              onSearch={handleSearch}
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
        width={900}
      >
        {loading || !currentPlan ? <Text>加载中...</Text> : (
            <Space direction="vertical" style={{width: '100%'}}>
                <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="计划名称">{currentPlan.plan_name}</Descriptions.Item>
                    <Descriptions.Item label="关联订单">{orderMap[currentPlan.linked_order_id || 0] || '无'}</Descriptions.Item>
                    <Descriptions.Item label="款号">{styleMap[currentPlan.style_id]}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{dayjs(currentPlan.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                </Descriptions>
                <Title level={5} style={{marginTop: 16}}>排版方案列表</Title>
                <Table
                    columns={layoutDetailColumns}
                    dataSource={currentPlan.layouts}
                    rowKey="layout_id"
                    pagination={false}
                    size="small"
                    bordered
                />
            </Space>
        )}
      </Modal>

    </div>
  );
};

export default ProductionPlanning;