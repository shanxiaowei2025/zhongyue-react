import { Card, Row, Col, Statistic } from 'antd'
import { UserOutlined, TeamOutlined, LockOutlined, FileOutlined } from '@ant-design/icons'

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="用户总数" value={1128} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="角色总数" value={8} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="权限总数" value={32} prefix={<LockOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="文件总数" value={256} prefix={<FileOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
