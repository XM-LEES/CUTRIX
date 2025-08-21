import React, { useEffect, useState } from 'react';
import {
    Typography, Button, Table, Modal, Form, Input, message, Popconfirm,
    Space, Card, Row, Col, Tag, Select, Switch,
} from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useWorkerStore } from '../store/workerStore';
import { useAuthStore } from '../store/authStore';
import type { Worker } from '../types';
import { workerService } from '../services';

const { Title } = Typography;
const { Option } = Select;

const Workers: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const { workers, loading, fetchWorkers, createWorker, updateWorker, deleteWorker } = useWorkerStore();
    const { user: currentUser } = useAuthStore();
    const roleValue = Form.useWatch('role', form);

    useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

    const handleAction = async (action: () => Promise<any>, successMsg: string, errorMsg: string) => {
        try {
            await action();
            message.success(successMsg);
            // Close all modals and reset forms
            setIsModalOpen(false);
            setIsPasswordModalOpen(false);
            setEditingWorker(null);
            form.resetFields();
            passwordForm.resetFields();
            fetchWorkers(); // Refresh the table data
        } catch (err) {
            message.error((err as Error).message || errorMsg);
        }
    };

    const handleDelete = (id: number) => {
        handleAction(() => deleteWorker(id), '员工删除成功', '删除失败');
    };

    const onFinish = (values: any) => {
        if (editingWorker) {
            handleAction(() => updateWorker(editingWorker.worker_id, values), '员工更新成功', '更新失败');
        } else {
            handleAction(() => createWorker(values), '员工创建成功', '创建失败');
        }
    };

    const onPasswordFinish = (values: any) => {
        if (editingWorker) {
            handleAction(
                () => workerService.updateWorkerPassword(editingWorker.worker_id, { password: values.password }),
                '密码更新成功',
                '密码更新失败'
            );
        }
    };

    const handleOpenModal = (worker: Worker | null) => {
        setEditingWorker(worker);
        form.setFieldsValue(worker || { role: 'worker', is_active: true, notes: '', worker_group: '' });
        setIsModalOpen(true);
    };

    const handleOpenPasswordModal = (worker: Worker) => {
        setEditingWorker(worker);
        setIsPasswordModalOpen(true);
    };

    const handleModalCancel = () => {
        setIsModalOpen(false);
        setIsPasswordModalOpen(false);
        setEditingWorker(null);
        form.resetFields();
        passwordForm.resetFields();
    };

    const roleMap: Record<string, { text: string; color: string }> = {
        admin: { text: '管理员', color: 'red' },
        manager: { text: '车间主任', color: 'orange' },
        worker: { text: '员工', color: 'blue' },
        pattern_maker: { text: '打版员', color: 'green' },
    };

    const columns: TableProps<Worker>['columns'] = [
        { title: 'ID', dataIndex: 'worker_id', key: 'worker_id', width: 80 },
        { title: '姓名', dataIndex: 'name', key: 'name', width: 150 },
        { title: '备注', dataIndex: 'notes', key: 'notes', render: (notes: string) => notes || '-' },
        { title: '角色', dataIndex: 'role', key: 'role', width: 120, render: (role: string) => <Tag color={roleMap[role]?.color}>{roleMap[role]?.text || role}</Tag> },
        { title: '分组', dataIndex: 'worker_group', key: 'worker_group', width: 120, render: (group?: string) => group || '-' },
        { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 100, render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? '在职' : '离职'}</Tag> },
        {
            title: '操作',
            key: 'action',
            width: 240,
            render: (_: any, record: Worker) => {
                let canEdit = true;
                if (currentUser?.role === 'manager' && (record.role === 'admin' || record.worker_id === currentUser.worker_id)) {
                    canEdit = false;
                }
                let canChangePassword = true;
                if (currentUser?.role === 'manager' && record.role === 'admin') {
                    canChangePassword = false;
                }

                return (
                    <Space size="small">
                        <Button type="primary" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} disabled={!canEdit}>编辑</Button>
                        <Button icon={<KeyOutlined />} onClick={() => handleOpenPasswordModal(record)} disabled={!canChangePassword}>改密</Button>
                        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.worker_id)} disabled={record.role === 'admin'}>
                            <Button type="primary" danger icon={<DeleteOutlined />} disabled={record.role === 'admin'}>删除</Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    // 判断是否是管理员/主任在编辑自己的信息
    const isEditingSelf = editingWorker?.worker_id === currentUser?.worker_id;
    // 角色下拉菜单禁用条件：管理员在编辑自己时
    const isRoleSelectDisabled = isEditingSelf && currentUser?.role === 'admin';
    // 在职状态开关禁用条件：管理员或主任在编辑自己时
    const isStatusSwitchDisabled = isEditingSelf && (currentUser?.role === 'admin' || currentUser?.role === 'manager');
    // 姓名输入框禁用条件
    const isNameInputDisabled = isEditingSelf && currentUser?.role === 'admin';


    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col><Title level={2}>员工管理</Title></Col>
                <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>添加员工</Button></Col>
            </Row>
            <Card>
                <Table columns={columns} dataSource={workers} rowKey="worker_id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} />
            </Card>
            <Modal title={editingWorker ? "编辑员工" : "添加员工"} open={isModalOpen} onOk={form.submit} onCancel={handleModalCancel} confirmLoading={loading} width={600} destroyOnClose>
                <Form form={form} onFinish={onFinish} layout="vertical" initialValues={{ role: 'worker', is_active: true, notes: '', worker_group: '' }}>
                    {/* 管理员不能修改自己的名字 */}
                    <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                        <Input disabled={isNameInputDisabled} />
                    </Form.Item>
                    {!editingWorker && (
                         <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '创建新员工时必须设置初始密码', min: 6 }]}>
                            <Input.Password placeholder="请输入至少6位初始密码" />
                        </Form.Item>
                    )}
                    <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                           {/* 当管理员编辑自己时，显示禁用的、带中文的输入框 */}
                            {isRoleSelectDisabled ? (
                                <Form.Item label="角色">
                                    <Input
                                        value={roleMap[editingWorker?.role as string]?.text}
                                        disabled
                                    />
                                </Form.Item>
                            ) : (
                                <Form.Item name="role" label="角色" rules={[{ required: true }]}>
                                    <Select>
                                        {currentUser?.role === 'admin' && <Option value="manager">车间主任</Option>}
                                        <Option value="worker">员工</Option>
                                        <Option value="pattern_maker">打版员</Option>
                                    </Select>
                                </Form.Item>
                            )}
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="状态" valuePropName="checked">
                                <Switch checkedChildren="在职" unCheckedChildren="离职" disabled={isStatusSwitchDisabled} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {roleValue === 'worker' && <Form.Item name="worker_group" label="员工分组 (可选)"><Input placeholder="例如: A组, B组" /></Form.Item>}
                </Form>
            </Modal>
            <Modal title={`为 "${editingWorker?.name}" 修改密码`} open={isPasswordModalOpen} onOk={passwordForm.submit} onCancel={handleModalCancel} confirmLoading={loading} destroyOnClose>
                <Form form={passwordForm} onFinish={onPasswordFinish} layout="vertical">
                    <Form.Item name="password" label="新密码" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                        <Input.Password placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item name="confirm" label="确认新密码" dependencies={['password']} hasFeedback rules={[{ required: true, message: '请确认新密码!' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) { return Promise.resolve(); } return Promise.reject(new Error('两次输入的密码不一致!')); }, }),]}>
                        <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default Workers;