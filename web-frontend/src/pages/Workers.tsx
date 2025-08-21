import React, { useEffect, useState } from 'react';
import {
    Typography,
    Button,
    Table,
    Modal,
    Form,
    Input,
    message,
    Popconfirm,
    Space,
    Card,
    Row,
    Col,
    Tag,
    Select,
    Switch,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWorkerStore } from '../store/workerStore';
import { useAuthStore } from '../store/authStore';
import type { Worker } from '../types';

const { Title } = Typography;
const { Option } = Select;

const Workers: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [form] = Form.useForm();

    const {
        workers,
        loading,
        error,
        fetchWorkers,
        createWorker,
        updateWorker,
        deleteWorker,
    } = useWorkerStore();
    
    // 获取当前登录的用户信息，用于权限判断
    const { user: currentUser } = useAuthStore();

    // 监听表单中 'role' 字段的变化，以动态显示/隐藏“分组”输入框
    const roleValue = Form.useWatch('role', form);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    const handleCreate = async (values: any) => {
        try {
            await createWorker(values);
            setIsModalOpen(false);
            form.resetFields();
            message.success('员工创建成功');
        } catch (err) {
            message.error((err as Error).message || '创建失败，请检查输入');
        }
    };

    const handleUpdate = async (values: any) => {
        if (!editingWorker) return;

        try {
            await updateWorker(editingWorker.worker_id, values);
            setIsModalOpen(false);
            form.resetFields();
            setEditingWorker(null);
            message.success('员工更新成功');
        } catch (err) {
            message.error((err as Error).message || '更新失败，请检查输入');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteWorker(id);
            message.success('员工删除成功');
        } catch (err) {
            message.error((err as Error).message || '删除失败');
        }
    };
    
    const handleEdit = (worker: Worker) => {
        setEditingWorker(worker);
        form.setFieldsValue({
          ...worker,
        });
        setIsModalOpen(true);
      };

    const handleModalOk = () => {
        form.submit();
    };

    const handleModalCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
        setEditingWorker(null);
    };

    const onFinish = (values: any) => {
        if (editingWorker) {
            handleUpdate(values);
        } else {
            handleCreate(values);
        }
    };

    const roleMap: Record<string, { text: string; color: string }> = {
        admin: { text: '管理员', color: 'red' },
        manager: { text: '车间主任', color: 'orange' },
        worker: { text: '员工', color: 'blue' },
        pattern_maker: { text: '打版员', color: 'green' },
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'worker_id',
            key: 'worker_id',
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '备注',
            dataIndex: 'notes',
            key: 'notes',
            render: (notes: string) => notes || '-',
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Tag color={roleMap[role]?.color}>{roleMap[role]?.text || role}</Tag>,
        },
        {
            title: '分组',
            dataIndex: 'worker_group',
            key: 'worker_group',
            render: (group?: string) => group || '-',
        },
        {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? '在职' : '离职'}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Worker) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size="small"
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这个员工吗？"
                        onConfirm={() => handleDelete(record.worker_id)}
                        okText="确定"
                        cancelText="取消"
                        disabled={record.role === 'admin'} // 关键：禁止删除管理员
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            disabled={record.role === 'admin'} // 关键：禁用管理员的删除按钮
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={2}>员工管理</Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        添加员工
                    </Button>
                </Col>
            </Row>

            <Card>
                <Table
                    columns={columns}
                    dataSource={workers}
                    rowKey="worker_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                />
            </Card>

            <Modal
                title={editingWorker ? "编辑员工" : "添加员工"}
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                confirmLoading={loading}
                width={600}
                destroyOnClose // 保证每次打开弹窗时都重新渲染
            >
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    initialValues={{ notes: '', role: 'worker', is_active: true }}
                >
                    <Form.Item
                        name="name"
                        label="姓名"
                        rules={[{ required: true, message: '请输入员工姓名' }]}
                    >
                        <Input placeholder="请输入员工姓名" />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="备注"
                        rules={[{ max: 150, message: '备注不能超过150个字符' }]}
                    >
                        <Input.TextArea
                            placeholder="请输入备注信息（可选，最多150字符）"
                            rows={4}
                            maxLength={150}
                            showCount
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                                <Select>
                                    {/* 权限控制：只有 admin 可以设置 admin 和 manager 角色 */}
                                    {currentUser?.role === 'admin' && <Option value="admin">管理员</Option>}
                                    {currentUser?.role === 'admin' && <Option value="manager">车间主任</Option>}
                                    <Option value="worker">员工</Option>
                                    <Option value="pattern_maker">打版员</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="状态" valuePropName="checked">
                                <Switch checkedChildren="在职" unCheckedChildren="离职" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* 动态显示的分组输入框，仅当角色为 'worker' 时出现 */}
                    {roleValue === 'worker' && (
                        <Form.Item name="worker_group" label="员工分组 (可选)">
                            <Input placeholder="例如: A组, B组" />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default Workers;