import React from 'react'
import { Typography, Row, Col, Card, Statistic } from 'antd'
import {
  TagsOutlined,
  UnorderedListOutlined,
  BlockOutlined,
  TeamOutlined,
} from '@ant-design/icons'

const { Title } = Typography

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>仪表板</Title>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="款号总数"
              value={0}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待完成任务"
              value={0}
              prefix={<UnorderedListOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="布匹库存"
              value={0}
              prefix={<BlockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="员工总数"
              value={0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard