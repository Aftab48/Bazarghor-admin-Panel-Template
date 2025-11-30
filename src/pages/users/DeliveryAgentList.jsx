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
      console.log("📦 Delivery agents data received:", data);
      if (Array.isArray(data)) {
        setAgents(data);
        setPagination({ ...pagination, total: data.length });
      } else {
        console.warn("⚠️ Delivery agents data is not an array:", data);
        setAgents([]);
        setPagination({ ...pagination, total: 0 });
      }
    } catch (error) {
      console.error("❌ Error fetching delivery agents:", error);
      message.error(`Failed to fetch delivery agents: ${error.message || 'Unknown error'}`);
      setAgents([]);
      setPagination({ ...pagination, total: 0 });
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
      render: (text, record) => {
        if (!record) return '-';
        const name = text || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A';
        const email = record.email || 'N/A';
        const avatar = record.avatar || record.profilePicture?.uri || record.profilePicture;
        return (
          <Space>
            <Avatar src={avatar} />
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-xs text-gray-500">{email}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone, record) => phone || record.mobNo || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === undefined || status === null) return <StatusTag status="unknown" />;
        return <StatusTag status={status} />;
      },
      filters: [
        { text: 'Pending', value: 1 },
        { text: 'Approved', value: 2 },
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Suspended', value: 'suspended' },
      ],
      onFilter: (value, record) => {
        if (typeof value === 'number') {
          return record.status === value;
        }
        return String(record.status).toLowerCase() === String(value).toLowerCase();
      },
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      render: (vehicle, record) => {
        const vehicleType = vehicle || record?.vehicleDetails?.vehicleType || 'N/A';
        return (
          <Space>
            <CarOutlined />
            {vehicleType}
          </Space>
        );
      },
    },
    {
      title: 'Orders Delivered',
      dataIndex: 'ordersDelivered',
      key: 'ordersDelivered',
      render: (count) => count || 0,
      sorter: (a, b) => (a.ordersDelivered || 0) - (b.ordersDelivered || 0),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <StarOutlined className="text-yellow-500" />
          {rating || 0}
        </Space>
      ),
      sorter: (a, b) => parseFloat(a.rating || 0) - parseFloat(b.rating || 0),
    },
    {
      title: 'Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.earnings || 0) - (b.earnings || 0),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a, b) => {
        const dateA = a.joinedDate ? new Date(a.joinedDate) : new Date(0);
        const dateB = b.joinedDate ? new Date(b.joinedDate) : new Date(0);
        return dateA - dateB;
      },
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
    (agent) => {
      if (!agent) return false;
      const name = (agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || '').toLowerCase();
      const email = (agent.email || '').toLowerCase();
      const search = searchText.toLowerCase();
      return name.includes(search) || email.includes(search);
    }
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
        dataSource={filteredAgents || []}
        rowKey={(record) => record?.id || record?._id || Math.random()}
        loading={loading}
        pagination={{
          ...pagination,
          total: filteredAgents?.length || 0,
          showTotal: (total) => `Total ${total} delivery agents`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{ emptyText: 'No delivery agents found' }}
      />
    </div>
  );
};

export default DeliveryAgentList;

