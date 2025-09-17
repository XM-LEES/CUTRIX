import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Progress, Spin, Typography, Row, Tag, Button, Space } from 'antd';
import { LogoutOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';

const { Title, Text } = Typography;

const WorkerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { taskGroups, loading, fetchWorkerTaskGroups } = useTaskStore();

    useEffect(() => {
        if (user?.worker_id) {
            fetchWorkerTaskGroups(user.worker_id);
        }
    }, [user, fetchWorkerTaskGroups]);

    const urgentPlans = taskGroups.filter(p => p.plan_name.includes("紧急")).length;

    const headerStyle: React.CSSProperties = {
        background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #f0f0f0', height: 64, flexShrink: 0
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
            <header style={headerStyle}>
                <Title level={3} style={{ margin: 0 }}>CUTRIX 工人工作台</Title>
                <Space size="large">
                    <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ fontSize: 16 }}>{user?.name}</Text><br/>
                        <Text type="secondary">工号: {user?.worker_id}</Text>
                    </div>
                    <Button icon={<HistoryOutlined />}>我的记录</Button>
                    <Button danger icon={<LogoutOutlined />} onClick={logout}>退出登录</Button>
                </Space>
            </header>
            <main style={{ padding: '24px', flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: '20px', flexShrink: 0 }}>
                    <Title level={3} style={{ margin: 0 }}>我的任务</Title>
                    <Space>
                        <Tag color="blue">共 {taskGroups.length} 项</Tag>
                        {urgentPlans > 0 && <Tag color="red">{urgentPlans} 项紧急</Tag>}
                    </Space>
                </Row>

                {loading ? (
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>
                ) : (
                    <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
                        {taskGroups.map(group => {
                            const progress = group.total_planned > 0 ? Math.round((group.total_completed / group.total_planned) * 100) : 0;
                            return (
                                <Card
                                    key={group.plan_id}
                                    hoverable
                                    style={{ marginBottom: 16, borderLeft: group.plan_name.includes("紧急") ? '4px solid #cf1322' : '4px solid #1677ff' }}
                                    onClick={() => navigate(`/task/${group.plan_id}`)}
                                >
                                    <Title level={4} style={{marginTop: 0}}>{group.plan_name}</Title>
                                    <Text type="secondary" style={{fontSize: 16}}>款号: {group.style_number}</Text>
                                    <Progress percent={progress} strokeWidth={16} />
                                    <Text style={{ fontSize: 18, marginTop: 8, display: 'block', fontWeight: 500 }}>{group.total_completed} / {group.total_planned} 层</Text>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WorkerDashboard;