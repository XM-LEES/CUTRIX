import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Descriptions, Card, Collapse, Table, Progress, Button, Modal, Typography, Row, Col, Space, message // <-- 修正点：在此处添加 message
} from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { usePlanStore } from '../store/planStore';
import { useOrderStore } from '../store/orderStore';
import { useStyleStore } from '../store/styleStore';
import type { ProductionLog, ProductionTask, OrderItem, LayoutSizeRatio } from '../types';
import dayjs from 'dayjs';
// 假设你已经在 services/index.ts 中添加了获取日志的服务
// import { logService } from '../services';

const { Panel } = Collapse;
const { Title, Text } = Typography;

// 辅助函数：计算产出
const calculateOutput = (tasks: ProductionTask[] = [], ratios: LayoutSizeRatio[] = []) => {
    const output: Record<string, number> = {};
    const ratioMap = ratios.reduce((acc, r) => ({ ...acc, [r.size]: r.ratio }), {} as Record<string, number>);

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


const ProductionPlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);
  const [taskLogs, setTaskLogs] = useState<ProductionLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const { currentPlan, fetchPlan, loading: planLoading } = usePlanStore();
  const { currentOrder, fetchOrder, loading: orderLoading } = useOrderStore();
  const { styles, fetchStyles } = useStyleStore();

  const styleMap = useMemo(() => styles.reduce((map, style) => ({ ...map, [style.style_id]: style.style_number }), {} as Record<number, string>), [styles]);

  useEffect(() => {
    fetchStyles();
    if (planId) {
      fetchPlan(Number(planId));
    }
  }, [planId, fetchPlan, fetchStyles]);

  useEffect(() => {
    if (currentPlan?.linked_order_id) {
      fetchOrder(currentPlan.linked_order_id);
    }
  }, [currentPlan, fetchOrder]);
  
  const demand = useMemo(() => getOrderDemand(currentOrder?.items), [currentOrder]);
  
  const handleViewLogs = async (task: ProductionTask) => {
    setSelectedTask(task);
    setLogLoading(true);
    setIsLogModalOpen(true);
    try {
        // **注意**: 此处假设你已在 service 中添加了获取日志的API
        // const logs = await logService.getLogsByTaskId(task.task_id);
        // setTaskLogs(logs);
        console.log("Fetching logs for task:", task.task_id); // 临时替代
        setTaskLogs([]); // 临时设置为空
    } catch (error) {
        message.error("获取日志失败");
    } finally {
        setLogLoading(false);
    }
  };

  if (planLoading || orderLoading || !currentPlan) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  const logColumns = [
      { title: '时间', dataIndex: 'log_time', key: 'log_time', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
      { title: '员工ID', dataIndex: 'worker_id', key: 'worker_id' }, // TODO: 关联员工姓名
      { title: '工序', dataIndex: 'process_name', key: 'process_name' },
      { title: '完成层数', dataIndex: 'layers_completed', key: 'layers_completed' },
  ];

  return (
    <>
      <Row align="middle" style={{ marginBottom: 16 }}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/monitoring')} style={{ marginRight: 8 }}>
          返回监控列表
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          计划详情: {currentPlan.plan_name}
        </Title>
      </Row>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="计划名称">{currentPlan.plan_name}</Descriptions.Item>
            <Descriptions.Item label="款号">{styleMap[currentPlan.style_id] || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="关联订单">{currentOrder?.order_number || '无'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(currentPlan.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Title level={4}>排版方案与进度</Title>

        <Collapse accordion defaultActiveKey={currentPlan.layouts?.[0]?.layout_id}>
          {currentPlan.layouts?.map(layout => {
            const output = calculateOutput(layout.tasks, layout.ratios);
            return (
              <Panel header={<Title level={5}>{layout.layout_name}</Title>} key={layout.layout_id}>
                <Row gutter={[32, 16]}>
                  <Col xs={24} lg={14}>
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
                          title: '进度', key: 'progress',
                          render: (_, record) => (
                            <Progress percent={record.planned_layers > 0 ? Math.round((record.completed_layers / record.planned_layers) * 100) : 0} />
                          ),
                        },
                        {
                            title: '操作', key: 'logs',
                            render: (_, task) => <Button size="small" onClick={() => handleViewLogs(task)}>查看日志</Button>
                        }
                      ]}
                    />
                  </Col>
                  <Col xs={24} lg={10}>
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
      </Space>

      <Modal
        title={`任务 [${selectedTask?.color} - ${selectedTask?.layout_name}] 的操作日志`}
        open={isLogModalOpen}
        onCancel={() => setIsLogModalOpen(false)}
        footer={null}
        width={800}
      >
        <Spin spinning={logLoading}>
            <Table
                size="small"
                rowKey="log_id"
                columns={logColumns}
                dataSource={taskLogs}
            />
        </Spin>
      </Modal>
    </>
  );
};

export default ProductionPlanDetail;