import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Space,
  Card,
  Row,
  Col,
  Select,
  InputNumber,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useOrderStore } from '../store/orderStore';
import { useStyleStore } from '../store/styleStore';
import type { ProductionOrder, Style } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ProductionOrders: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 从 Zustand store 获取数据和方法
  const { orders, loading, fetchOrders, createOrder } = useOrderStore();
  const { styles, fetchStyles } = useStyleStore();

  // 组件加载时获取订单和款号数据
  useEffect(() => {
    fetchOrders();
    fetchStyles();
  }, [fetchOrders, fetchStyles]);

  // 将款号数组转换为 map，方便快速查找款号名称
  const styleMap = React.useMemo(() => {
    return styles.reduce((map, style) => {
      map[style.style_id] = style.style_number;
      return map;
    }, {} as Record<number, string>);
  }, [styles]);


  const handleCreate = async (values: any) => {
    try {
      // 确保 items 存在且不为空
      if (!values.items || values.items.length === 0) {
        message.error('请至少添加一个订单明细项');
        return;
      }
      await createOrder(values);
      setIsModalOpen(false);
      form.resetFields();
      message.success('生产订单创建成功');
    } catch (error) {
      message.error((error as Error).message || '创建失败，请检查订单号是否重复');
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
    },
    {
      title: '款号',
      dataIndex: 'style_id',
      key: 'style_id',
      render: (styleId: number) => styleMap[styleId] || '未知款号',
    },
    {
        title: '明细项数量',
        dataIndex: 'items',
        key: 'items_count',
        render: (items: any[]) => items?.length || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, _record: ProductionOrder) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} size="small">
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>生产订单管理</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            录入新订单
          </Button>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="order_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="录入新生产订单"
        open={isModalOpen}
        onOk={form.submit}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={800}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order_number"
                label="订单号"
                rules={[{ required: true, message: '请输入订单号' }]}
              >
                <Input placeholder="例如: PO-20250821-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="style_id"
                label="款号"
                rules={[{ required: true, message: '请选择款号' }]}
              >
                <Select placeholder="请选择款号">
                  {styles.map((style: Style) => (
                    <Option key={style.style_id} value={style.style_id}>
                      {style.style_number}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>订单明细</Title>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <Card>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
                      <Col span={7}>
                        <Form.Item {...restField} name={[name, 'color']} rules={[{ required: true, message: '请输入颜色' }]}>
                          <Input placeholder="颜色" />
                        </Form.Item>
                      </Col>
                      <Col span={7}>
                        <Form.Item {...restField} name={[name, 'size']} rules={[{ required: true, message: '请输入尺码' }]}>
                          <Input placeholder="尺码" />
                        </Form.Item>
                      </Col>
                      <Col span={7}>
                        <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '请输入数量' }]}>
                          <InputNumber placeholder="数量" min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Popconfirm title="确认删除?" onConfirm={() => remove(name)}>
                          <Button type="primary" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Col>
                    </Row>
                  ))}
                </Card>
                <Form.Item style={{marginTop: "10px"}}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加明细项
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionOrders;