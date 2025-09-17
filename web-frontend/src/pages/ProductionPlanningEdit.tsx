import React, { useEffect, useMemo } from 'react';
import {
  Typography, Button, Form, message, Space, Card,
  Row, Col, Select, InputNumber, Popconfirm, Table, Spin
} from 'antd';
import { PlusOutlined, DeleteOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlanStore } from '../store/planStore';
import { useStyleStore } from '../store/styleStore';
import { useOrderStore } from '../store/orderStore';

const { Title, Text } = Typography;
const { Option } = Select;

const SummaryCell = ({ planned, required }: { planned: number, required: number }) => {
  const diff = planned - required;
  let color = 'inherit';
  if (diff > 0) color = '#1677ff';
  if (diff < 0) color = '#f5222d';
  if (diff === 0 && required > 0) color = '#52c41a';
  return <Text style={{ color, fontWeight: 'bold' }}>{planned} / {required}</Text>;
};

const ProductionPlanningEdit: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const planIdNum = Number(planId);

  const { currentPlan, fetchPlan, updatePlan, loading: planLoading } = usePlanStore();
  const { styles, fetchStyles } = useStyleStore();
  const { currentOrder, fetchOrder, loading: orderLoading } = useOrderStore();
  
  const layouts = Form.useWatch('layouts', form);

  useEffect(() => {
    fetchStyles();
    if (planIdNum) {
      fetchPlan(planIdNum);
    }
  }, [planIdNum, fetchPlan, fetchStyles]);

  useEffect(() => {
    if (currentPlan && currentPlan.linked_order_id) {
      fetchOrder(currentPlan.linked_order_id);
      
      // Pre-fill form
      const initialLayouts = currentPlan.layouts?.map(layout => {
        const ratios: Record<string, any> = {};
        layout.ratios?.forEach(r => {
          ratios[r.size] = { size: r.size, ratio: r.ratio };
        });
        
        // Assuming one task per layout for simplicity in this UI
        const task = layout.tasks?.[0];

        return {
          layout_name: layout.layout_name,
          marker_length: parseFloat(layout.layout_name.split('-').pop() || '0'),
          colors: layout.tasks?.map(t => t.color) || [],
          planned_layers: task?.planned_layers,
          ratios: ratios,
        };
      });
      form.setFieldsValue({ layouts: initialLayouts });
    }
  }, [currentPlan, fetchOrder, form]);

  const styleMap = useMemo(() => styles.reduce((map, style) => ({ ...map, [style.style_id]: style.style_number }), {} as Record<number, string>), [styles]);
  
  const { orderDemand, orderColors, orderSizes } = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return { orderDemand: {}, orderColors: [], orderSizes: [] };
    const demand: Record<string, Record<string, number>> = {};
    const colors = new Set<string>();
    const sizes = new Set<string>();
    currentOrder.items.forEach(item => {
      if (!demand[item.color]) demand[item.color] = {};
      demand[item.color][item.size] = item.quantity;
      colors.add(item.color);
      sizes.add(item.size);
    });
    return { 
      orderDemand: demand, 
      orderColors: Array.from(colors), 
      orderSizes: Array.from(sizes).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)) 
    };
  }, [currentOrder]);
  
  const plannedSupply = useMemo(() => {
    const supply: Record<string, Record<string, number>> = {};
    (layouts || []).forEach((layout: any) => {
      if (!layout || !layout.colors || layout.colors.length === 0 || !layout.planned_layers || !layout.ratios) return;
      const { colors, planned_layers } = layout;
      colors.forEach((color: string) => {
        if (!supply[color]) supply[color] = {};
        Object.values(layout.ratios || {}).forEach((ratioInfo: any) => {
          if (ratioInfo && ratioInfo.size && ratioInfo.ratio > 0) {
             supply[color][ratioInfo.size] = (supply[color][ratioInfo.size] || 0) + (planned_layers * ratioInfo.ratio);
          }
        });
      });
    });
    return supply;
  }, [layouts]);

  const handleUpdatePlan = async (values: any) => {
    if (!currentOrder) return;
    const styleNumber = styleMap[currentOrder.style_id] || '';
    try {
      const finalValues = {
        plan_name: `${currentOrder.order_number} 的生产计划`,
        style_id: currentOrder.style_id,
        linked_order_id: currentOrder.order_id,
        layouts: values.layouts.map((layout: any) => ({
          layout_name: `${styleNumber}-${layout.marker_length}cm`,
          description: '',
          ratios: Object.values(layout.ratios || {}).filter((r: any) => r && r.ratio > 0),
          tasks: layout.colors.map((color: string) => ({
            color: color,
            planned_layers: layout.planned_layers
          }))
        })),
      };
      await updatePlan(planIdNum, finalValues);
      message.success('生产计划更新成功');
      navigate('/planning');
    } catch (error) {
      message.error((error as Error).message || '更新失败');
    }
  };

  const summaryColumns = [
    { title: '颜色', dataIndex: 'color', key: 'color', width: 120, fixed: 'left' as const },
    ...orderSizes.map(size => ({
      title: size,
      dataIndex: size,
      key: size,
      width: 100,
      render: (_: any, record: { color: string }) => (
        <SummaryCell 
          planned={plannedSupply[record.color]?.[size] || 0}
          required={orderDemand[record.color]?.[size] || 0}
        />
      ),
    })),
  ];
  
  if (orderLoading && !currentOrder) {
      return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><Spin size="large" /></div>;
  }

  return (
    <Form form={form} onFinish={handleUpdatePlan} layout="vertical">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
        <Row align="middle" style={{ marginBottom: 16, flexShrink: 0 }}>
          <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/planning')} style={{ marginRight: 8 }}>
            返回计划列表
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            修改生产计划
          </Title>
        </Row>
        <div style={{ flexShrink: 0 }}>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}><Card title="订单需求概览 (目标)"><Table columns={summaryColumns} dataSource={orderColors.map(color => ({ key: color, color }))} pagination={false} size="small" bordered scroll={{ x: 'max-content' }}/></Card></Col>
            <Col xs={24} lg={12}><Card title="生产计划汇总 (当前)"><Table columns={summaryColumns} dataSource={orderColors.map(color => ({ key: color, color }))} pagination={false} size="small" bordered scroll={{ x: 'max-content' }}/></Card></Col>
          </Row>
          <Card style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Space>
                        <Text strong>关联订单:</Text>
                        <Text>{currentOrder?.order_number}</Text>
                        <Text type="secondary">(款号: {styleMap[currentOrder?.style_id || 0]})</Text>
                    </Space>
                </Col>
                <Col>
                    <Button type="primary" htmlType="submit" loading={planLoading} size="large">
                        保存修改
                    </Button>
                </Col>
            </Row>
          </Card>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px 0' }}>
          <Card title="设计排版方案">
              <Form.List name="layouts">
                  {(fields, { add, remove }) => (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                      {fields.map(({ key, name, ...restField }, index) => (
                          <Card key={key} type="inner" title={`排版方案 #${index + 1}`} extra={<Popconfirm title="确认删除?" onConfirm={() => remove(name)}><Button type="link" danger icon={<DeleteOutlined/>}>删除</Button></Popconfirm>}>
                              <Form.Item {...restField} name={[name, 'marker_length']} label="版长 (cm)" rules={[{ required: true, message: '请输入版长' }]}>
                                  <InputNumber min={0} step={0.1} placeholder="例如: 1.85" style={{width: '100%'}}/>
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'colors']} label="颜色 (可多选)" rules={[{ required: true, message: '请至少选择一个颜色' }]}>
                                  <Select mode="multiple" placeholder="选择此方案应用的颜色">{orderColors.map(c => <Option key={c} value={c}>{c}</Option>)}</Select>
                              </Form.Item>
                              <Form.Item label="尺码比例">
                                  <Row gutter={[16, 16]}>
                                  {orderSizes.map(size => (
                                      <Col xs={8} sm={6} md={4} key={size}>
                                      <Form.Item {...restField} name={[name, 'ratios', size, 'size']} initialValue={size} hidden/>
                                      <Form.Item label={size} {...restField} name={[name, 'ratios', size, 'ratio']} initialValue={0}>
                                          <InputNumber min={0} placeholder="比例" style={{width: '100%'}}/>
                                      </Form.Item>
                                      </Col>
                                  ))}
                                  </Row>
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'planned_layers']} label="拉布层数" rules={[{ required: true, message: '请输入拉布层数' }]}>
                                <InputNumber min={1} placeholder="输入计划生产的份数" style={{width: '100%'}}/>
                              </Form.Item>
                          </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 16, padding: '20px 0', height: 'auto', borderStyle: 'dashed' }}>
                          添加新的排版方案
                      </Button>
                  </div>
                  )}
              </Form.List>
          </Card>
        </div>
      </div>
    </Form>
  );
};

export default ProductionPlanningEdit;