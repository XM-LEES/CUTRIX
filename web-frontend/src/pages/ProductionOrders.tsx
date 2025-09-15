import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Table, Modal, Form, Input, message, Space, Card,
  Row, Col, InputNumber, Popconfirm, Divider, Descriptions
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useOrderStore } from '../store/orderStore';
import { useStyleStore } from '../store/styleStore';
import type { ProductionOrder, CreateProductionOrderRequest } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

// 常规尺码列表
const REGULAR_SIZES = ['90', '100', '110', '120', '130', '140', '150', '160'];

const ProductionOrders: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [form] = Form.useForm();

  const { orders, currentOrder, loading, fetchOrders, createOrder, fetchOrder, deleteOrder } = useOrderStore();
  const { styles, fetchStyles } = useStyleStore();

  useEffect(() => {
    fetchOrders(); // Initial fetch for all orders
    fetchStyles();
  }, [fetchOrders, fetchStyles]);

  const styleMap = React.useMemo(() => {
    return styles.reduce((map, style) => {
      map[style.style_id] = style.style_number;
      return map;
    }, {} as Record<number, string>);
  }, [styles]);

  const handleCreate = async (values: any) => {
    const matrixItems = (values.matrix || [])
      .flatMap((row: { color: string; sizes: Record<string, number> }) => {
        if (!row || !row.color) return [];
        return Object.entries(row.sizes || {})
          .filter(([, quantity]) => quantity && quantity > 0)
          .map(([size, quantity]) => ({ color: row.color, size, quantity }));
      });
    const specialItems = (values.special_items || []).filter(
      (item: any) => item && item.color && item.size && item.quantity > 0
    );
    const allItems = [...matrixItems, ...specialItems];
    if (allItems.length === 0) {
      message.error('请至少输入一个有效的订单明细项');
      return;
    }
    const finalValues: CreateProductionOrderRequest = {
      style_number: values.style_number,
      items: allItems,
    };
    try {
      await createOrder(finalValues);
      setIsModalOpen(false);
      form.resetFields();
      message.success('生产订单创建成功');
    } catch (error) {
      message.error((error as Error).message || '创建失败，请检查数据');
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deleteOrder(id);
      message.success('订单删除成功');
    } catch (error) {
      message.error((error as Error).message || '删除失败');
    }
  };

  const handleViewDetails = async (record: ProductionOrder) => {
    setSelectedOrder(record);
    setIsDetailModalOpen(true);
    await fetchOrder(record.order_id);
  };
  
  const handleSearch = (value: string) => {
    fetchOrders(value.trim());
  };

  const mainColumns = [
    { title: '订单号', dataIndex: 'order_number', key: 'order_number', width: 220 },
    { title: '款号', dataIndex: 'style_id', key: 'style_id', render: (styleId: number) => styleMap[styleId] || '未知款号' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action',
      render: (_: any, record: ProductionOrder) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetails(record)}>
            查看详情
          </Button>
          <Popconfirm title="确定删除此订单？" onConfirm={() => handleDelete(record.order_id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailColumns = [
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '尺码', dataIndex: 'size', key: 'size' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  ];

  const totalQuantity = currentOrder?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={2}>生产订单管理</Title></Col>
      </Row>
      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Col>
                <Search
                placeholder="按款号搜索..."
                onSearch={handleSearch}
                style={{ width: 250 }}
                allowClear
                />
            </Col>
            <Col>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                录入新订单
                </Button>
            </Col>
        </Row>
        <Table columns={mainColumns} dataSource={orders} rowKey="order_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
      
      {/* Modals remain the same... */}
      <Modal
        title="录入新生产订单"
        open={isModalOpen}
        onOk={form.submit}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={loading}
        width={1000}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical" initialValues={{ matrix: [{}] }}>
            <Form.Item name="style_number" label="款号" rules={[{ required: true, message: '请输入款号' }]}>
                <Input placeholder="输入款号 (若不存在，系统将自动新增此款号)" />
            </Form.Item>
            
            <Divider orientation="left">常规尺码批量录入</Divider>
            <Form.List name="matrix">
                {(fields, { add, remove }) => (
                <>
                    <Row gutter={8} style={{ marginBottom: 8, color: 'gray' }}>
                    <Col span={4}><Text strong>颜色</Text></Col>
                    {REGULAR_SIZES.map(size => (
                        <Col span={2} key={size} style={{ textAlign: 'center' }}><Text strong>{size}</Text></Col>
                    ))}
                    </Row>
                    {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                        <Col span={4}>
                        <Form.Item {...restField} name={[name, 'color']} rules={[{ required: true, message: '输入颜色' }]}>
                            <Input placeholder="颜色" />
                        </Form.Item>
                        </Col>
                        {REGULAR_SIZES.map(size => (
                        <Col span={2} key={size}>
                            <Form.Item {...restField} name={[name, 'sizes', size]}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        ))}
                        <Col span={2}>
                        {fields.length > 1 && (
                            <Popconfirm title="确认删除此行?" onConfirm={() => remove(name)}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        )}
                        </Col>
                    </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加颜色行</Button>
                </>
                )}
            </Form.List>

            <Divider orientation="left" style={{marginTop: 24}}>添加特殊尺码 (可选)</Divider>
            <Form.List name="special_items">
                {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item {...restField} name={[name, 'color']} rules={[{ required: true, message: '颜色' }]}><Input placeholder="颜色" /></Form.Item>
                        <Form.Item {...restField} name={[name, 'size']} rules={[{ required: true, message: '尺码' }]}><Input placeholder="特殊尺码" /></Form.Item>
                        <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '数量' }]}><InputNumber min={1} placeholder="数量" /></Form.Item>
                        <DeleteOutlined onClick={() => remove(name)} />
                    </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加特殊尺码明细</Button>
                </>
                )}
            </Form.List>
        </Form>
      </Modal>

      <Modal
        title={`订单详情: ${selectedOrder?.order_number || ''}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {loading && !currentOrder ? <Text>加载中...</Text> : (
            <>
                <Descriptions bordered column={2} style={{marginBottom: 24}}>
                    <Descriptions.Item label="订单号">{currentOrder?.order_number}</Descriptions.Item>
                    <Descriptions.Item label="款号">{styleMap[currentOrder?.style_id || 0]}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{dayjs(currentOrder?.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                    <Descriptions.Item label="总件数">{totalQuantity}</Descriptions.Item>
                </Descriptions>
                <Table 
                    columns={detailColumns}
                    dataSource={currentOrder?.items}
                    rowKey="item_id"
                    pagination={false}
                    size="small"
                />
            </>
        )}
      </Modal>
    </div>
  );
};

export default ProductionOrders;