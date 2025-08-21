import React, { useEffect, useState } from 'react';
import {
  Typography, Button, Table, Modal, Form, Input, message, Space, Card,
  Row, Col, Select, InputNumber, Popconfirm, Collapse, Tag
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { usePlanStore } from '../store/planStore';
import { useStyleStore } from '../store/styleStore';
import { useOrderStore } from '../store/orderStore';
import type { ProductionPlan, Style, ProductionOrder, CuttingLayout, LayoutSizeRatio, ProductionTask } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const ProductionPlanning: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 从 Zustand stores 获取数据
  const { plans, loading, fetchPlans, createPlan } = usePlanStore();
  const { styles, fetchStyles } = useStyleStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchPlans();
    fetchStyles();
    fetchOrders();
  }, [fetchPlans, fetchStyles, fetchOrders]);
  
  // 数据转换，方便查找
  const styleMap = React.useMemo(() => styles.reduce((map, style) => ({ ...map, [style.style_id]: style.style_number }), {} as Record<number, string>), [styles]);
  const orderMap = React.useMemo(() => orders.reduce((map, order) => ({ ...map, [order.order_id]: order.order_number }), {} as Record<number, string>), [orders]);

  const handleCreate = async (values: any) => {
    try {
      // 数据验证
      if (!values.layouts || values.layouts.length === 0) {
        message.error('请至少添加一个裁剪排版方案');
        return;
      }
      await createPlan(values);
      setIsModalOpen(false);
      form.resetFields();
      message.success('生产计划创建成功');
    } catch (error) {
      message.error((error as Error).message || '创建失败，请检查数据是否完整');
    }
  };

  const mainColumns = [
    { title: '计划名称', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '款号', dataIndex: 'style_id', key: 'style_id', render: (id: number) => styleMap[id] || 'N/A' },
    { title: '关联订单', dataIndex: 'linked_order_id', key: 'linked_order_id', render: (id?: number) => id ? orderMap[id] : <Tag>无</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action',
      render: (_: any, record: ProductionPlan) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} size="small">查看详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={2}>生产计划制定</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            制定新计划
          </Button>
        </Col>
      </Row>

      <Card>
        <Table columns={mainColumns} dataSource={plans} rowKey="plan_id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="制定新生产计划"
        open={isModalOpen}
        onOk={form.submit}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={loading}
        width={1000}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical" initialValues={{ layouts: [{}] }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="plan_name" label="计划名称" rules={[{ required: true }]}>
                <Input placeholder="例如: 8月第一周大货计划" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="style_id" label="款号" rules={[{ required: true }]}>
                <Select placeholder="选择款号">
                  {styles.map((s: Style) => <Option key={s.style_id} value={s.style_id}>{s.style_number}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="linked_order_id" label="关联生产订单 (可选)">
                <Select placeholder="选择关联订单" allowClear>
                  {orders.map((o: ProductionOrder) => <Option key={o.order_id} value={o.order_id}>{o.order_number}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>裁剪排版方案</Title>
          <Form.List name="layouts">
            {(layoutFields, { add: addLayout, remove: removeLayout }) => (
              <Collapse accordion>
                {layoutFields.map(({ key: layoutKey, name: layoutName, ...restLayoutField }, layoutIndex) => (
                  <Panel 
                    header={`排版方案 #${layoutIndex + 1}`} 
                    key={layoutKey}
                    extra={
                      <Popconfirm title="确认删除此方案?" onConfirm={() => removeLayout(layoutName)}>
                          <DeleteOutlined onClick={e => e.stopPropagation()} style={{color: 'red'}} />
                      </Popconfirm>
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item {...restLayoutField} name={[layoutName, 'layout_name']} label="排版名称/描述" rules={[{ required: true }]}>
                          <Input placeholder="例如: 110-150码长版" />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    {/* 尺码比例 */}
                    <Text>尺码比例</Text>
                    <Form.List name={[layoutName, 'ratios']}>
                      {(ratioFields, { add: addRatio, remove: removeRatio }) => (
                          <>
                          {ratioFields.map(({key: ratioKey, name: ratioName, ...restRatioField}) => (
                              <Space key={ratioKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                  <Form.Item {...restRatioField} name={[ratioName, 'size']} rules={[{ required: true, message: '尺码'}]}>
                                      <Input placeholder="尺码" />
                                  </Form.Item>
                                  <Form.Item {...restRatioField} name={[ratioName, 'ratio']} rules={[{ required: true, message: '比例'}]}>
                                      <InputNumber min={1} placeholder="比例" />
                                  </Form.Item>
                                  <DeleteOutlined onClick={() => removeRatio(ratioName)} />
                              </Space>
                          ))}
                          <Button type="dashed" onClick={() => addRatio()} block icon={<PlusOutlined />}>添加尺码比例</Button>
                          </>
                      )}
                    </Form.List>

                    {/* 裁剪任务 */}
                    <Text style={{marginTop: 16, display: 'block'}}>裁剪任务 (按颜色)</Text>
                     <Form.List name={[layoutName, 'tasks']}>
                      {(taskFields, { add: addTask, remove: removeTask }) => (
                           <>
                          {taskFields.map(({key: taskKey, name: taskName, ...restTaskField}) => (
                              <Space key={taskKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                  <Form.Item {...restTaskField} name={[taskName, 'color']} rules={[{ required: true, message: '颜色'}]}>
                                      <Input placeholder="颜色" />
                                  </Form.Item>
                                  <Form.Item {...restTaskField} name={[taskName, 'planned_layers']} rules={[{ required: true, message: '份数'}]}>
                                      <InputNumber min={1} placeholder="裁剪份数" />
                                  </Form.Item>
                                  <DeleteOutlined onClick={() => removeTask(taskName)} />
                              </Space>
                          ))}
                           <Button type="dashed" onClick={() => addTask()} block icon={<PlusOutlined />}>添加颜色任务</Button>
                           </>
                      )}
                    </Form.List>

                  </Panel>
                ))}
                <Button type="primary" onClick={() => addLayout()} block icon={<PlusOutlined />} style={{marginTop: 16}}>
                    添加新的排版方案
                </Button>
              </Collapse>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionPlanning;