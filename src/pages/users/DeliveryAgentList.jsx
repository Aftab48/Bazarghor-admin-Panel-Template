import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Dropdown, Modal, message, Avatar, Tag } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { usersAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';

const DeliveryAgentList = () => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getDeliveryAgents();
      setAgents(data);
      setPagination({ ...pagination, total: data.length });
    } catch (error) {
      message.error('Failed to fetch delivery agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, userId) => {
    try {
      switch (action) {
        case 'activate':
          await usersAPI.activateUser(userId);
          setAgents(agents.map(a => 
            a.id === userId ? { ...a, status: 'active' } : a
          ));
          message.success('Agent activated successfully');
          break;
        case 'deactivate':
          await usersAPI.deactivateUser(userId);
          setAgents(agents.map(a => 
            a.id === userId ? { ...a, status: 'inactive' } : a
          ));
          message.success('Agent deactivated successfully');
          break;
        case 'suspend':
          await usersAPI.suspendUser(userId);
          setAgents(agents.map(a => 
            a.id === userId ? { ...a, status: 'suspended' } : a
          ));
          message.success('Agent suspended successfully');
          break;
        case 'reset-password':
          await usersAPI.resetPassword(userId);
          message.success('Password reset email sent');
          break;
        case 'delete':
          Modal.confirm({
            title: 'Are you sure you want to delete this agent?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            onOk: async () => {
              await usersAPI.deleteUser(userId);
              setAgents(agents.filter(a => a.id !== userId));
              message.success('Agent deleted successfully');
            },
          });
          return;
      }
    } catch {
      message.error('Action failed');
    }
  };

  const getActionMenu = (record) => ({
    items: [
      {
        key: 'view',
        icon: <EditOutlined />,
        label: 'View Details',
      },
      {
        type: 'divider',
      },
      {
        key: 'activate',
        icon: <CheckCircleOutlined />,
        label: 'Activate',
        onClick: () => handleAction('activate', record.id),
        disabled: record.status === 'active',
      },
      {
        key: 'deactivate',
        icon: <StopOutlined />,
        label: 'Deactivate',
        onClick: () => handleAction('deactivate', record.id),
        disabled: record.status === 'inactive',
      },
      {
        key: 'suspend',
        icon: <LockOutlined />,
        label: 'Suspend',
        onClick: () => handleAction('suspend', record.id),
        disabled: record.status === 'suspended',
      },
      {
        type: 'divider',
      },
      {
        key: 'reset-password',
        label: 'Reset Password',
        onClick: () => handleAction('reset-password', record.id),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => handleAction('delete', record.id),
      },
    ],
  });

  const columns = [
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Suspended', value: 'suspended' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Vehicle',
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
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      render: (amount) => `₹${amount.toLocaleString()}`,
      sorter: (a, b) => a.earnings - b.earnings,
    },
    {
      title: 'Joined',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
      sorter: (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchText.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Delivery Agents</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Agent
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search agents..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredAgents}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default DeliveryAgentList;

