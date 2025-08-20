import React, { useEffect, useState } from 'react'
import { Typography, Button, Table, Modal, Form, Input, InputNumber, Select, message, Progress } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTaskStore, useStyleStore } from '../store'
import type { ProductionTask } from '../types'

const { Title } = Typography
const { Option } = Select

const Tasks: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const { 
    tasks, 
    loading, 
    error, 
    fetchTasks, 
    createTask 
  } = useTaskStore()
  const { styles, fetchStyles } = useStyleStore()

  useEffect(() => {
    fetchTasks()
    fetchStyles()
  }, [fetchTasks, fetchStyles])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'task_id',
      key: 'task_id',
    },
    {
      title: '版号',
      dataIndex: 'marker_id',
      key: 'marker_id',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
    },
    {
      title: '计划层数',
      dataIndex: 'planned_layers',
      key: 'planned_layers',
    },
    {
      title: '已完成层数',
      dataIndex: 'completed_layers',
      key: 'completed_layers',
    },
    {
      title: '进度',
      key: 'progress',
      render: (record: ProductionTask) => {
        const progress = record.planned_layers > 0 
          ? Math.round((record.completed_layers / record.planned_layers) * 100)
          : 0
        return <Progress percent={progress} />
      }
    },
  ]

  const handleCreate = async (values: any) => {
    try {
      await createTask(values)
      setIsModalOpen(false)
      form.resetFields()
      message.success('任务创建成功')
    } catch (error) {
      message.error('创建失败')
    }
  }

  if (error) {
    message.error(error)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>生产任务</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新增任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="task_id"
        loading={loading}
      />

      <Modal
        title="新增生产任务"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={form.submit}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="style_id"
            label="款号"
            rules={[{ required: true, message: '请选择款号' }]}
          >
            <Select placeholder="请选择款号">
              {styles.map(style => (
                <Option key={style.style_id} value={style.style_id}>
                  {style.style_number}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="marker_id"
            label="版号"
            rules={[{ required: true, message: '请输入版号' }]}
          >
            <Input placeholder="请输入版号，如：321.1" />
          </Form.Item>

          <Form.Item
            name="color"
            label="颜色"
            rules={[{ required: true, message: '请输入颜色' }]}
          >
            <Input placeholder="请输入颜色，如：韩白" />
          </Form.Item>

          <Form.Item
            name="planned_layers"
            label="计划层数"
            rules={[{ required: true, message: '请输入计划层数' }]}
          >
            <InputNumber min={1} placeholder="请输入计划层数" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Tasks