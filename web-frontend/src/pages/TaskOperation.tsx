import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Typography, message, Card, Tag, Collapse } from 'antd';
import { LeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import type { ProductionTask } from '../types';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const KeypadButton = ({ value, onClick, children, className = '' }: any) => (
    <Button style={{ height: 70, fontSize: 28, fontWeight: 500 }} className={className} onClick={() => onClick(value)}>
        {children || value}
    </Button>
);

const TaskOperation: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { currentPlan, loading, fetchPlanForTask, submitLog } = useTaskStore();

    const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);
    const [inputValue, setInputValue] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (planId) {
            fetchPlanForTask(Number(planId));
        }
    }, [planId, fetchPlanForTask]);

    // **修改点**: 使用 useMemo 优化，并找到第一个未完成的任务所在的版
    const firstUnfinishedLayoutId = useMemo(() => {
        if (!currentPlan) return null;
        const layout = currentPlan.layouts?.find(l => 
            l.tasks?.some(t => t.completed_layers < t.planned_layers)
        );
        return layout?.layout_id;
    }, [currentPlan]);

    useEffect(() => {
        // 当 currentPlan 加载或更新时，默认选中第一个未完成的任务
        if (currentPlan) {
            const firstUnfinishedTask = currentPlan.layouts
                ?.flatMap(l => l.tasks || [])
                .find(t => t.completed_layers < t.planned_layers);
            setSelectedTask(firstUnfinishedTask || null);
        }
    }, [currentPlan]);

    const handleKeyPress = (key: string) => {
        if (key === 'C') {
            setInputValue('0');
        } else if (key === 'Del') {
            setInputValue(inputValue.length > 1 ? inputValue.slice(0, -1) : '0');
        } else {
            // 限制输入长度，防止数值过大
            if (inputValue.length >= 5) return;
            setInputValue(inputValue === '0' ? key : inputValue + key);
        }
    };

    const handleSubmit = async () => {
        const layers = parseInt(inputValue, 10);
        if (!layers || layers <= 0) {
            message.error("请输入有效的层数");
            return;
        }
        if (!selectedTask || !user) {
            message.error("未选择任务或用户信息丢失");
            return;
        }
        
        const log = {
            task_id: selectedTask.task_id,
            worker_id: user.worker_id,
            process_name: '拉布' as const, // 明确类型
            layers_completed: layers,
        };

        setIsSubmitting(true);
        try {
            await submitLog(log);
            message.success("记录提交成功！");
            setInputValue('0');
        } catch (error) {
            message.error((error as Error).message || "提交失败");
        } finally {
            setIsSubmitting(false);
        }
    };

    const headerStyle: React.CSSProperties = {
        background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #f0f0f0', height: 64, flexShrink: 0
    };

    if (loading || !currentPlan) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
    }
    
    // **核心修改点**: 任务列表现在按“版”分组渲染
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
            <header style={headerStyle}>
                <Button type="text" icon={<LeftOutlined />} onClick={() => navigate('/')} style={{fontSize: 16}}>返回工作台</Button>
                <div style={{textAlign: 'center'}}>
                    <Title level={4} style={{ margin: 0 }}>{currentPlan.plan_name}</Title>
                    <Text type="secondary">款号: {currentPlan.style_number}</Text>
                </div>
                <div style={{width: 120}} /> 
            </header>

            <main style={{ padding: 24, flexGrow: 1, display: 'flex', gap: 24, overflow: 'hidden' }}>
                <Card title="选择任务" bodyStyle={{ padding: 0, overflowY: 'auto' }} style={{ width: 450, display: 'flex', flexDirection: 'column' }}>
                    <Collapse accordion defaultActiveKey={firstUnfinishedLayoutId ? String(firstUnfinishedLayoutId) : undefined} ghost>
                        {currentPlan.layouts?.map(layout => (
                            <Panel header={<Title level={5} style={{margin: 0}}>{layout.layout_name}</Title>} key={layout.layout_id}>
                                {layout.tasks?.map(task => (
                                    <div
                                        key={task.task_id}
                                        onClick={() => { setInputValue('0'); setSelectedTask(task); }}
                                        style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', backgroundColor: selectedTask?.task_id === task.task_id ? '#e6f4ff' : 'white', borderRight: selectedTask?.task_id === task.task_id ? '4px solid #1677ff' : 'none' }}
                                    >
                                        <Text style={{ fontSize: 18, fontWeight: 500 }}>{task.color}</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                            <Text type="secondary">{task.completed_layers} / {task.planned_layers} 层</Text>
                                            {task.completed_layers >= task.planned_layers 
                                                ? <Tag color="success">已完成</Tag>
                                                : <Tag color="processing">还少 {task.planned_layers - task.completed_layers} 层</Tag>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </Panel>
                        ))}
                    </Collapse>
                </Card>

                <Card style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {selectedTask ? (
                    <>
                        <Title level={4} style={{marginTop: 0}}>
                            正在为 <Tag color="blue" style={{fontSize: 18, padding: '4px 8px'}}>{selectedTask.layout_name}</Tag>
                            的 <Text style={{color: '#1677ff'}}>{selectedTask?.color}</Text> 录入本次完成层数
                        </Title>
                        <div style={{ flexGrow: 1, display: 'flex', gap: 24, alignItems: 'stretch' }}>
                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ backgroundColor: '#f0f2f5', borderRadius: 8, padding: 24, textAlign: 'right', fontSize: 80, fontWeight: 'bold', color: '#1677ff', lineHeight: 1, overflow: 'hidden' }}>
                                    {inputValue}
                                </div>
                                <Button type="primary" style={{ width: '100%', height: 80, fontSize: 24 }} onClick={handleSubmit} loading={isSubmitting}>提交记录</Button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, width: 320 }}>
                                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => <KeypadButton key={k} value={k} onClick={handleKeyPress} />)}
                                <KeypadButton value="C" onClick={handleKeyPress} className="clear" danger>C</KeypadButton>
                                <KeypadButton value="0" onClick={handleKeyPress} />
                                <KeypadButton value="Del" onClick={handleKeyPress}><DeleteOutlined /></KeypadButton>
                            </div>
                        </div>
                    </>
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                            <Text type="secondary">请从左侧选择一个任务开始操作</Text>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
};

export default TaskOperation;