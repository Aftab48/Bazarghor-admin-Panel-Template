import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Dropdown, Modal, message, Tag, Avatar } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { usersAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';

const CustomerList = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getCustomers();
      setCustomers(data);
      setPagination({ ...pagination, total: data.length });
    } catch {
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, userId) => {
    try {
      switch (action) {
        case 'activate':
          await usersAPI.activateUser(userId);
          setCustomers(customers.map(c => 
            c.id === userId ? { ...c, status: 'active' } : c
          ));
          message.success('Customer activated successfully');
          break;
        case 'deactivate':
          await usersAPI.deactivateUser(userId);
          setCustomers(customers.map(c => 
            c.id === userId ? { ...c, status: 'inactive' } : c
          ));
          message.success('Customer deactivated successfully');
          break;
        case 'suspend':
          await usersAPI.suspendUser(userId);
          setCustomers(customers.map(c => 
            c.id === userId ? { ...c, status: 'suspended' } : c
          ));
          message.success('Customer suspended successfully');
          break;
        case 'reset-password':
          await usersAPI.resetPassword(userId);
          message.success('Password reset email sent');
          break;
        case 'delete':
          Modal.confirm({
            title: 'Are you sure you want to delete this customer?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            onOk: async () => {
              await usersAPI.deleteUser(userId);
              setCustomers(customers.filter(c => c.id !== userId));
              message.success('Customer deleted successfully');
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
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
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
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a, b) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount) => `₹${amount}`,
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Joined Date',
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Customer
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search customers..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default CustomerList;

