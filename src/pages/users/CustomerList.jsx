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
      console.log("📦 Customers data received:", data);
      if (Array.isArray(data)) {
        setCustomers(data);
        setPagination({ ...pagination, total: data.length });
      } else {
        console.warn("⚠️ Customers data is not an array:", data);
        setCustomers([]);
        setPagination({ ...pagination, total: 0 });
      }
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      message.error(`Failed to fetch customers: ${error.message || 'Unknown error'}`);
      setCustomers([]);
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
      render: (text, record) => {
        if (!record) return '-';
        const name = text || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A';
        const email = record.email || 'N/A';
        const avatar = record.avatar || record.profilePicture?.uri || record.profilePicture;
        return (
          <Space>
            <Avatar src={avatar} icon={<UserOutlined />} />
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
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (count) => count || 0,
      sorter: (a, b) => (a.totalOrders || 0) - (b.totalOrders || 0),
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
    },
    {
      title: 'Joined Date',
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

  const filteredCustomers = customers.filter(
    (customer) => {
      if (!customer) return false;
      const name = (customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const search = searchText.toLowerCase();
      return name.includes(search) || email.includes(search);
    }
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
        dataSource={filteredCustomers || []}
        rowKey={(record) => record?.id || record?._id || Math.random()}
        loading={loading}
        pagination={{
          ...pagination,
          total: filteredCustomers?.length || 0,
          showTotal: (total) => `Total ${total} customers`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{ emptyText: 'No customers found' }}
      />
    </div>
  );
};

export default CustomerList;

