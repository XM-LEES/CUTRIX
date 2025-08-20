import React, { useEffect, useState } from 'react'
import { Typography, Button, Table, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useStyleStore } from '../store'

const { Title } = Typography

const Styles: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const { 
    styles, 
    loading, 
    error, 
    fetchStyles, 
    createStyle 
  } = useStyleStore()

  useEffect(() => {
    fetchStyles()
  }, [fetchStyles])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'style_id',
      key: 'style_id',
    },
    {
      title: '款号',
      dataIndex: 'style_number',
      key: 'style_number',
    },
  ]

  const handleCreate = async (values: { style_number: string }) => {
    try {
      await createStyle(values.style_number)
      setIsModalOpen(false)
      form.resetFields()
      message.success('款号创建成功')
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
        <Title level={2}>款号管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新增款号
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={styles}
        rowKey="style_id"
        loading={loading}
      />

      <Modal
        title="新增款号"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={form.submit}
        confirmLoading={loading}
      >
        <Form form={form} onFinish={handleCreate}>
          <Form.Item
            name="style_number"
            label="款号"
            rules={[{ required: true, message: '请输入款号' }]}
          >
            <Input placeholder="请输入款号，如：BEE3TS111" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Styles