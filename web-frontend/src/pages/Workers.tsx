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
  Switch
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWorkerStore } from '../store';
import type { Worker } from '../types';

const { Title } = Typography;

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
    deleteWorker 
  } = useWorkerStore();

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
    } catch (error) {
      message.error('创建失败');
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
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWorker(id);
      message.success('员工删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    form.setFieldsValue({
      name: worker.name,
      notes: worker.notes,
      role: worker.role,
      is_active: worker.is_active,
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
  const { Option } = Select; // 在 columns 定义前加上这句

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
      render: (role: string) => role === 'admin' ? '管理员' : '员工',
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
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
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
                  <Option value="worker">员工</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="状态" valuePropName="checked">
                <Switch checkedChildren="在职" unCheckedChildren="离职" />
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </Modal>
    </div>
  );
};

export default Workers;