import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, message, Tabs, Avatar, Statistic, Row, Col } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CarOutlined,
  DollarOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { deliveryAgentsAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';

const DeliveryAgentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const [pending, payoutData] = await Promise.all([
        deliveryAgentsAPI.getPendingApprovals(),
        deliveryAgentsAPI.getPayouts(),
      ]);
      setPendingAgents(pending);
      setPayouts(payoutData);
      setActiveAgents(payoutData.filter(a => a.status === 'active'));
    } catch {
      message.error('Failed to fetch delivery agents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agentId) => {
    try {
      await deliveryAgentsAPI.approveAgent(agentId);
      
      // Find the approved agent in pending list
      const approvedAgent = pendingAgents.find(a => a.id === agentId);
      if (approvedAgent) {
        // Remove from pending
        setPendingAgents(pendingAgents.filter(a => a.id !== agentId));
        // Add to active with updated status and pending payout
        const activeAgent = { ...approvedAgent, status: 'active', pendingPayout: Math.floor(approvedAgent.earnings * 0.3) };
        setActiveAgents([...activeAgents, activeAgent]);
        setPayouts([...payouts, activeAgent]);
      }
      
      message.success('Agent approved successfully');
    } catch {
      message.error('Failed to approve agent');
    }
  };

  const handleReject = async (agentId) => {
    Modal.confirm({
      title: 'Reject Agent?',
      content: 'Are you sure you want to reject this agent application?',
      okText: 'Yes, Reject',
      okType: 'danger',
      onOk: async () => {
        try {
          await deliveryAgentsAPI.rejectAgent(agentId);
          // Remove from pending list
          setPendingAgents(pendingAgents.filter(a => a.id !== agentId));
          message.success('Agent rejected');
        } catch {
          message.error('Failed to reject agent');
        }
      },
    });
  };

  const pendingColumns = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Vehicle Type',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (vehicle) => (
        <Space>
          <CarOutlined />
          {vehicle}
        </Space>
      ),
    },
    {
      title: 'License Number',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: 'Applied Date',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const performanceColumns = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} />
          {text}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Orders Delivered',
      dataIndex: 'ordersDelivered',
      key: 'ordersDelivered',
      sorter: (a, b) => a.ordersDelivered - b.ordersDelivered,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <StarOutlined className="text-yellow-500" />
          {rating}
        </Space>
      ),
      sorter: (a, b) => parseFloat(a.rating) - parseFloat(b.rating),
    },
    {
      title: 'Total Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      render: (amount) => `₹${amount.toLocaleString()}`,
      sorter: (a, b) => a.earnings - b.earnings,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button size="small">View Details</Button>
      ),
    },
  ];

  const payoutColumns = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} />
          {text}
        </Space>
      ),
    },
    {
      title: 'Total Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      render: (amount) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Pending Payout',
      dataIndex: 'pendingPayout',
      key: 'pendingPayout',
      render: (amount) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button type="primary" size="small">
          Process Payout
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: `Pending Approvals (${pendingAgents.length})`,
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingAgents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'performance',
      label: 'Performance',
      children: (
        <div>
          <Row gutter={16} className="mb-6">
            <Col span={8}>
              <Card>
                <Statistic
                  title="Active Agents"
                  value={activeAgents.length}
                  prefix={<CarOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Deliveries"
                  value={activeAgents.reduce((sum, a) => sum + (a.ordersDelivered || 0), 0)}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Average Rating"
                  value={(activeAgents.reduce((sum, a) => sum + parseFloat(a.rating || 0), 0) / (activeAgents.length || 1)).toFixed(1)}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={performanceColumns}
            dataSource={activeAgents}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
    {
      key: 'payouts',
      label: 'Payouts',
      children: (
        <Table
          columns={payoutColumns}
          dataSource={payouts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Delivery Agent Management</h1>
      <Tabs items={tabItems} />
    </div>
  );
};

export default DeliveryAgentManagement;

